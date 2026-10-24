'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
class Player{
 constructor(p){this.x=75;this.y=p.y-66;this.w=42;this.h=66;this.vx=0;this.vy=0;this.facing=1;this.grounded=true;this.groundPlatform=p.index;this.lastLanded=p.index;this.bounced=false;}
 update(dt,platforms,width,controls,doors=[]){
  this.bounced=false;
  const support=platforms[this.groundPlatform];
  if(this.grounded&&support?.solid){this.x+=support.dx;this.y+=support.dy;}
  else if(support&&!support.solid)this.grounded=false;
  const axis=clamp(controls.axis||0,-1,1);
  if(this.grounded&&support?.type==='ice'){
   if(axis)this.vx+=clamp(axis*PHYSICS.speed-this.vx,-1700*dt,1700*dt);
   else{this.vx*=Math.exp(-1.35*dt);if(Math.abs(this.vx)<.3)this.vx=0;}
  }else this.vx=axis*PHYSICS.speed;
  if(this.vx)this.facing=Math.sign(this.vx);
  if(controls.jump&&this.grounded){this.vy=-PHYSICS.jump;this.grounded=false;}
  const solids=doors.length?[...platforms,...doors]:platforms;
  this.x=clamp(this.x+this.vx*dt,0,width-this.w);
  for(const p of solids){
   if(p.solid===false||!overlap(this,p))continue;
   if(this.vx>0)this.x=p.x-this.w;else if(this.vx<0)this.x=p.x+p.w;
  }
  this.vy+=PHYSICS.gravity*dt;this.y+=this.vy*dt;this.grounded=false;this.groundPlatform=null;
  for(const p of solids){
   if(p.solid===false||!overlap(this,p))continue;
   if(this.vy>0){
    this.y=p.y-this.h;this.vy=0;this.grounded=true;this.groundPlatform=p.index;this.lastLanded=p.index;
    if(p.type==='spring'){this.vy=-PHYSICS.springJump;this.grounded=false;this.bounced=true;p.bounce=.28;}
   }else if(this.vy<0){this.y=p.y+p.h;this.vy=0;}
  }
 }
}
class RunGame{
 constructor(records={levels:0,yarn:0},onEvent=()=>{}){
  this.records=records;this.onEvent=onEvent;this.state='menu';this.seed=1;this.number=1;this.lives=3;this.completed=0;this.totalYarn=0;this.runTime=0;this.credited=new Set();this.viewportWidth=960;this.loadLevel();this.state='menu';
 }
 loadLevel(){
  this.level=generateLevel(this.number,this.seed);
  this.platforms=this.level.platforms.map(p=>({...p,dx:0,dy:0,solid:true,triggered:false,collapseTime:0,returnTime:0,bounce:0}));
  this.yarn=this.level.yarn.map(y=>({...y,taken:false}));this.dogs=this.level.dogs.map(d=>({...d}));this.hazards=this.level.hazards.map(h=>({...h}));
  this.player=new Player(this.platforms[0]);this.score=0;this.time=0;this.camera=0;this.finishHint=false;this.hints=new Set();this.reason='';this.updateHazards();this.updateCamera(0,true);
 }
 newRun(seed=Date.now()>>>0){
  this.seed=seed>>>0;this.number=1;this.lives=3;this.completed=0;this.totalYarn=0;this.runTime=0;this.credited=new Set();
  this.loadLevel();this.state='brief';this.onEvent('brief');
 }
 begin(){if(this.state!=='brief')return;this.state='running';this.onEvent('start');}
 retry(){if(this.state!=='lifeLost')return;this.loadLevel();this.state='running';this.onEvent('start');}
 next(){if(this.state!=='levelWon')return;this.number++;this.credited=new Set();this.loadLevel();this.state='brief';this.onEvent('brief');}
 pause(){if(this.state!=='running')return;this.state='paused';this.onEvent('pause');}
 resume(){if(this.state!=='paused')return;this.state='running';this.onEvent('resume');}
 saveRecords(){
  const levels=Math.max(this.records.levels,this.completed),yarn=Math.max(this.records.yarn,this.totalYarn);
  if(levels!==this.records.levels||yarn!==this.records.yarn){this.records.levels=levels;this.records.yarn=yarn;this.onEvent('record');}
 }
 loseLife(reason){
  if(!['running','paused'].includes(this.state))return;
  this.lives=Math.max(0,this.lives-1);this.reason=reason;this.state=this.lives?'lifeLost':'gameover';this.saveRecords();this.onEvent(this.state);
 }
 complete(){
  if(this.state!=='running')return;
  this.completed++;this.state='levelWon';this.saveRecords();this.onEvent('levelWon');
 }
 endRun(){this.saveRecords();this.state='menu';this.onEvent('menu');}
 updateCamera(dt,snap=false){
  const target=clamp(this.player.x+this.player.w/2-this.viewportWidth*.36,0,Math.max(0,this.level.width-this.viewportWidth));
  this.camera=snap?target:this.camera+(target-this.camera)*(1-Math.exp(-8*dt));
  this.camera=clamp(this.camera,0,Math.max(0,this.level.width-this.viewportWidth));
 }
 updatePlatforms(dt){
  for(const p of this.platforms){
   const x=p.x,y=p.y;
   if(p.moving){const offset=Math.sin(this.time*p.frequency)*p.amplitude;if(p.axis==='x')p.x=p.baseX+offset;else p.y=p.baseY+offset;}
   p.dx=p.x-x;p.dy=p.y-y;p.bounce=Math.max(0,p.bounce-dt);
   if(p.fragile){
    if(!p.solid){p.returnTime-=dt;if(p.returnTime<=0){p.solid=true;p.triggered=false;p.collapseTime=0;p.returnTime=0;}}
    else if(p.triggered){p.collapseTime+=dt;if(p.collapseTime>=p.collapseDelay){p.solid=false;p.returnTime=p.returnDelay;}}
   }
  }
  for(const y of this.yarn){const p=this.platforms[y.platform];y.x=p.x+y.offsetX;y.y=p.y+y.offsetY;}
 }
 updateHazards(){
  for(const h of this.hazards){
   h.justClosed=false;
   if(h.type==='swing'){
    h.anchorX=h.x;h.anchorY=h.y-180;
    h.currentAngle=Math.sin((this.time+h.phase)*h.frequency)*h.angle;
    const cx=h.anchorX+Math.sin(h.currentAngle)*h.length,cy=h.anchorY+Math.cos(h.currentAngle)*h.length;
    h.box={x:cx-25,y:cy-23,w:50,h:46};h.active=true;
   }else{
    const cycle=h.open+h.warning+h.closed,phase=(this.time+h.phase)%cycle;
    const active=phase>=h.open+h.warning;
    h.justClosed=!h.active&&active;h.active=active;h.warn=phase>=h.open&&!active;
    h.untilSwitch=active?cycle-phase:h.open+h.warning-phase;
    h.box={x:h.x,y:h.y-h.h,w:h.w,h:h.h};
   }
  }
 }
 updateDogs(dt){
  for(const dog of this.dogs){
   const distance=this.player.x+this.player.w/2-(dog.x+dog.w/2);
   dog.alert=dog.type==='chase'&&Math.abs(distance)<270&&Math.abs(this.player.y+this.player.h-(dog.baseY+dog.h))<115;
   if(dog.alert)dog.direction=Math.sign(distance)||dog.direction;
   const speed=dog.speed*(dog.alert?1.2:dog.type==='chase'?.6:1);
   dog.x+=speed*dog.direction*dt;
   if(dog.x>=dog.max){dog.x=dog.max;dog.direction=-1;}else if(dog.x<=dog.min){dog.x=dog.min;dog.direction=1;}
   if(dog.type==='jumper'){
    dog.jumpClock-=dt;
    if(dog.y>=dog.baseY&&dog.jumpClock<=0){dog.vy=-300;dog.jumpClock=dog.jumpPeriod;}
    dog.vy+=1050*dt;dog.y+=dog.vy*dt;if(dog.y>dog.baseY){dog.y=dog.baseY;dog.vy=0;}
   }
  }
 }
 update(dt,controls={axis:0,jump:false}){
  if(this.state!=='running')return;
  this.time+=dt;this.runTime+=dt;this.updatePlatforms(dt);this.updateHazards();
  // Закрывающаяся створка опасна только если котёнок находится прямо в проёме.
  for(const h of this.hazards)if(h.type==='gate'&&h.justClosed&&overlap(this.player,h.box)){this.loseLife('Створки закрылись! Проходи на зелёный сигнал и не стой в проёме.');return;}
  const doors=this.hazards.filter(h=>h.type==='gate'&&h.active).map(h=>({...h.box,solid:true,index:null}));
  this.player.update(dt,this.platforms,this.level.width,controls,doors);
  const support=this.platforms[this.player.groundPlatform];
  if(this.player.grounded&&support?.fragile&&!support.triggered){support.triggered=true;support.collapseTime=0;}
  this.updateDogs(dt);
  for(const dog of this.dogs)if(overlap(this.player,dog)){this.loseLife(dog.type==='jumper'?'Прыгающая собака! Дождись её приземления и выбери момент для прыжка.':dog.type==='chase'?'Собака заметила котёнка! Перепрыгни преследователя с запасом.':'Сторож преградил дорогу. Перепрыгни собаку полностью.');return;}
  for(const h of this.hazards)if(h.type!=='gate'&&h.active&&overlap(this.player,h.box)){this.loseLife(h.type==='swing'?'Подвесной горшок задел котёнка. Подожди безопасную фазу качания.':'Разбрызгиватель включился! Переходи, когда струя выключена.');return;}
  if(this.player.y>620){this.loseLife('Котёнок упал. Подбери момент прыжка и учитывай движение подставок.');return;}
  for(const y of this.yarn)if(!y.taken&&overlap(this.player,{x:y.x-15,y:y.y-17,w:30,h:34})){
   y.taken=true;this.score++;
   if(!this.credited.has(y.id)){this.credited.add(y.id);this.totalYarn++;this.saveRecords();}
   this.onEvent('collect');
  }
  this.updateCamera(dt);
  if(overlap(this.player,this.level.finish)){
   if(this.score===this.yarn.length){this.complete();return;}
   if(!this.finishHint){this.finishHint=true;this.onEvent('hint','Осталось клубочков: '+(this.yarn.length-this.score)+'. Можно вернуться назад.');}
  }else this.finishHint=false;
  const next=this.platforms.find(p=>p.x>this.player.x&&p.x-this.player.x<240&&!this.hints.has(p.type)&&!['ground','normal'].includes(p.type));
  if(next){this.hints.add(next.type);this.onEvent('mechanic',next.type);}
 }
}
