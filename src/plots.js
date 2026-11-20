import {clamp, colour, extent, normalise, interpolate, displayed} from './core.js?v=0.1.1';
const css = rgb => `rgb(${rgb.map(Math.round).join(',')})`;
const text = (ctx,s,x,y,fill='#9aacc2',align='left',size=11) => {ctx.fillStyle=fill;ctx.textAlign=align;ctx.font=`${size}px ui-monospace,monospace`;ctx.fillText(s,x,y);};
function setup(canvas) {
  const {width,height} = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1,2);
  const w=Math.max(1,Math.round(width*dpr)), h=Math.max(1,Math.round(height*dpr));
  if (canvas.width!==w || canvas.height!==h) {canvas.width=w;canvas.height=h;}
  const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
  return {ctx,width,height};
}
function polygon(ctx,points,fill,stroke) {
  ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.6;ctx.stroke();}
}
export class SensorPlot {
  constructor(canvas, getState, select, expanded=false) {
    this.canvas=canvas;this.getState=getState;this.select=select;this.expanded=expanded;
    this.offscreen=document.createElement('canvas');this.reset();this.points=[];
    canvas.addEventListener('pointerdown',e=>{canvas.focus();canvas.setPointerCapture(e.pointerId);this.drag={x:e.offsetX,y:e.offsetY,startX:e.offsetX,startY:e.offsetY,pan:e.shiftKey||e.button!==0,moved:false};});
    canvas.addEventListener('pointermove',e=>{
      if(this.drag){const d=this.drag,dx=e.offsetX-d.x,dy=e.offsetY-d.y;d.moved ||= Math.hypot(e.offsetX-d.startX,e.offsetY-d.startY)>4;
        if(d.moved && !this.is2D()){if(d.pan){this.pan[0]+=dx;this.pan[1]+=dy;}else{this.yaw+=dx*.008;this.elevation=clamp(this.elevation+dy*.006,.14,Math.PI/2);}}
        d.x=e.offsetX;d.y=e.offsetY;
      } else {const i=this.pick(e.offsetX,e.offsetY);const s=this.getState();canvas.title=i===null?'':`Taxel ${i} · row ${i%s.grid.rows}, column ${Math.floor(i/s.grid.rows)} · ${Number.isFinite(s.values[i])?s.values[i].toFixed(3):'undefined'}`;}
    });
    canvas.addEventListener('pointerup',e=>{if(this.drag&&!this.drag.moved){const i=this.pick(e.offsetX,e.offsetY);if(i!==null)this.select(i);}this.drag=null;});
    canvas.addEventListener('pointercancel',()=>this.drag=null);
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    canvas.addEventListener('wheel',e=>{if(!this.is2D()){e.preventDefault();this.zoom=clamp(this.zoom*Math.exp(-e.deltaY*.001),.3,4);}},{passive:false});
    canvas.addEventListener('keydown',e=>{const s=this.getState(),r=s.selected%s.grid.rows,c=Math.floor(s.selected/s.grid.rows);let i=s.selected;
      if(e.key==='ArrowUp')i=c*s.grid.rows+Math.max(0,r-1);else if(e.key==='ArrowDown')i=c*s.grid.rows+Math.min(s.grid.rows-1,r+1);
      else if(e.key==='ArrowLeft')i=Math.max(0,c-1)*s.grid.rows+r;else if(e.key==='ArrowRight')i=Math.min(s.grid.columns-1,c+1)*s.grid.rows+r;
      else if(e.key.toLowerCase()==='r'){this.reset();return;}else return;e.preventDefault();this.select(i);
    });
  }
  reset(){this.yaw=-32*Math.PI/180;this.elevation=48*Math.PI/180;this.zoom=1;this.pan=[0,0];}
  top(){this.yaw=0;this.elevation=Math.PI/2;this.zoom=1;this.pan=[0,0];}
  view(){const v=this.getState().view;return this.expanded?(v==='smooth_map'?'smooth_3d':v==='heatmap'?'heatmap_3d':v):v;}
  is2D(){return ['smooth_map','heatmap'].includes(this.view());}
  pick(x,y){
    if(this.is2D()&&this.mapBox){const b=this.mapBox,s=this.getState(),col=Math.floor((x-b.x)/b.cell),row=Math.floor((y-b.y)/b.cell);
      return x>=b.x&&y>=b.y&&col<s.grid.columns&&row<s.grid.rows?col*s.grid.rows+row:null;}
    let chosen=null,best=13,depth=-Infinity;
    this.points.forEach((p,i)=>{const d=Math.hypot(p[0]-x,p[1]-y);if(d<best-.5||(d<=best+.5&&p[2]>depth)){chosen=i;best=d;depth=p[2];}});return chosen;
  }
  draw(){
    const {ctx,width:w,height:h}=setup(this.canvas),s=this.getState();
    if(!s.hasData){this.points=[];return;}
    const limits=extent(s.values),col=v=>css(colour(v,s.mode,s.range,s.palette,limits));
    if(this.is2D())this.drawMap(ctx,w,h,s,col);else this.draw3D(ctx,w,h,s,col,limits);
  }
  drawMap(ctx,w,h,s,col){
    const {rows,columns}=s.grid,cell=Math.min((w-80)/columns,(h-85)/rows),x=(w-cell*columns)/2,y=(h-cell*rows)/2;
    this.mapBox={x,y,cell};this.points=[];
    if(this.view()==='smooth_map'){
      const ow=Math.min(180,Math.max(32,columns*12)),oh=Math.min(180,Math.max(32,rows*12));
      this.offscreen.width=ow;this.offscreen.height=oh;
      const oc=this.offscreen.getContext('2d'),im=oc.createImageData(ow,oh),limits=extent(s.values),valid=s.values.filter(Number.isFinite),fill=valid.length?valid.reduce((a,b)=>a+b,0)/valid.length:0;
      for(let py=0;py<oh;py++)for(let px=0;px<ow;px++){
        const v=interpolate(s.values,s.grid,py/(oh-1)*rows-.5,px/(ow-1)*columns-.5,fill),rgb=colour(v,s.mode,s.range,s.palette,limits),i=(py*ow+px)*4;
        im.data.set([...rgb,255],i);
      }
      oc.putImageData(im,0,0);ctx.save();ctx.beginPath();ctx.roundRect(x,y,cell*columns,cell*rows,Math.min(14,cell*.2));ctx.clip();ctx.imageSmoothingEnabled=true;ctx.drawImage(this.offscreen,x,y,cell*columns,cell*rows);ctx.restore();
    } else {
      for(let c=0;c<columns;c++)for(let r=0;r<rows;r++){
        const i=c*rows+r;ctx.fillStyle=col(s.values[i]);ctx.fillRect(x+c*cell+1,y+r*cell+1,cell-2,cell-2);
        if(s.numbers&&cell>=32){const rgb=colour(s.values[i],s.mode,s.range,s.palette,extent(s.values)),ink=.299*rgb[0]+.587*rgb[1]+.114*rgb[2]>150?'#0b1220':'#fff';text(ctx,String(i),x+(c+.5)*cell,y+(r+.45)*cell,ink,'center',Math.min(12,cell/4));if(cell>=46)text(ctx,Number.isFinite(s.values[i])?s.values[i].toFixed(1):'NaN',x+(c+.5)*cell,y+(r+.72)*cell,ink,'center',10);}
      }
    }
    const sr=s.selected%rows,sc=Math.floor(s.selected/rows);
    ctx.strokeStyle='white';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+(sc+.5)*cell,y+(sr+.5)*cell,clamp(cell*.22,5,15),0,Math.PI*2);ctx.stroke();
    if(columns<=20)for(let c=0;c<columns;c++)text(ctx,String(c),x+(c+.5)*cell,y+cell*rows+19,'#8ea4bf','center',10);
    if(rows<=20)for(let r=0;r<rows;r++)text(ctx,String(r),x-13,y+(r+.5)*cell+3,'#8ea4bf','right',10);
    text(ctx,'COLUMN →',x+cell*columns/2,y+cell*rows+35,'#738ba7','center',8);
    text(ctx,'ROW ↓',x-10,y-10,'#738ba7','right',8);
  }
  draw3D(ctx,w,h,s,col,limits){
    const {rows,columns}=s.grid,span=Math.max(columns-1,rows-1,1),view=this.view(),flat=view==='heatmap_3d';
    const pixels=Math.min(w/3.6,Math.max(1,h-62)/(2.7+.45*s.gain))*this.zoom;
    const project=(r,c,v,base=false)=>{
      const x=(c-(columns-1)/2)*2/span,y=((rows-1)/2-r)*2/span,z=base||flat?0:normalise(v,s.mode,s.range,limits)*.65*s.gain;
      const xx=x*Math.cos(this.yaw)-y*Math.sin(this.yaw),hd=x*Math.sin(this.yaw)+y*Math.cos(this.yaw);
      return [w/2+xx*pixels+this.pan[0],h/2-(hd*Math.sin(this.elevation)+z*Math.cos(this.elevation))*pixels+this.pan[1],z*Math.sin(this.elevation)-hd*Math.cos(this.elevation)];
    };
    polygon(ctx,[project(-.5,-.5,0,true),project(-.5,columns-.5,0,true),project(rows-.5,columns-.5,0,true),project(rows-.5,-.5,0,true)],'#162338','#32435a');
    this.points=s.values.map((v,i)=>project(i%rows,Math.floor(i/rows),v));
    const faces=[];
    if(flat){for(let c=0;c<columns;c++)for(let r=0;r<rows;r++){
      const v=s.values[c*rows+r],points=[project(r-.5,c-.5,v),project(r-.5,c+.5,v),project(r+.5,c+.5,v),project(r+.5,c-.5,v)];faces.push({points,value:v});
    }}else if(view==='surface'||view==='smooth_3d'){
      const factor=view==='smooth_3d'?Math.min(8,Math.max(1,Math.floor(55/Math.max(rows,columns)))):1;
      const nr=(rows-1)*factor+1,nc=(columns-1)*factor+1,vertices=[],vs=[],valid=s.values.filter(Number.isFinite),fill=valid.length?valid.reduce((a,b)=>a+b,0)/valid.length:0;
      for(let r=0;r<nr;r++)for(let c=0;c<nc;c++){
        const v=factor===1?s.values[c*rows+r]:interpolate(s.values,s.grid,r/factor,c/factor,fill);vertices.push(project(r/factor,c/factor,v));vs.push(v);
      }
      for(let r=0;r<nr-1;r++)for(let c=0;c<nc-1;c++){
        const ids=[r*nc+c,r*nc+c+1,(r+1)*nc+c+1,(r+1)*nc+c];if(ids.every(i=>Number.isFinite(vs[i])))faces.push({points:ids.map(i=>vertices[i]),value:ids.reduce((a,i)=>a+vs[i],0)/4});
      }
    }
    faces.sort((a,b)=>a.points.reduce((v,p)=>v+p[2],0)-b.points.reduce((v,p)=>v+p[2],0));
    for(const f of faces)polygon(ctx,f.points,col(f.value),view==='smooth_3d'?col(f.value):'#2c3f5170');
    if(view==='point_grid'){
      ctx.lineWidth=1;ctx.strokeStyle='#526c8c';
      for(let c=0;c<columns;c++)for(let r=0;r<rows;r++){
        const i=c*rows+r,p=this.points[i];for(const j of [r+1<rows?i+1:-1,c+1<columns?i+rows:-1])if(j>=0&&Number.isFinite(s.values[i])&&Number.isFinite(s.values[j])){ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(this.points[j][0],this.points[j][1]);ctx.stroke();}
      }
    }
    const order=this.points.map((p,i)=>({p,i})).sort((a,b)=>a.p[2]-b.p[2]);
    for(const {p,i} of order){if(!Number.isFinite(s.values[i]))continue;
      if(view==='point_grid'||rows===1||columns===1){ctx.fillStyle=col(s.values[i]);ctx.beginPath();ctx.arc(p[0],p[1],s.grid.size>400?2:4,0,Math.PI*2);ctx.fill();}
      if(s.numbers&&s.grid.size<=100&&view!=='smooth_3d'){text(ctx,String(i),p[0],p[1]-8,'#e3ecf6','center',9);}
    }
    const p=this.points[s.selected];if(p){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p[0],p[1],8,0,Math.PI*2);ctx.stroke();text(ctx,`#${s.selected}`,p[0]+12,p[1]-10,'#fff','left',12);}
    const label=project(-.8,-.5,0,true);text(ctx,'row 0 · col 0',label[0],label[1],'#829bb7','center',9);
  }
}
export class TracePlot {
  constructor(canvas,getState,detail,setWindow){this.canvas=canvas;this.getState=getState;this.detail=detail;this.setWindow=setWindow;this.hover=null;
    canvas.addEventListener('wheel',e=>{e.preventDefault();setWindow(clamp(getState().window*Math.exp(e.deltaY*.001),2,120));},{passive:false});
    canvas.addEventListener('pointermove',e=>{this.hover=e.offsetX;});canvas.addEventListener('pointerleave',()=>{this.hover=null;detail.textContent='Hover for timestamp and value';});
  }
  draw(){
    const {ctx,width:w,height:h}=setup(this.canvas),s=this.getState(),data=s.history;
    const left=65,right=w-20,top=15,bottom=h-27,end=data.length?data.at(-1).time:0,start=end-s.window*1000;
    const points=data.filter(p=>p.time>=start).map(p=>({p,v:displayed([p.raw[s.selected]],[p.baseline[s.selected]],s.mode)[0]}));
    let [lo,hi]=extent(points.map(x=>x.v));if(hi===lo){lo-=1;hi+=1;}else{const pad=(hi-lo)*.1;lo-=pad;hi+=pad;}
    const X=t=>left+(t-start)/(end-start)*(right-left),Y=v=>bottom-(v-lo)/(hi-lo)*(bottom-top);
    ctx.lineWidth=1;
    for(let i=0;i<=4;i++){const y=top+(bottom-top)*i/4;ctx.strokeStyle='#243348';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();text(ctx,(hi-(hi-lo)*i/4).toFixed(s.mode==='percent'?2:1),left-10,y+4,'#8ea4bf','right',10);}
    for(let i=0;i<=4;i++){const x=left+(right-left)*i/4;text(ctx,`${(-s.window*(1-i/4)).toFixed(0)}s`,x,h-7,'#8ea4bf','center',9);}
    if(!points.length){text(ctx,'Signal history appears after connection',w/2,h/2,'#6f849f','center',11);return;}
    ctx.beginPath();let drawing=false;for(const {p,v} of points){if(!Number.isFinite(v)){drawing=false;continue;}if(drawing)ctx.lineTo(X(p.time),Y(v));else{ctx.moveTo(X(p.time),Y(v));drawing=true;}}
    ctx.strokeStyle='#71e6c2';ctx.lineWidth=1.6;ctx.stroke();
    if(this.hover!==null&&this.hover>=left&&this.hover<=right){const t=start+(this.hover-left)/(right-left)*(end-start);let nearest=points[0];for(const p of points)if(Math.abs(p.p.time-t)<Math.abs(nearest.p.time-t))nearest=p;
      const x=X(nearest.p.time);ctx.strokeStyle='#8298af';ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,bottom);ctx.stroke();ctx.setLineDash([]);
      this.detail.textContent=`${nearest.p.utc} · ${Number.isFinite(nearest.v)?nearest.v.toFixed(3):'undefined'}${s.mode==='percent'?' %':' units'}`;
    }
  }
}
