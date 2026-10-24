'use strict';
const VIEW=Object.freeze({width:960,height:540});
const PHYSICS=Object.freeze({speed:300,gravity:1700,jump:690,springJump:835,step:1/120});
// Один генератор вместо массива заранее нарисованных уровней.
function randomSource(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const SEGMENTS=Object.freeze([
 {type:'patrol',from:1,name:'Сторожевые собаки'}, {type:'ice',from:1,name:'Скользкие доски'},
 {type:'sprinkler',from:1,name:'Разбрызгиватели'}, {type:'horizontal',from:2,name:'Подставки-лифты'},
 {type:'fragile',from:2,name:'Исчезающие доски'}, {type:'chase',from:2,name:'Собаки-преследователи'},
 {type:'gate',from:2,name:'Створки оранжереи'}, {type:'spring',from:3,name:'Пружинящие подушки'},
 {type:'jumper',from:3,name:'Прыгающие собаки'}, {type:'swing',from:3,name:'Подвесные горшки'}
]);
function generateLevel(number,runSeed=1){
 if(!Number.isSafeInteger(number)||number<1)throw Error('Номер уровня должен быть положительным целым числом.');
 const random=randomSource((runSeed^Math.imul(number,0x9E3779B1))>>>0);
 const range=(a,b)=>a+random()*(b-a);
 const difficulty=1-Math.exp(-(number-1)/13); // Растёт плавно, оставаясь в пределах физики прыжка.
 const challenge=number%5===0?['movers','fragile','pack'][(Math.floor(number/5)-1)%3]:null;
 const count=6+Math.min(5,Math.floor((number-1)/3));
 const platforms=[],yarn=[],dogs=[],hazards=[];
 const themes=['Солнечный уголок','Зелёные джунгли','Вечерний сад'];
 const challengeNames={movers:'Испытание: подвесной путь',fragile:'Испытание: хрупкий маршрут',pack:'Испытание: стая сторожей'};
 const available=SEGMENTS.filter(s=>s.from<=number);
 const priority=available.filter(s=>s.from===number).map(s=>s.type);
 // В первых уровнях новые механики обязательны; далее — случайная смесь шаблонов.
 const deck=available.map(s=>s.type);
 for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
 function addPlatform(type,w,y,gap){
  const previous=platforms.at(-1),x=previous?previous.x+previous.w+gap:0,index=platforms.length;
  const special=['horizontal','vertical','fragile','ice','spring'].includes(type);
  const p={index,x,y,baseX:x,baseY:y,w,h:type==='ground'?190:!special&&index%3===1?95:25,kind:type==='ground'?'ground':!special&&index%3===1?'pot':'shelf',type};
  if(type==='horizontal'||type==='vertical')Object.assign(p,{moving:true,axis:type==='horizontal'?'x':'y',amplitude:challenge?18:22,frequency:1+random()*.4+difficulty*.4,phase:0});
  if(type==='fragile')Object.assign(p,{fragile:true,collapseDelay:1.18-difficulty*.27,returnDelay:4});
  platforms.push(p);
  yarn.push({id:index,platform:index,offsetX:['patrol','chase','jumper','sprinkler','gate','swing','spring'].includes(type)?65:w*.46,offsetY:-35,x:0,y:0});
  return p;
 }
 addPlatform('ground',350,440,0);
 const used=new Set();
 for(let i=0;i<count;i++){
  const type=challenge==='movers'?(i%2?'vertical':'horizontal'):challenge==='fragile'?'fragile':challenge==='pack'?(i%3===2?'jumper':'chase'):priority[i]||deck[i%deck.length];
  used.add(type);
  const arena=['patrol','chase','jumper','sprinkler','gate','swing'].includes(type);
  const width=arena?430:Math.round(215-difficulty*48+range(-9,9));
  const previous=platforms.at(-1);
  const y=Math.round(Math.max(305,Math.min(440,previous.y+range(-42,42))));
  const gap=Math.round(62+difficulty*22+range(-5,5));
  const p=addPlatform(type,width,y,gap);
  if(['patrol','chase','jumper'].includes(type))dogs.push({type,platform:p.index,x:p.x+176,y:y-42,w:54,h:42,min:p.x+132,max:p.x+225,speed:46+difficulty*92,baseY:y-42,direction:random()<.5?-1:1,vy:0,jumpClock:range(.9,2),jumpPeriod:2.6-difficulty*.65,alert:false});
  if(['sprinkler','gate','swing'].includes(type))hazards.push({type,platform:p.index,x:p.x+214,y,w:50,h:175,phase:range(0,4),open:2.65-difficulty*.55,warning:.7,closed:1.55+difficulty*.55,frequency:.85+difficulty*.35,length:127,angle:.64,active:false});
  // Безопасные участки дают место для наблюдения за следующим препятствием.
  const recoveryType=challenge==='movers'?(i%2?'horizontal':'vertical'):challenge==='fragile'?'fragile':'normal';
  const recoveryY=Math.round(Math.max(300,Math.min(445,y+range(-35,35))));
  addPlatform(recoveryType,Math.round(205-difficulty*40),recoveryY,Math.round(62+difficulty*18));
 }
 const last=platforms.at(-1),end=addPlatform('ground',440,Math.min(440,last.y+25),65);
 for(const y of yarn){const p=platforms[y.platform];y.x=p.x+y.offsetX;y.y=p.y+y.offsetY;}
 const name=challenge?challengeNames[challenge]:themes[(number-1)%3];
 const featureNames=[...used].map(type=>SEGMENTS.find(s=>s.type===type)?.name||'Движущиеся подставки');
 return {number,name,theme:(number-1)%3,challenge,difficulty,platforms,yarn,dogs,hazards,width:end.x+end.w+50,finish:{x:end.x+end.w-150,y:end.y-52,w:100,h:52},features:[...new Set(featureNames)],seed:runSeed};
}
