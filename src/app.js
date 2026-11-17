import {Grid,Recording,displayed,clamp,extent,colour} from './core.js';
import {SensorSession} from './session.js';
import {SensorPlot,TracePlot} from './plots.js';
const $=id=>document.getElementById(id),fmt=v=>Number.isFinite(v)?v.toFixed(3):'undefined';
const state={grid:new Grid(5,5),raw:[],baseline:[],values:[],history:[],frozen:null,hasData:false,selected:12,mode:'difference',view:'smooth_3d',palette:'jet',range:500,gain:1,numbers:true,window:20,source:null};
let session=null,sessionTask=null,ports=[],recording=null,completed=null,downloadURLs=[],saved=new Set(),connected=false,latest=0,rateStart=0,rateFrames=0,rate=0;
const getState=()=>state,getTrace=()=>({...state,history:state.frozen||state.history});
function note(message){$('status').textContent=message;const lines=($('log').textContent+`${new Date().toLocaleTimeString()}  ${message}\n`).split('\n');$('log').textContent=lines.slice(-151).join('\n');$('log').scrollTop=$('log').scrollHeight;}
function selected(i){state.selected=clamp(Number.isFinite(i)?Math.floor(i):0,0,state.grid.size-1);$('selected').value=state.selected;readings();}
function readings(){
  const i=state.selected;$('trace-title').textContent=`Taxel ${i}`;$('position').textContent=`Row ${i%state.grid.rows} · column ${Math.floor(i/state.grid.rows)}`;
  $('value').textContent=state.hasData?fmt(state.values[i]):'—';$('raw').textContent=state.hasData?fmt(state.raw[i]):'—';$('baseline').textContent=state.hasData?fmt(state.baseline[i]):'—';
  $('unit').textContent=state.mode==='percent'?'signed difference (%)':state.mode==='difference'?'signed sensor units':state.mode==='raw'?'raw sensor units':'baseline sensor units';
}
function controls(){
  const active=!!session;
  for(const id of ['ports','refresh','baud','grid','rows','columns','demo','empty-demo'])$(id).disabled=active;
  $('connect').disabled=active||!('serial'in navigator)||!isSecureContext;
  $('disconnect').disabled=!active;$('calibrate').disabled=!connected||!!session?.calibrationRequested;
  $('record').disabled=!connected||!!completed;
  $('custom').hidden=$('grid').value!=='custom';
}
function inputGrid(){const v=$('grid').value;return v==='auto'?null:v==='custom'?new Grid(Number($('rows').value),Number($('columns').value)):new Grid(...v.split(',').map(Number));}
async function refresh(){
  if(!navigator.serial)return;
  try{ports=await navigator.serial.getPorts();$('ports').replaceChildren(new Option('Choose a USB serial port…','new'));
    ports.forEach((p,i)=>{const info=p.getInfo(),vid=info.usbVendorId?.toString(16).padStart(4,'0'),pid=info.usbProductId?.toString(16).padStart(4,'0');$('ports').add(new Option(`Permitted port ${i+1}${vid?` · ${vid}:${pid}`:''}`,String(i)));});
  }catch(e){note(`Port list unavailable: ${e.message}`);}
}
function setConnection(text,kind=''){$('connection').textContent=text;$('connection').className=`badge ${kind}`;}
async function start(demo){
  if(session)return;
  let grid,port;
  try{grid=inputGrid();if(!demo){if(!navigator.serial)throw new Error('Use desktop Chrome or Edge for USB access.');port=$('ports').value==='new'?await navigator.serial.requestPort():ports[Number($('ports').value)];if(!port)throw new Error('Refresh ports and select the sensor.');}}
  catch(e){note(e.name==='NotFoundError'?'No port selected. Ready when you are.':e.message);return;}
  if(session)return;
  setConnection('CONNECTING');let failure=null;
  session=new SensorSession({port,baud:Number($('baud').value),grid,demo,onStatus:note,
    onConnect:(g,source)=>{state.grid=g;state.source=source;state.history=[];state.frozen=null;$('freeze').checked=false;state.hasData=false;state.raw=[];state.baseline=[];state.values=[];connected=true;
      $('selected').max=g.size-1;selected(Math.floor(g.size/2));$('grid-title').textContent=`${g.rows} × ${g.columns} · ${g.size} taxels`;
      $('empty').hidden=true;$('source-badge').textContent=demo?'DEMO · SYNTHETIC DATA':'LIVE · USB SERIAL';setConnection(demo?'DEMO':'CONNECTED',demo?'demo':'live');rateStart=performance.now();rateFrames=0;rate=0;controls();},
    onCalibration:success=>{if(success){state.history=[];state.frozen=null;$('freeze').checked=false;}controls();},
    onPacket:p=>{state.raw=p.raw;state.baseline=p.baseline;state.values=displayed(p.raw,p.baseline,state.mode);state.hasData=true;latest=p.time;
      state.history.push(p);if(state.history.length>3000)state.history.shift();rateFrames++;if(p.time-rateStart>=1000){rate=rateFrames*1000/(p.time-rateStart);rateFrames=0;rateStart=p.time;}
      if(recording){if(!recording.append(p))finishRecording('32 MB memory limit reached');else $('record-status').textContent=`Recording · ${recording.count.toLocaleString()} frames · ${(recording.bytes/1048576).toFixed(1)} MB`;}
      $('stats').textContent=`${p.sequence.toLocaleString()} frames · ${rate.toFixed(1)} Hz · baseline v${p.version}`;
    }});
  controls();
  sessionTask=session.run();
  try{await sessionTask;}catch(e){failure=e.message;}
  finally{
    connected=false;session=null;sessionTask=null;if(recording)finishRecording(failure?'connection error':'disconnected');setConnection('OFFLINE');$('source-badge').textContent=state.hasData?'OFFLINE · LAST FRAME':'NO SENSOR CONNECTED';controls();
    if(!state.hasData)$('empty').hidden=false;note(failure?`Disconnected: ${failure}`:'Disconnected. Last readings retained.');
  }
}
async function stop(){if(!session)return;$('disconnect').disabled=true;note('Disconnecting…');await session.stop();if(sessionTask)await sessionTask.catch(()=>{});}
function finishRecording(reason='user stopped'){
  if(!recording)return;completed=recording.close(reason);recording=null;saved=new Set();
  const prefix=completed.metadata.source.demo?'DEMO_':'',name=`${prefix}PingLab_${new Date().toISOString().replace(/[:.]/g,'-')}`;
  downloadURLs.forEach(URL.revokeObjectURL);downloadURLs=[];
  for(const [id,data,type,ext]of [['save-csv',completed.lines,'text/csv','csv'],['save-json',[JSON.stringify(completed.metadata,null,2)],'application/json','json']]){
    const url=URL.createObjectURL(new Blob(data,{type}));downloadURLs.push(url);$(id).href=url;$(id).download=`${name}.${ext}`;$(id).classList.remove('saved');
  }
  $('downloads').hidden=false;$('record').innerHTML='<span class="record-dot"></span>Record CSV';$('record').classList.remove('recording');$('record-status').textContent=`Ready to save · ${completed.count.toLocaleString()} frames · ${(completed.bytes/1048576).toFixed(1)} MB`;
  note(`Recording stopped (${reason}). Download the CSV and metadata JSON before closing this tab.`);controls();
}
function toggleRecording(){
  if(recording){finishRecording();return;}if(!connected||completed)return;
  recording=new Recording(state.grid,state.source);$('record').textContent='Stop recording';$('record').classList.add('recording');$('record-status').textContent='Recording · waiting for next frame';$('downloads').hidden=true;note('Recording all taxels. Keep this tab open and active.');
}
for(const id of ['save-csv','save-json'])$(id).addEventListener('click',()=>{saved.add(id);$(id).classList.add('saved');if(saved.size===2){completed=null;controls();}});
function setWindow(value){state.window=clamp(value,2,120);$('window').value=Math.round(state.window);}
const plot=new SensorPlot($('plot'),getState,selected),bigPlot=new SensorPlot($('big-plot'),getState,selected,true);
const trace=new TracePlot($('trace'),getTrace,$('trace-detail'),setWindow),bigTrace=new TracePlot($('big-trace'),getTrace,$('big-trace-detail'),setWindow);
function legend(){
  const canvas=$('colourbar'),ctx=canvas.getContext('2d'),relative=['raw','baseline'].includes(state.mode),limits=extent(state.values);
  for(let x=0;x<canvas.width;x++){const q=x/(canvas.width-1),v=relative?limits[0]+q*(limits[1]-limits[0]):state.palette==='jet'?q*state.range:(2*q-1)*state.range;ctx.fillStyle=`rgb(${colour(v,state.mode,state.range,state.palette,limits).map(Math.round).join(',')})`;ctx.fillRect(x,0,1,canvas.height);}
  $('legend-text').textContent=relative?`${limits[0].toFixed(1)} → ${limits[1].toFixed(1)} · frame auto range`:state.palette==='jet'?`0 → ±${state.range} ${state.mode==='percent'?'%':'units'} · size of change`:`−${state.range} → 0 → +${state.range} ${state.mode==='percent'?'%':'units'} · signed colour`;
}
let lastDraw=0;
function render(now){if(now-lastDraw>=33){lastDraw=now;plot.draw();trace.draw();if($('plot-dialog').open)bigPlot.draw();if($('trace-dialog').open)bigTrace.draw();readings();legend();
  if(connected&&state.hasData&&now-latest>2000)$('source-badge').textContent='WAITING · LAST FRAME';else if(connected)$('source-badge').textContent=state.source.demo?'DEMO · SYNTHETIC DATA':'LIVE · USB SERIAL';
}requestAnimationFrame(render);}
$('connect').onclick=()=>start(false);$('demo').onclick=$('empty-demo').onclick=()=>start(true);$('disconnect').onclick=stop;$('refresh').onclick=refresh;$('grid').onchange=controls;
$('calibrate').onclick=()=>{if(session&&connected){session.calibrate();controls();note('Calibration queued — keep the sensor untouched.');}};
$('record').onclick=toggleRecording;$('selected').onchange=()=>selected(Number($('selected').value));
for(const id of ['mode','view','palette'])$(id).onchange=()=>{state[id]=$(id).value;if(id==='mode'&&state.hasData)state.values=displayed(state.raw,state.baseline,state.mode);};
for(const [id,min,max]of [['range',.01,1e6],['gain',.1,8],['window',2,120]])$(id).onchange=()=>{const v=Number($(id).value);state[id]=Number.isFinite(v)?clamp(v,min,max):state[id];$(id).value=state[id];};
$('numbers').onchange=()=>state.numbers=$('numbers').checked;$('freeze').onchange=()=>state.frozen=$('freeze').checked?state.history.slice():null;
$('top').onclick=()=>{plot.top();bigPlot.top();};$('reset').onclick=()=>{plot.reset();bigPlot.reset();};
$('expand').onclick=()=>{$('plot-dialog').showModal();$('big-plot').focus();};$('close-plot').onclick=()=>$('plot-dialog').close();
$('expand-trace').onclick=()=>$('trace-dialog').showModal();$('close-trace').onclick=()=>$('trace-dialog').close();$('help').onclick=()=>$('guide').showModal();
addEventListener('beforeunload',e=>{if(session||recording||completed){e.preventDefault();e.returnValue='';}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&connected)note('Tab is in the background. Browser throttling may reduce acquisition rate; return to this tab for reliable capture.');});
if(!('serial'in navigator)||!isSecureContext){$('compatibility').hidden=false;$('compatibility').textContent='Live sensor connection needs desktop Chrome or Edge over HTTPS (or localhost). You can still explore Demo mode here.';}
controls();refresh();requestAnimationFrame(render);
