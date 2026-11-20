import {Grid,medianFrames} from './core.js?v=0.1.1';
import {SerialClient,delay,responseTimeout} from './serial.js?v=0.1.1';
export class SensorSession {
  constructor({port=null,baud=0,grid=null,demo=false,excludeReferenceColumn=false,onStatus=()=>{},onConnect=()=>{},onPacket=()=>{},onCalibration=()=>{},clientFactory=(port,baud)=>new SerialClient(port,baud)}){
    Object.assign(this,{port,baud,grid,demo,excludeReferenceColumn,onStatus,onConnect,onPacket,onCalibration});
    this.clientFactory=clientFactory;this.stopped=false;this.calibrationRequested=false;this.client=null;this.version=1;this.sequence=0;
  }
  check(){if(this.stopped)throw new Error('Connection cancelled.');}
  async sleep(ms){const end=performance.now()+ms;while(!this.stopped&&performance.now()<end)await delay(Math.min(20,end-performance.now()));this.check();}
  async verifyChannels(client) {
    let previous = null;
    this.onStatus('Checking sensor channels before acquisition…');
    for (let attempt = 0; attempt < 5; attempt++) {
      this.check();
      const channels = await client.command('channelCheck', {timeout:1000});
      this.check();
      let grid;
      try { grid = Grid.fromChannels(channels, {excludeReferenceColumn:this.excludeReferenceColumn}); }
      catch { previous = null; await this.sleep(150); continue; }
      if (previous && channels.every((value, i) => value === previous[i])) {
        if (this.grid && (this.grid.rows !== grid.rows || this.grid.columns !== grid.columns))
          throw new Error(`Selected grid ${this.grid.rows} × ${this.grid.columns} disagrees with verified sensor grid ${grid.rows} × ${grid.columns}. Choose Auto or the matching grid. Only exclude a reference column if your sensor has one.`);
        this.onStatus(`Channels verified twice: drive ${channels[0]}, sense ${channels[1]} → ${grid.rows} rows × ${grid.columns} columns${this.excludeReferenceColumn ? ' (last reference column excluded)' : ' (all channels)'}. Checking first frame…`);
        return {grid, channels};
      }
      previous = channels;
      await this.sleep(150);
    }
    throw new Error('Channel check failed: no two consecutive matching valid replies. Acquisition has not started. Check the sensor, cable and baud rate, then reconnect.');
  }
  async connect(){
    if(this.demo){this.grid ||= new Grid(5,5);this.baseline=Array(this.grid.size).fill(1000);return {port:'DEMO',baud:0,demo:true,baseline_source:'synthetic baseline'};}
    const rates=this.baud?[this.baud]:[115200,9600],errors=[];
    for(const baud of rates){
      this.check();this.onStatus(`Opening sensor at ${baud.toLocaleString()} baud…`);
      const client=this.client=this.clientFactory(this.port,baud);
      try{
        await client.open();await this.sleep(2000);client.discard();
        const {grid,channels}=await this.verifyChannels(client);
        const payloadValues=channels[0]*channels[1];
        let values=null;
        for(let i=0;i<3&&!values;i++){this.check();values=await client.command('readRaw',{timeout:responseTimeout(payloadValues,baud)});}
        if(!values)throw new Error('No complete frames. Check firmware, baud rate and cable.');
        if(values.length!==payloadValues)throw new Error(`Channel/frame mismatch: channelCheck reports drive ${channels[0]} × sense ${channels[1]} (${payloadValues} values), but the frame contains ${values.length}. Acquisition has not started.`);
        const raw=grid.extract(values);client.expected=payloadValues;
        this.check();let calibration=await client.command('readCal'),origin='stored sensor baseline';
        if(calibration)this.baseline=grid.extract(calibration);
        else{
          this.onStatus('No stored baseline. Keep sensor untouched; collecting 20 baseline frames…');
          const frames=[raw];
          for(let i=1;i<20;i++){this.check();const frame=await client.command('readRaw');if(!frame)throw new Error('Baseline acquisition failed. Reconnect the sensor.');frames.push(grid.extract(frame));}
          this.baseline=medianFrames(frames);origin='20-frame software baseline';
        }
        this.grid=grid;this.baud=baud;
        return {port:'Web Serial',usb:this.port.getInfo(),baud,demo:false,baseline_source:origin,
          channels:{drive:channels[0],sense:channels[1],reference_column_excluded:this.excludeReferenceColumn,payload_values:payloadValues,verified_reads:2}};
      }catch(e){await client.close();errors.push(e.message);this.check();}
    }
    throw new Error(errors.join(' / '));
  }
  calibrate(){this.calibrationRequested=true;}
  async run(){
    try{
      const source=await this.connect();this.check();this.onConnect(this.grid,source);
      this.onStatus(`${this.demo?'DEMO · synthetic data':'Sensor connected'} · ${source.baseline_source}`);
      const started=performance.now();let misses=0;
      while(!this.stopped){
        if(this.calibrationRequested){
          this.calibrationRequested=false;this.onStatus('Updating baseline — keep the sensor untouched…');
          try{
            let next;
            if(this.demo)next=Array(this.grid.size).fill(1000);
            else {let values=await this.client.command('updateCal');this.check();if(!values)values=await this.client.command('readCal');if(!values)throw new Error('No calibration response. Previous baseline retained.');next=this.grid.extract(values);}
            this.check();this.baseline=next;this.version++;this.onCalibration(true);this.onStatus('Baseline updated. Signed difference = raw − baseline.');
          }catch(e){this.check();this.onCalibration(false);this.onStatus(`Calibration failed: ${e.message}`);}
        }
        let raw;
        if(this.demo){
          const t=(performance.now()-started)/1000,rows=this.grid.rows,cols=this.grid.columns;
          const cr=(rows-1)*(.5+.35*Math.sin(t*.7)),cc=(cols-1)*(.5+.35*Math.cos(t*.5)),width=Math.max(1,Math.min(rows,cols)/6);
          raw=Array.from({length:this.grid.size},(_,i)=>1000+160*Math.sin(t)*Math.exp(-((i%rows-cr)**2+(Math.floor(i/rows)-cc)**2)/(2*width**2))+(Math.random()-.5)*4);
        }else{
          const values=await this.client.command('readRaw');this.check();
          if(!values){misses++;this.onStatus(`Waiting for a complete frame (${misses}/5)…`);if(misses>=5)throw new Error('Sensor stopped replying. Check the cable and reconnect.');await this.sleep(100);continue;}
          raw=this.grid.extract(values);if(misses)this.onStatus('Sensor stream recovered.');misses=0;
        }
        this.check();this.onPacket({raw,baseline:this.baseline,sequence:++this.sequence,version:this.version,time:performance.now(),utc:new Date().toISOString()});
        await this.sleep(this.demo?20:10);
      }
    }catch(e){if(!this.stopped)throw e;}
    finally{if(this.client)await this.client.close();}
  }
  async stop(){this.stopped=true;if(this.client)await this.client.close();}
}
