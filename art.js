'use strict';
const Art=(()=>{
 const ink='#54432d';
 const palettes=[{sky:'#d4e8c5',low:'#eee0ad',frame:'#8ca67b',far:'#9fbc8c',glass:'#eaf1ce',leaf:'#60904e'}, {sky:'#bcdbb4',low:'#d5d7a1',frame:'#789a6e',far:'#88ae78',glass:'#dbebbf',leaf:'#4d8446'}, {sky:'#c7cbb9',low:'#edc599',frame:'#8b9278',far:'#a3aa88',glass:'#e6dfbc',leaf:'#718953'}];
 function rr(c,x,y,w,h,r,fill,stroke=ink,lw=2){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
 function ellipse(c,x,y,rx,ry,color,stroke=null,lw=2){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
 function path(c,d,fill,stroke=ink,lw=2){const p=new Path2D(d);if(fill){c.fillStyle=fill;c.fill(p);}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke(p);}}
 function line(c,x1,y1,x2,y2,color=ink,width=2){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
 function grad(c,x,y,x2,y2,stops){const g=c.createLinearGradient(x,y,x2,y2);stops.forEach(([p,color])=>g.addColorStop(p,color));return g;}
 function leaf(c,x,y,size,angle,color='#7da75b',detail=true){
  c.save();c.translate(x,y);c.rotate(angle);c.scale(size,size);
  path(c,'M0 0C-21-13-28-43-6-66 14-55 25-24 0 0Z',color,detail?'#476b3d':null,1.5);
  if(detail){path(c,'M0-3Q-5-30-6-57',null,'#b4cd84',1.5);line(c,-3,-25,-14,-37,'#b4cd84',1);line(c,-4,-37,6,-48,'#b4cd84',1);}
  c.restore();
 }
 function plant(c,x,y,scale=1,variant=0,detail=true){
  c.save();c.translate(x,y);c.scale(scale,scale);
  const greens=['#7fa15b','#98b86d','#638a4a'];
  for(let i=0;i<7;i++){
   const angle=(i-3)*.29+(variant%2)*.1;
   leaf(c,(i%3-1)*4,-6-(i%2)*7,.6+(i%3)*.18,angle,greens[(i+variant)%3],detail);
  }
  if(variant%3===1){for(let i=0;i<3;i++){line(c,-10+i*10,-8,-17+i*15,-75+(i%2)*8,'#65884b',3);flower(c,-17+i*15,-75+(i%2)*8,4.5,i===1?'#e9b58a':'#f3d58b');}}
  c.restore();
 }
 function flower(c,x,y,s,color){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ellipse(c,x+Math.cos(a)*s,y+Math.sin(a)*s,s*.68,s*.68,color);}ellipse(c,x,y,s*.45,s*.45,'#b99755');}
 function smallPot(c,x,y,s=1,v=0){c.save();c.translate(x,y);c.scale(s,s);plant(c,0,-33,1,v);path(c,'M-24-34H24L17 0Q0 6-17 0Z',grad(c,-20,-35,25,0,[[0,'#dcad73'],[.5,'#c4895b'],[1,'#9e714b']]),'#77583a',2);rr(c,-28,-38,56,10,4,'#e0b37e','#89653f',2);line(c,-13,-23,-10,-5,'#e7bc8c',3);c.restore();}
 function background(c,t,camera,width,index=0){
  const p=palettes[index];c.fillStyle=grad(c,0,0,0,540,[[0,p.sky],[.73,p.glass],[1,p.low]]);c.fillRect(0,0,width,540);
  // Дальний сад движется медленнее камеры — параллакс.
  c.save();c.translate(-(camera*.12)%480,0);
  for(let x=-250;x<width+700;x+=190){ellipse(c,x,310,125,190,p.far);ellipse(c,x+65,350,105,160,'#b4c69b');}
  c.restore();
  const windowOffset=(camera*.2)%240;
  for(let x=-windowOffset-240;x<width+240;x+=240){
   c.fillStyle='#f8f3c933';c.fillRect(x+12,65,214,267);
   path(c,`M${x+18} 55L${x+142} 55 ${x+50} 330 ${x+18} 330Z`,'#ffffe326',null);
   rr(c,x,42,12,400,3,p.frame,null);rr(c,x+10,115,230,8,2,p.frame,null);rr(c,x+10,280,230,8,2,p.frame,null);
   line(c,x+6,48,x+126,-44,p.frame,12);line(c,x+126,-44,x+246,48,p.frame,12);
  }
  rr(c,0,41,width,12,2,p.frame,null);rr(c,0,352,width,13,1,'#9aa47c',null);
  c.fillStyle='#b3aa7c';c.fillRect(0,365,width,175);
  for(let x=-(camera*.45)%110-110;x<width+110;x+=110){rr(c,x,373,106,55,4,'#c3b58a',null);rr(c,x+55,434,106,56,4,'#b9ab7e',null);}
  // Скамья, лейки и горшки за игровыми платформами.
  const farOffset=(camera*.45)%410;
  for(let x=-farOffset-410;x<width+410;x+=410){
   line(c,x+55,410,x+55,510,'#9b8a62',11);line(c,x+320,410,x+320,510,'#9b8a62',11);rr(c,x+35,403,310,13,4,'#b7a075','#a28d65',1);
   smallPot(c,x+100,402,1.25,1);smallPot(c,x+255,402,1.6,2);smallPot(c,x+175,402,.8,0);
  }
  // Лучи и пылинки в воздухе.
  path(c,`M${width*.6} 0L${width*.6+100} 0 ${width*.6+310} 540 ${width*.6-170} 540Z`,'#fff8c91c',null);
  for(let i=0;i<18;i++){const x=((i*137-camera*.07)%Math.max(width,1)+width)%width;const y=(i*83+Math.sin(t*.4+i)*9)%450;ellipse(c,x,y,i%3===0?2:1, i%3===0?2:1,'#fff9d191');}
  c.fillStyle=grad(c,0,450,0,540,[[0,'#b7b48900'],[1,'#747e4966']]);c.fillRect(0,450,width,90);
 }
 function platform(c,p,index){
  const x=p.x,y=p.y,w=p.w;
  if(p.solid===false){
   c.save();c.globalAlpha=.7;c.setLineDash([8,7]);
   rr(c,x,y,w,14,6,'#e9d3a12e','#9d784d',2);c.setLineDash([]);
   c.fillStyle='#8c6f45';c.font='bold 10px Trebuchet MS';c.textAlign='center';
   c.fillText('Вернётся через '+Math.max(0,p.returnTime).toFixed(1)+' с',x+w/2,y-10);
   c.restore();return;
  }
  if(p.kind==='pot'){
   // Большой горшок: верхняя грань точно совпадает с коллизией.
   path(c,`M${x+9} ${y+8}H${x+w-9}L${x+w-30} ${y+97}Q${x+w/2} ${y+119} ${x+30} ${y+97}Z`,grad(c,x,y,x+w,y+100,[[0,'#dfaa76'],[.48,'#bd8456'],[1,'#a16a43']]),'#735333',3);
   path(c,`M${x+26} ${y+23}L${x+41} ${y+84}`,null,'#ecc395',7);
   rr(c,x,y,w,20,6,grad(c,x,y,x,y+20,[[0,'#f0c58b'],[.5,'#d5a16a'],[1,'#b57b4e']]),'#735333',3);
   rr(c,x+10,y-1,w-20,7,3,'#788544','#55703b',2);
   for(let i=0;i<3;i++){const px=x+45+i*(w-90)/2;path(c,`M${px} ${y+44}q13 9 23 0`,null,'#a67349',2);}
  }else if(p.kind==='shelf'){
   // Деревянная подставка с крупной доской и видимыми торцами.
   rr(c,x,y,w,25,7,grad(c,x,y,x,y+27,[[0,'#d8b67e'],[.28,'#d0a76d'],[.35,'#b78e58'],[1,'#9b7547']]),'#665334',3);
   line(c,x+12,y+10,x+w-12,y+10,'#edcc91',2);line(c,x+21,y+19,x+w-17,y+19,'#956c42',1.5);
   ellipse(c,x+17,y+13,3,3,'#7b6643');ellipse(c,x+w-17,y+13,3,3,'#7b6643');
   for(const px of[x+24,x+w-35]){path(c,`M${px} ${y+25}L${px+7} ${y+65} ${px+20} ${y+25}`, '#aa8859','#74603e',2);}
   // Несколько свисающих листиков, которые не закрывают край.
   line(c,x+w-26,y+27,x+w-17,y+84,'#61814c',2);
   leaf(c,x+w-19,y+48,.22,-1,'#789652');leaf(c,x+w-18,y+66,.22,.7,'#90aa63');
  }else{
   rr(c,x,y,w,190,6,grad(c,x,y,x,y+170,[[0,'#b49b6b'],[1,'#786844']]),'#65563a',3);
   for(let i=0;i<Math.ceil(w/65);i++){const px=x+18+i*65;path(c,`M${px} ${y+42}l19-8 14 18-17 8Z`,'#8c7a4f',null);}
   rr(c,x,y,w,22,7,'#98b561','#566c3a',3);
   for(let i=0;i<w;i+=29){ellipse(c,x+i+13,y+18,19,9,'#7e9b4d');}
   line(c,x+9,y+4,x+w-9,y+4,'#bdd58c',3);
   for(let i=20;i<w;i+=70){path(c,`M${x+i} ${y}l-5-12 11 6 8-9-1 15`, '#a8c976',null);}
  }
  if(p.moving){
   const base=p.baseY??p.y;
   if(p.axis==='x')line(c,p.baseX-p.amplitude,y+32,p.baseX+p.w+p.amplitude,y+32,'#91a88677',3);
   else line(c,x+12,base-p.amplitude-12,x+12,base+p.amplitude+28,'#91a88677',4);
   rr(c,x+3,y-24,23,22,6,'#d4e8b1','#63774a',1.8);
   if(p.axis==='x')path(c,`M${x+9} ${y-13}h12m-8-5-5 5 5 5m4-10 5 5-5 5`,null,'#63774a',1.8);
   else path(c,`M${x+10} ${y-18}l5-4 5 4m-5-4v14m-5-4 5 4 5-4`,null,'#63774a',1.8);
   line(c,x+35,y+4,x+w-18,y+4,'#c8df9e',3);
  }
  if(p.fragile){
   // Трещины и тёплая предупреждающая полоса отличают хрупкую доску.
   path(c,`M${x+w*.33} ${y+1}l7 7-11 4 6 12M${x+w*.7} ${y+1}l-8 10 9 8`,null,'#79533a',2.5);
   line(c,x+7,y+3,x+27,y+3,'#e6b25f',3);line(c,x+w-28,y+3,x+w-8,y+3,'#e6b25f',3);
   if(p.triggered){
    rr(c,x+w-52,y-27,49,22,7,'#e6b66f','#93633b',1.7);
    c.fillStyle='#fff4ce';c.font='bold 12px Trebuchet MS';c.textAlign='center';
    c.fillText(Math.max(0,p.collapseDelay-p.collapseTime).toFixed(1)+' с',x+w-27,y-12);
   }else{
    rr(c,x+w-30,y-22,24,19,6,'#edcd8e','#9f7b46',1.5);
    c.fillStyle='#8e6c3f';c.font='bold 13px Trebuchet MS';c.textAlign='center';c.fillText('!',x+w-18,y-8);
   }
  }
 }
 function yarn(c,x,y,t=0,scale=1){
  c.save();c.translate(x,y);c.scale(scale,scale);
  const glow=c.createRadialGradient(0,0,7,0,0,32);glow.addColorStop(0,'#fff5bc66');glow.addColorStop(1,'#fff5bc00');c.fillStyle=glow;c.fillRect(-33,-33,66,66);
  ellipse(c,0,0,15,15,grad(c,-13,-14,15,16,[[0,'#f4ce95'],[.4,'#dfa66e'],[1,'#bf8055']]),'#805638',2);
  c.save();c.beginPath();c.arc(0,0,14,0,Math.PI*2);c.clip();
  for(let i=-14;i<=14;i+=5){path(c,`M${i-15}-17Q${i+18} 0 ${i-8} 20`,null,'#f8d7a0',1.4);}
  path(c,'M-18 3Q0-12 18 5M-17 11Q0-5 17 13',null,'#ba7f54',1.4);c.restore();
  path(c,'M12 9q10-5 10 3t8 5',null,'#805638',2);
  c.fillStyle='#fff7c9';c.font='bold 11px Trebuchet MS';c.fillText('✦',-25,-17+Math.sin(t*3)*2);
  c.restore();
 }
 function cat(c,player,t=0,scale=1){
  c.save();c.translate(player.x+player.w/2,player.y+player.h);c.scale(scale*(player.facing||1),scale);
  const running=Math.abs(player.vx||0)>1&&player.grounded;const phase=running?Math.sin(t*19):0;
  c.lineJoin='round';c.lineCap='round';
  ellipse(c,0,2,24,4,'#4f51332b');
  // Хвост и четыре лапки.
  path(c,'M-18-20C-48-19-47-46-34-43-24-41-35-30-21-31', '#dfa059',ink,2.3);
  path(c,'M-40-36q6 4 9 0',null,'#b67b40',3);
  for(const [x,offset]of[[-13,phase*5],[12,-phase*5]]){
   rr(c,x-5+offset,-18,11,19,5,'#d9964e',ink,2);
   ellipse(c,x+offset,0,7,4,'#fff0c9',ink,1.7);
  }
  // Тело и светлая грудка.
  ellipse(c,-1,-26,22,19,grad(c,-15,-45,15,-10,[[0,'#edb76c'],[1,'#d88e48']]),ink,2.4);
  path(c,'M6-41q19 3 14 20t-17 4Z','#fff0ce',null);
  path(c,'M-16-37l5 10m2-15 5 11',null,'#b87536',3.5);
  // Уши: крупные формы с мягкой внутренней частью.
  path(c,'M-17-48L-22-76-2-64 15-76 25-48Z','#e9a456',ink,2.4);
  path(c,'M-15-53L-17-68-6-61M10-61l7-8 3 17','#d9957e',null);
  ellipse(c,3,-49,25,22,grad(c,-20,-69,26,-28,[[0,'#f5c77f'],[.65,'#e9a75b'],[1,'#da914b']]),ink,2.4);
  path(c,'M-7-69l3 9m5-10 1 9m8-8-3 9',null,'#bd7a39',3);
  // Глаза и белые щёчки.
  ellipse(c,-6,-50,7,9,'#fff8dd',ink,1.6);ellipse(c,14,-50,7,9,'#fff8dd',ink,1.6);
  ellipse(c,-4,-49,3.7,6,'#73915a');ellipse(c,16,-49,3.7,6,'#73915a');
  ellipse(c,-3,-49,2,5,'#3e4130');ellipse(c,17,-49,2,5,'#3e4130');
  ellipse(c,-2,-52,1.7,2.1,'#fffde8');ellipse(c,18,-52,1.7,2.1,'#fffde8');
  ellipse(c,-4,-35,11,8,'#fff0ce');ellipse(c,12,-35,11,8,'#fff0ce');
  path(c,'M1-40Q5-43 9-40L5-36Z','#cb8b78',ink,1.3);
  path(c,'M5-36v4q-5 5-9 0m9 0q5 5 9 0',null,ink,1.3);
  for(const [sx,sy,ex,ey]of[[-12,-39,-29,-43],[-13,-35,-30,-34],[21,-39,34,-43],[22,-35,36,-33]])line(c,sx,sy,ex,ey,'#6d5836',1.2);
  // Ошейник с маленьким листиком.
  path(c,'M-5-25q14 9 24-4',null,'#7b9953',4);ellipse(c,9,-22,3,4,'#f5d173','#9c7a44',1);
  c.restore();
 }
 function dog(c,dog,t=0){
  c.save();c.translate(dog.x+dog.w/2,dog.y+dog.h);c.scale(dog.direction||1,1);c.lineCap='round';c.lineJoin='round';
  const walk=Math.sin(t*10)*3;
  ellipse(c,0,2,32,4,'#4e4f3029');
  path(c,'M-23-21q-22-20-8-27 8-3 9 11', '#aa7850',ink,2.3);
  for(const [x,p]of[[-18,walk],[16,-walk]]){rr(c,x+p-4,-18,10,18,4,'#b58c62',ink,2);ellipse(c,x+p+2,0,8,4,'#e9c89a',ink,1.8);}
  ellipse(c,-1,-25,29,18,'#bd9769',ink,2.4);ellipse(c,-7,-31,10,8,'#a47b52');
  ellipse(c,21,-39,21,20,'#d6b082',ink,2.4);
  ellipse(c,9,-48,9,16,'#94714c',ink,2);
  ellipse(c,28,-40,7,8,'#fff0cc',ink,1.5);ellipse(c,30,-40,2.7,4,'#66543a');ellipse(c,31,-42,1,1.5,'#fff9e1');
  ellipse(c,35,-27,15,10,'#efcf9c',ink,2);ellipse(c,45,-31,6,4,'#4c4435');
  path(c,'M30-23q8 5 14-1',null,ink,1.5);path(c,'M35-20q1 12 7 3v-6','#d08c77',ink,1.3);
  path(c,'M6-24q10 8 23 0',null,'#b96f55',4);ellipse(c,20,-19,4,4,'#dfc074','#8e7044',1);
  // Знак опасности виден издали, но собака остаётся дружелюбной по стилю.
  rr(c,-2,-87,24,23,8,'#df9f7e','#95684b',1.7);c.fillStyle='#fff1c6';c.font='bold 18px Trebuchet MS';c.textAlign='center';c.fillText('!',10,-70);
  c.restore();
 }
 function bed(c,f,t=0,ready=false){
  const x=f.x,y=f.y,w=f.w;
  c.save();c.translate(x+w/2,y+f.h);
  if(ready){const g=c.createRadialGradient(0,-25,0,0,-25,72);g.addColorStop(0,'#fff5b766');g.addColorStop(1,'#fff5b700');c.fillStyle=g;c.fillRect(-75,-100,150,140);}
  ellipse(c,0,1,58,8,'#776b3e30');
  ellipse(c,0,-19,51,25,'#a5b47b',ink,2.5);ellipse(c,0,-24,41,17,'#5f7f50',ink,2);ellipse(c,0,-20,34,13,'#d9b1a0','#846d4a',2);
  path(c,'M-48-22q3 28 48 28t48-28q-5 16-48 15t-48-15Z',grad(c,-30,-15,35,8,[[0,'#c4d09b'],[1,'#7f995f']]),ink,2.4);
  path(c,'M-30-1q12 4 23 3m13 0q16-1 22-4',null,'#e0e6b8',2);
  line(c,41,-14,41,-80,'#7f7045',3);path(c,'M42-80h38l-7 12 7 12H42Z',ready?'#f0c479':'#b7c88c','#71643e',1.5);
  c.fillStyle='#7c6c3f';c.font='bold 8px Trebuchet MS';c.textAlign='center';c.fillText('ДОМОЙ',60,-65);
  if(ready){c.fillStyle='#f7e4a0';c.font='bold 14px Trebuchet MS';c.fillText('✦',-53,-51+Math.sin(t*3)*3);}
  c.restore();
 }
 function foreground(c,camera,width,index){
  // Растения внизу кадра обрамляют мир и не скрывают площадки.
  const offset=(camera*.8)%370;
  for(let x=-offset-100;x<width+130;x+=370){plant(c,x,589,1.4,index,false);plant(c,x+65,594,1,index+1,false);}
 }
 function icon(name){
  const outer='stroke="#665535" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"';
  const icons={
   heart:'<path d="M28 48C-4 28 5 6 19 10q6 1 9 7 3-6 9-7 14-4 17 10 3 14-26 28Z" fill="#d99c82"/><path d="M13 18q4-6 10-1" fill="none" stroke="#f9d3b5" stroke-width="4"/>',
   yarn:'<circle cx="25" cy="25" r="19" fill="#e6ac77"/><g fill="none" stroke="#fbe1ad" stroke-width="2"><path d="M13 10q29 7 21 32M7 21q25-15 36 7M7 31q24-16 34 5M20 6q-10 23 10 38"/></g><circle cx="25" cy="25" r="19" fill="none"/><path d="M40 36q14-6 9 6t8 5" fill="none"/>',
   cup:'<path d="M16 8h24v17q0 13-12 13T16 25Z" fill="#edc86a"/><path d="M16 13H8q-2 17 12 17m20-17h8q2 17-12 17M28 38v9m-10 3h20" fill="none"/><path d="m28 13 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="#fff1b7" stroke-width="1.5"/>',
   pause:'<rect x="15" y="11" width="10" height="33" rx="2" fill="#fff1c2"/><rect x="32" y="11" width="10" height="33" rx="2" fill="#fff1c2"/>',
   restart:'<path d="M16 18a19 19 0 1 1-6 16" fill="none" stroke="#fff1c2" stroke-width="7"/><path d="M8 10v18h18Z" fill="#fff1c2" stroke="none"/>',
   expand:'<path d="M22 10H10v12m24-12h12v12M10 34v12h12m24-12v12H34" fill="none" stroke="#fff1c2" stroke-width="6"/>',
   left:'<path d="m35 10-22 18 22 18Z" fill="#fff3ca"/>',right:'<path d="m21 10 22 18-22 18Z" fill="#fff3ca"/>',up:'<path d="m10 35 18-22 18 22Z" fill="#fff3ca"/>',play:'<path d="m17 8 28 20-28 20Z" fill="#fff3ca"/>',
   leaf:'<path d="M9 45C-2 13 19-1 49 7 58 34 37 54 9 45Z" fill="#92b960"/><path d="M8 48 39 17M19 36l-2-13m10 4 13 1" fill="none" stroke="#e0eab0" stroke-width="2"/>',
   paw:'<ellipse cx="28" cy="37" rx="15" ry="12" fill="#f1d29b"/><g fill="#f1d29b"><ellipse cx="10" cy="22" rx="6" ry="8" transform="rotate(-25 10 22)"/><ellipse cx="23" cy="13" rx="6" ry="8"/><ellipse cx="37" cy="13" rx="6" ry="8"/><ellipse cx="49" cy="25" rx="6" ry="8" transform="rotate(25 49 25)"/></g>',
   bed:'<ellipse cx="28" cy="30" rx="23" ry="15" fill="#a8bd7d"/><ellipse cx="28" cy="27" rx="16" ry="8" fill="#dcb5a3"/><path d="M5 30q0 17 23 17t23-17q-3 9-23 9T5 30Z" fill="#98b573"/>',
   dog:'<path d="M11 23Q11 7 27 7t18 17l6 9-9 14H17L6 36Z" fill="#cfaa7b"/><path d="M13 15 4 30l7 7 10-20M41 15l10 15-7 7-10-20" fill="#97734f"/><circle cx="23" cy="25" r="2" fill="#514832"/><circle cx="35" cy="25" r="2" fill="#514832"/><path d="m24 34 5 5 5-5Z" fill="#6d553b"/>',
   lock:'<rect x="13" y="24" width="31" height="26" rx="5" fill="#9e946f"/><path d="M19 24V14a10 10 0 0 1 20 0v10" fill="none" stroke="#9e946f" stroke-width="6"/><circle cx="29" cy="36" r="3" fill="#e4d9af"/>',
   close:'<path d="m15 15 26 26m0-26L15 41" stroke="#fff0c7" stroke-width="8"/>',
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" aria-hidden="true"><g ${outer}>${icons[name]||icons.paw}</g></svg>`;
 }
 return {background,platform,yarn,cat,dog,bed,foreground,plant,smallPot,icon,palettes};
})();
