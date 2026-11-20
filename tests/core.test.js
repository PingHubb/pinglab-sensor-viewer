import test from 'node:test';
import assert from 'node:assert/strict';
import {Grid,displayed,colour,interpolate,medianFrames,Recording} from '../src/core.js';
import {parseInts,parseChannelCheck,takePayload,responseTimeout,SerialClient} from '../src/serial.js';
import {SensorSession} from '../src/session.js';
test('grid detects reference column and keeps column-major taxel IDs',()=>{
 const g=Grid.fromChannels([11,8],{excludeReferenceColumn:true});assert.equal(g.rows,8);assert.equal(g.columns,10);
 assert.deepEqual(g.extract(Array.from({length:88},(_,i)=>i)),Array.from({length:80},(_,i)=>i));
 assert.throws(()=>g.extract(Array(79).fill(1)));assert.throws(()=>g.extract(Array(80).fill(NaN)));
 assert.equal(new Grid(10,9).extract(Array(110).fill(5)).length,90);
 for(const [r,c]of [[0,5],[65,5],[64,64],[2.5,3]])assert.throws(()=>new Grid(r,c));
});
test('signal conversion preserves negative values and undefined percentages',()=>{
 assert.deepEqual(displayed([90,120],[100,100],'difference'),[-10,20]);
 const p=displayed([5,90],[0,100],'percent');assert.ok(Number.isNaN(p[0]));assert.equal(p[1],-10);
 assert.deepEqual(displayed([1,2],[3,4],'raw'),[1,2]);assert.deepEqual(displayed([1,2],[3,4],'baseline'),[3,4]);
});
test('cubic display interpolation passes through every measured taxel',()=>{
 const g=new Grid(3,4),v=[1,5,2,6,3,2,1,8,9,10,11,5];
 for(let c=0;c<4;c++)for(let r=0;r<3;r++)assert.equal(interpolate(v,g,r,c),v[c*3+r]);
 assert.ok(Math.abs(interpolate([7],new Grid(1,1),-.3,.4)-7)<1e-12);
 assert.deepEqual(v,[1,5,2,6,3,2,1,8,9,10,11,5]);
});
test('jet magnitude matches both signs; signed jet distinguishes them',()=>{
 assert.deepEqual(colour(-50,'difference',100,'jet',[0,1]),colour(50,'difference',100,'jet',[0,1]));
 assert.notDeepEqual(colour(-50,'difference',100,'jet_signed',[0,1]),colour(50,'difference',100,'jet_signed',[0,1]));
 assert.deepEqual(colour(0,'difference',100,'jet',[0,1]),[0,0,127.5]);
});
test('software baseline uses per-taxel median, including even frame counts',()=>assert.deepEqual(medianFrames([[1,50],[9,10],[3,20],[7,30]]),[5,25]));
test('recording includes every taxel, UTC, sequence, signed difference and baseline revisions',()=>{
 const rec=new Recording(new Grid(1,2),{demo:true});
 rec.append({time:1000,utc:'2026-11-17T01:00:00.000Z',sequence:10,version:1,raw:[90,120],baseline:[100,100]});
 rec.append({time:1250,utc:'2026-11-17T01:00:00.250Z',sequence:11,version:2,raw:[90,120],baseline:[95,115]});
 rec.close();assert.match(rec.lines[1],/,0.000000,10,1,90,120,-10,20/);assert.match(rec.lines[2],/,0.250000,11,2,90,120,-5,5/);
 assert.equal(rec.metadata.frames,2);assert.equal(rec.metadata.baseline_history.length,2);assert.equal(rec.metadata.source.demo,true);
 assert.throws(()=>rec.append({}));
});
test('recording memory limit stops before adding an incomplete row',()=>{
 const rec=new Recording(new Grid(1,1),{},100);const header=rec.lines[0];
 assert.equal(rec.append({time:0,utc:'2026-11-17T01:00:00.000Z',sequence:1,version:1,raw:[5],baseline:[9]}),false);
 assert.equal(rec.count,0);assert.deepEqual(rec.lines,[header]);
});
test('parser ignores boot text and accepts only integer tokens',()=>assert.deepEqual(parseInts('boot +12 -7 4.2 rubbish 8'),[12,-7,8]));
test('framed parser resynchronizes, rejects wrong lengths and takes latest complete payload',()=>{
 assert.deepEqual(takePayload([55555,55555,9,55555,55555,1,2,44444,44444],2),[[1,2],[]]);
 assert.equal(takePayload([55555,55555,1,44444,44444],2)[0],null);
 assert.equal(takePayload([55555,55555,1,2,44444],2)[0],null);
 assert.deepEqual(takePayload([55555,55555,1,2,44444,44444,55555,55555,3,4,44444,44444],2)[0],[3,4]);
 assert.deepEqual(takePayload([0,0,7,8,0,0],2,true)[0],[7,8]);assert.equal(takePayload([0,0,7,8,0,0],2,false)[0],null);
});
test('slow baud and large frames get wire-time-aware deadlines',()=>{assert.ok(responseTimeout(420,9600)>4000);assert.ok(responseTimeout(420,115200)<1000);});
function mockPort(reply){
 let controller;const writes=[];const encoder=new TextEncoder();
 return {writes,closed:false,async open(){this.readable=new ReadableStream({start(c){controller=c;}});this.writable=new WritableStream({write:async data=>{const command=new TextDecoder().decode(data);writes.push(command);await reply(command,s=>controller.enqueue(encoder.encode(s)));}});},getInfo(){return {usbVendorId:1234};},async close(){this.closed=true;}};
}
test('serial transport reassembles split bytes and multiline frame without issuing overlapping commands',async()=>{
 const port=mockPort(async(command,send)=>{send('Boot OK\n555');send('55 55555 10\n');send('20 44444 44');send('444\r\n');});
 const client=new SerialClient(port,115200);await client.open();client.expected=2;
 const first=client.command('readRaw',{timeout:150});await assert.rejects(client.command('readCal'),/Concurrent/);
 assert.deepEqual(await first,[10,20]);assert.deepEqual(port.writes,['readRaw\n']);await client.close();assert.ok(port.closed);
});
test('serial timeout discards partial bytes before next command',async()=>{
 let n=0;const port=mockPort(async(c,send)=>{if(n++===0)send('55555 55555 8');else send('55555 55555 3 4 44444 44444\n');});
 const client=new SerialClient(port,115200);await client.open();client.expected=2;
 assert.equal(await client.command('readRaw',{timeout:30}),null);assert.deepEqual(await client.command('readRaw',{timeout:150}),[3,4]);await client.close();
});
test('closing an in-flight read cancels cleanly and releases stream locks',async()=>{
 const port=mockPort(async()=>{}),client=new SerialClient(port,9600);await client.open();
 const request=client.command('readRaw',{timeout:5000});await client.close();assert.equal(await request,null);assert.ok(port.closed);assert.equal(port.readable.locked,false);assert.equal(port.writable.locked,false);
});
test('demo session publishes marked source, calibrated revisions and stops cleanly',async()=>{
 const packets=[];let source,calibrations=0;
 const s=new SensorSession({demo:true,grid:new Grid(2,3),onConnect:(g,x)=>source=x,onCalibration:()=>calibrations++,onPacket:p=>{packets.push(p);if(packets.length===1)s.calibrate();if(packets.length===3)s.stop();}});
 await s.run();assert.equal(source.demo,true);assert.equal(packets.length,3);assert.equal(packets[0].raw.length,6);assert.equal(packets[1].version,2);assert.equal(calibrations,1);
});
test('real acquisition learns exact payload length, calibrates serially and stops after five missing frames',async()=>{
 let misses=0,reads=0,closed=0,baseline=[100,100,999],calibrated=false;const commands=[],packets=[];
 const client={expected:0,async open(){},discard(){},async close(){closed++;},async command(cmd){commands.push(cmd);
  if(cmd==='channelCheck')return [3,1];if(cmd==='readCal')return baseline;if(cmd==='updateCal'){calibrated=true;return baseline=[90,90,999];}
  if(cmd==='readRaw'){if(reads++<3)return [80,120,999];misses++;return null;}
 }};
 const s=new SensorSession({port:{getInfo:()=>({usbVendorId:1})},baud:9600,excludeReferenceColumn:true,clientFactory:()=>client,onPacket:p=>{packets.push(p);if(packets.length===1)s.calibrate();}});s.sleep=async()=>s.check();
 await assert.rejects(s.run(),/stopped replying/);assert.equal(misses,5);assert.equal(client.expected,3);assert.equal(closed,1);assert.ok(calibrated);assert.equal(packets[0].raw.length,2);assert.deepEqual(packets[1].baseline,[90,90]);assert.equal(packets[1].version,2);
 assert.deepEqual(commands.slice(0,7),['channelCheck','channelCheck','readRaw','readCal','readRaw','updateCal','readRaw']);
});
test('failed calibration retains the old baseline and version',async()=>{
 let readCal=0;const packets=[];let success;
 const client={async open(){},discard(){},async close(){},async command(cmd){if(cmd==='channelCheck')return [1,1];if(cmd==='readRaw')return [50];if(cmd==='readCal')return readCal++===0?[100]:null;return null;}};
 const s=new SensorSession({port:{getInfo:()=>({})},baud:115200,grid:new Grid(1,1),clientFactory:()=>client,onCalibration:x=>success=x,onPacket:p=>{packets.push(p);if(packets.length===1)s.calibrate();else s.stop();}});s.sleep=async()=>s.check();
 await s.run();assert.equal(success,false);assert.deepEqual(packets[1].baseline,[100]);assert.equal(packets[1].version,1);
});
test('stored baseline absence collects exactly 20 frames for software median',async()=>{
 let rawCount=0,source;const client={async open(){},discard(){},async close(){},async command(cmd){if(cmd==='channelCheck')return [1,1];if(cmd==='readRaw')return [++rawCount];return null;}};
 const s=new SensorSession({port:{getInfo:()=>({})},baud:115200,grid:new Grid(1,1),clientFactory:()=>client,onConnect:(g,x)=>source=x,onPacket:()=>s.stop()});s.sleep=async()=>s.check();
 await s.run();assert.deepEqual(s.baseline,[10.5]);assert.equal(rawCount,21);assert.equal(source.baseline_source,'20-frame software baseline');
});
test('auto baud retries only the selected port and records the working baud',async()=>{
 const rates=[];const port={getInfo:()=>({usbVendorId:1})};let source;
 const s=new SensorSession({port,grid:new Grid(1,1),clientFactory:(p,baud)=>{assert.equal(p,port);rates.push(baud);return {async open(){if(baud===115200)throw new Error('wrong baud');},discard(){},async close(){},async command(cmd){return cmd==='channelCheck'?[1,1]:[100];}};},onConnect:(g,x)=>source=x,onPacket:()=>s.stop()});s.sleep=async()=>s.check();
 await s.run();assert.deepEqual(rates,[115200,9600]);assert.equal(source.baud,9600);
});
test('cancel while port open is pending closes the newly opened port',async()=>{
 let release;const port={closed:0,open:()=>new Promise(resolve=>release=resolve),async close(){this.closed++;}};
 const c=new SerialClient(port,9600),opening=c.open();await c.close();release();await assert.rejects(opening,/cancelled/);assert.ok(port.closed>=1);
});

