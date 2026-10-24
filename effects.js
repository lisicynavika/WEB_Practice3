'use strict';
// Дополнения к прежней векторной графике; котёнок, растения и палитра сохранены.
const Effects=(()=>{
 const ink='#665334';
 function box(c,x,y,w,h,r,fill,stroke=ink){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
 function line(c,x,y,x2,y2,color=ink,width=2){c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
 function ellipse(c,x,y,rx,ry,fill,stroke=null){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
 function platform(c,p){
  Art.platform(c,p);
  if(!p.solid)return;
  if(p.type==='ice'){
   box(c,p.x+2,p.y+1,p.w-4,10,5,'#b8d9cf','#7eaca1');
   line(c,p.x+15,p.y+3,p.x+p.w*.55,p.y+3,'#edf7db',2);
   for(let i=25;i<p.w-10;i+=38){line(c,p.x+i,p.y+13,p.x+i+15,p.y+18,'#afcbb7',1.5);}
   c.fillStyle='#edf7dc';c.font='bold 12px Trebuchet MS';c.textAlign='left';c.fillText('❄',p.x+9,p.y-7);
  }
  if(p.type==='spring'){
   const squish=p.bounce>0?4:0;
   for(let i=25;i<p.w-20;i+=35){c.beginPath();c.moveTo(p.x+i,p.y+18);for(let j=0;j<4;j++)c.lineTo(p.x+i+(j%2?9:0),p.y+18-j*5);c.strokeStyle='#8a8959';c.lineWidth=2;c.stroke();}
   box(c,p.x+5,p.y-5+squish,p.w-10,15-squish,7,'#b7cf80','#6a874c');
   line(c,p.x+17,p.y-2+squish,p.x+p.w-18,p.y-2+squish,'#e5edba',2);
   c.fillStyle='#7e9550';c.font='bold 17px Trebuchet MS';c.textAlign='center';c.fillText('↑',p.x+p.w/2,p.y+7+squish);
  }
 }
 function dog(c,d,t){
  Art.dog(c,d,t);
  const x=d.x+d.w/2+(d.direction||1)*10,y=d.y+d.h-87;
  const color=d.type==='chase'?(d.alert?'#dc9974':'#d9b285'):d.type==='jumper'?'#b0c58a':'#dfb68b';
  box(c,x-12,y,24,23,8,color,'#956e4a');
  c.font='bold 16px Trebuchet MS';c.textAlign='center';c.fillStyle='#fff3cf';
  c.fillText(d.type==='chase'?'→':d.type==='jumper'?'↑':'•',x,y+17);
  // Цветной ошейник и значок различают поведение даже в неподвижном кадре.
  if(d.type==='chase'&&d.alert){c.fillStyle='#f4d18a';c.font='bold 11px Trebuchet MS';c.fillText('!',x,y-8);}
  if(d.type==='jumper'&&d.jumpClock<.4&&d.y===d.baseY){line(c,x-17,y+14,x-21,y+7,'#d7a35e',2);line(c,x+17,y+14,x+21,y+7,'#d7a35e',2);}
 }
 function hazard(c,h,t){
  c.save();c.lineJoin='round';
  if(h.type==='sprinkler'){
   const x=h.x+h.w/2,y=h.y;
   if(h.active){
    c.fillStyle='#93d2c793';c.beginPath();c.moveTo(x-5,y-18);c.quadraticCurveTo(x-34,y-90,x-23,y-174);c.quadraticCurveTo(x,y-191,x+23,y-174);c.quadraticCurveTo(x+34,y-90,x+5,y-18);c.closePath();c.fill();
    for(let i=0;i<8;i++){const yy=y-30-((t*95+i*29)%140);ellipse(c,x+Math.sin(i*2+t*3)*17,yy,2.5,5,'#d7f4e5');}
    line(c,x-18,y-146,x-8,y-168,'#e3f8dc',2);line(c,x+12,y-101,x+17,y-126,'#e3f8dc',2);
   }
   box(c,x-17,y-18,34,15,5,'#a6bba1');box(c,x-7,y-30,14,15,4,'#b6cbc0');
   line(c,x-8,y-31,x+8,y-31,'#75978c',4);
   ellipse(c,x,y-10,3,3,h.active?'#d29a75':h.warn?'#efc876':'#abd08a');
   if(h.warn){c.fillStyle='#be8a4e';c.textAlign='center';c.font='bold 15px Trebuchet MS';c.fillText('!',x,y-44);}
  }else if(h.type==='gate'){
   const x=h.x,y=h.y;
   box(c,x-8,y-184,66,13,4,'#ad9265');
   for(const px of [x-8,x+53])box(c,px,y-174,6,174,2,'#9b885e');
   if(h.active){
    box(c,x+1,y-171,48,169,3,'#9bab79');
    for(let yy=y-155;yy<y-4;yy+=23){line(c,x+4,yy,x+45,yy,'#c8d3a0',3);line(c,x+4,yy+9,x+45,yy+9,'#7f9567',1);}
    line(c,x+24,y-170,x+24,y-3,'#71875a',2);
   }else{
    box(c,x-4,y-171,7,169,3,'#b1c08c');box(c,x+47,y-171,7,169,3,'#b1c08c');
    if(h.warn){c.fillStyle='#e6b97488';c.fillRect(x+2,y-170,45,170);}
   }
   ellipse(c,x+25,y-180,5,5,h.active?'#d19b7c':h.warn?'#f6d28a':'#afd17e',ink);
   c.fillStyle='#edf1c2';c.font='bold 10px Trebuchet MS';c.textAlign='center';c.fillText(h.active?'СТОП':h.warn?'СКОРО':'ИДИ',x+25,y-197);
  }else{
   const cx=h.box.x+25,cy=h.box.y+23;
   line(c,h.anchorX,h.anchorY,cx,cy-24,'#93784f',3);
   ellipse(c,h.anchorX,h.anchorY,5,5,'#bd9d6e',ink);
   c.translate(cx,cy);c.rotate(-h.currentAngle*.35);
   // Подвесной терракотовый горшок с зелёной шапкой.
   c.beginPath();c.moveTo(-24,-18);c.lineTo(24,-18);c.lineTo(18,21);c.quadraticCurveTo(0,29,-18,21);c.closePath();c.fillStyle='#cd9867';c.fill();c.strokeStyle=ink;c.lineWidth=2;c.stroke();
   box(c,-28,-23,56,11,4,'#e6b780');line(c,-13,-7,-10,15,'#f3cb96',3);
   for(let i=-1;i<=1;i++){c.beginPath();c.ellipse(i*11,-30-Math.abs(i)*3,7,16,i*.5,0,Math.PI*2);c.fillStyle=i%2?'#8aa761':'#9cba72';c.fill();c.strokeStyle='#63814a';c.lineWidth=1.3;c.stroke();}
  }
  c.restore();
 }
 return {platform,dog,hazard};
})();