// Regressions for ACM5 20×20 detection and mandatory pre-acquisition checks.
test('ACM5 channel counts keep all 400 taxels by default',()=>{
 const g=Grid.fromChannels([20,20]);assert.equal(g.rows,20);assert.equal(g.columns,20);
 const values=Array.from({length:400},(_,i)=>i);assert.deepEqual(g.extract(values),values);
 assert.equal(Grid.fromChannels([20,20],{excludeReferenceColumn:true}).columns,19);
 for(const counts of [[20.5,20],[20,0],[0,20],[Infinity,20],[20,20,1]])assert.throws(()=>Grid.fromChannels(counts));
});
test('channel parser accepts only known replies, not incidental startup numbers',()=>{
 for(const reply of ['channelDrive: 20  channelSensor: 20','channelDrive:20 channelSensor:20',' 20 20 '])assert.deepEqual(parseChannelCheck(reply),[20,20]);
 for(const reply of ['Boot 20 19','ERR 20 19','20 19 garbage','channelDrive: 0 channelSensor: 20','55555 55555 20 20 44444 44444','20.5 20','20'])assert.equal(parseChannelCheck(reply),null);
});
test('fragmented labelled channel response survives boot messages and trailing frame data',async()=>{
 const port=mockPort(async(c,send)=>{send('boot 19 20\n55555 55555 8 9 44444 44444\nchannelDri');send('ve: 20  channelSen');send('sor: 20\r\n');});
 const client=new SerialClient(port,115200);await client.open();assert.deepEqual(await client.command('channelCheck',{timeout:150}),[20,20]);await client.close();
});
function checkedSession({replies=[[20,20],[20,20]],grid=null,excludeReferenceColumn=false,size=400}={}){
 const commands=[],packets=[];let calls=0,connected=0,source;
 const client={async open(){},discard(){},async close(){},async command(cmd){commands.push(cmd);if(cmd==='channelCheck')return replies[Math.min(calls++,replies.length-1)];return Array.from({length:size},(_,i)=>1000+i);}};
 const session=new SensorSession({port:{getInfo:()=>({})},baud:115200,grid,excludeReferenceColumn,clientFactory:()=>client,
 onConnect:(g,s)=>{connected++;source=s;},onPacket:p=>{packets.push(p);session.stop();}});
 session.sleep=async()=>session.check();
 return {session,commands,packets,get connected(){return connected;},get source(){return source;}};
}
test('verified ACM5 connection checks channels twice before raw/baseline and preserves final column',async()=>{
 const t=checkedSession();await t.session.run();assert.deepEqual(t.commands.slice(0,4),['channelCheck','channelCheck','readRaw','readCal']);
 assert.equal(t.connected,1);assert.equal(t.session.grid.columns,20);assert.equal(t.packets[0].raw.length,400);assert.equal(t.packets[0].raw[399],1399);
 assert.deepEqual(t.source.channels,{drive:20,sense:20,reference_column_excluded:false,payload_values:400,verified_reads:2});
});
test('manual 20×19 cannot bypass channel check or silently discard ACM5 column',async()=>{
 const t=checkedSession({grid:new Grid(20,19)});await assert.rejects(t.session.run(),/Selected grid 20 × 19 disagrees.*20 × 20/);
 assert.deepEqual(t.commands,['channelCheck','channelCheck']);assert.equal(t.connected,0);assert.equal(t.packets.length,0);
});
test('manual same-size but transposed shape also fails verification',async()=>{
 const t=checkedSession({grid:new Grid(10,40)});await assert.rejects(t.session.run(),/disagrees/);assert.equal(t.connected,0);
});
test('manual matching grid still requires channelCheck',async()=>{
 const t=checkedSession({grid:new Grid(20,20)});await t.session.run();assert.deepEqual(t.commands.slice(0,2),['channelCheck','channelCheck']);assert.equal(t.connected,1);
});
test('unstable or missing channel checks never start acquisition, even with a manual grid',async()=>{
 for(const replies of [[[20,20],[19,20],[20,20],[19,20],[20,20]],[null,null,null,null,null]]){
  const t=checkedSession({replies,grid:new Grid(20,20)});await assert.rejects(t.session.run(),/Channel check failed/);assert.equal(t.connected,0);assert.equal(t.commands.length,5);assert.ok(t.commands.every(c=>c==='channelCheck'));
 }
});
test('a transient wrong channel reply must settle before acquisition',async()=>{
 const t=checkedSession({replies:[[19,20],[20,20],[20,20]]});await t.session.run();assert.deepEqual(t.commands.slice(0,4),['channelCheck','channelCheck','channelCheck','readRaw']);assert.equal(t.session.grid.columns,20);
});
test('channel/frame mismatch blocks connection rather than accepting a reference-column-sized remnant',async()=>{
 for(const size of [380,420]){
  const t=checkedSession({size});await assert.rejects(t.session.run(),/Channel\/frame mismatch/);assert.equal(t.connected,0);assert.equal(t.packets.length,0);assert.ok(!t.commands.includes('readCal'));
 }
});
test('reference exclusion is explicit and retained in metadata',async()=>{
 const t=checkedSession({excludeReferenceColumn:true,grid:new Grid(20,19)});await t.session.run();assert.equal(t.session.grid.columns,19);assert.equal(t.packets[0].raw.length,380);assert.equal(t.source.channels.reference_column_excluded,true);assert.equal(t.source.channels.payload_values,400);
});
