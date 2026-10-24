'use strict';
const $=id=>document.getElementById(id);
const input={keys:new Set(),pointers:new Map(),jumpQueued:false};
const movementCodes=new Set(['ArrowLeft','ArrowRight','KeyA','KeyD','Space','KeyW','ArrowUp']);
function clearInput(){input.keys.clear();input.pointers.clear();input.jumpQueued=false;document.querySelectorAll('[data-control]').forEach(b=>b.classList.remove('held'));}
function held(action){return(action==='left'?['ArrowLeft','KeyA']:['ArrowRight','KeyD']).some(code=>input.keys.has(code))||[...input.pointers.values()].includes(action);}
const STORAGE_KEY='greenhouse-kitten-endless-v1';
let records={levels:0,yarn:0};
function storageWarning(){$('storage-warning').hidden=false;}
try{
 const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
 if(saved&&typeof saved==='object')for(const key of ['levels','yarn'])if(Number.isSafeInteger(saved[key])&&saved[key]>=0)records[key]=saved[key];
}catch(_){storageWarning();}
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(records));}catch(_){storageWarning();}}
const descriptions={patrol:'Сторож со значком • патрулирует площадку. Перепрыгни его с запасом.',chase:'Собака со стрелкой → замечает котёнка и бежит к нему. Не задерживайся рядом.',jumper:'Собака со стрелкой ↑ прыгает. Дождись приземления перед своим прыжком.',ice:'На голубой доске котёнок скользит! Тормози встречным движением.',horizontal:'Лифт со стрелками ↔ перевозит котёнка. Учитывай движение площадки при прыжке.',vertical:'Подставка движется вверх-вниз. Подожди удобную высоту.',fragile:'Трещины на доске: после приземления она исчезнет. Следи за таймером!',spring:'Зелёная подушка автоматически подбрасывает выше обычного. Управляй в воздухе.',sprinkler:'Подожди, пока высокая струя выключится. Перед включением мигает жёлтый сигнал.',gate:'Створки пропускают на зелёный свет. Не стой в проёме при закрытии!',swing:'Подвесной горшок раскачивается. Наблюдай за ритмом и выбирай момент.'};
let accumulator=0,toastUntil=0,panelMode='',helpPage=0,helpReturn='menu';
const game=new RunGame(records,(event,text)=>{
 if(event==='record')persist();
 if(event==='brief'){clearInput();hideScreens();$('hud').hidden=false;$('route').hidden=false;$('game-help').hidden=false;updateHUD();renderer.draw();showBrief();}
 if(event==='start'||event==='resume'){accumulator=0;clearInput();hideScreens();$('hud').hidden=false;$('route').hidden=false;$('game-help').hidden=false;$('touch-controls').hidden=false;$('toast').classList.remove('visible');toastUntil=0;updateHUD();renderer.draw();}
 if(event==='pause'){clearInput();showPause();}
 if(['lifeLost','gameover','levelWon'].includes(event)){clearInput();updateHUD();renderer.draw();showResult();}
 if(event==='hint')toast(text);
 if(event==='mechanic'&&descriptions[text])toast(descriptions[text]);
 if(event==='menu')showMenu();
});
class Renderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.ratio=1;this.scale=1;}
 resize(){
  const width=window.innerWidth,height=window.innerHeight;
  this.ratio=Math.min(window.devicePixelRatio||1,2.5);this.canvas.width=Math.round(width*this.ratio);this.canvas.height=Math.round(height*this.ratio);
  this.scale=height/VIEW.height;game.viewportWidth=width/this.scale;game.updateCamera(0,true);this.draw();
 }
 draw(){
  const c=this.ctx,g=game,w=g.viewportWidth,t=g.time;
  c.setTransform(this.ratio*this.scale,0,0,this.ratio*this.scale,0,0);c.clearRect(0,0,w,540);
  Art.background(c,t,g.camera,w,g.level.theme);
  if(g.state==='menu'){
   const portrait=w<550;
   Art.platform(c,{x:w*.51,y:portrait?490:453,w:w*.53+30,h:180,kind:'ground'});
   Art.smallPot(c,w*.9,portrait?490:450,portrait?1.1:1.6,1);
   Art.cat(c,{x:w*(portrait?.70:.76),y:(portrait?487:448)-66,w:42,h:66,vx:0,facing:-1,grounded:true},0,portrait?2.1:3.1);
   Art.smallPot(c,w*.56,portrait?500:467,portrait?.7:1.2,2);Art.foreground(c,0,w,0);return;
  }
  c.save();c.translate(-g.camera,0);
  const visible=(x,width=150)=>x+width>g.camera-100&&x<g.camera+w+100;
  for(const p of g.platforms)if(visible(p.x,p.w))Effects.platform(c,p);
  const first=g.platforms[0],last=g.platforms.at(-1);
  if(visible(5,60))Art.smallPot(c,25,first.y,1.3,g.level.theme);
  if(visible(last.x+last.w-55,65))Art.smallPot(c,last.x+last.w-47,last.y,1.5,g.level.theme+1);
  for(const y of g.yarn)if(!y.taken&&visible(y.x,35))Art.yarn(c,y.x,y.y+Math.sin(t*2.8+y.x)*2,t);
  if(visible(g.level.finish.x,160))Art.bed(c,g.level.finish,t,g.score===g.yarn.length);
  for(const h of g.hazards)if(visible(h.x-140,290))Effects.hazard(c,h,t);
  for(const d of g.dogs)if(visible(d.x,85))Effects.dog(c,d,t);
  Art.cat(c,g.player,t);c.restore();Art.foreground(c,g.camera,w,g.level.theme);
 }
}
const renderer=new Renderer($('game'));
function hearts(n){return Array.from({length:3},(_,i)=>`<span class="${i<n?'':'lost-heart'}">${Art.icon('heart')}</span>`).join('');}
function updateHUD(){
 $('score').textContent=game.score+' / '+game.yarn.length;$('run-yarn').textContent=game.totalYarn;$('yarn-record').textContent=records.yarn;
 $('completed').textContent=game.completed;$('level-record').textContent=records.levels;
 $('menu-level-record').textContent=records.levels;$('menu-yarn-record').textContent=records.yarn;
 if($('hearts').dataset.count!==String(game.lives)){$('hearts').innerHTML=hearts(game.lives);$('hearts').dataset.count=String(game.lives);$('hearts').setAttribute('aria-label','Осталось жизней: '+game.lives);}
 $('level-number').textContent='УРОВЕНЬ '+game.number+(game.level.challenge?' · ИСПЫТАНИЕ':'');$('level-name').textContent=game.level.name;
 $('route-progress').style.width=clamp(game.player.x/(game.level.width-game.player.w)*100,0,100)+'%';
}
function hideScreens(){
 $('menu-screen').hidden=true;$('modal-layer').hidden=true;panelMode='';$('hud').inert=false;$('touch-controls').inert=false;$('menu-screen').inert=false;
 if(document.activeElement instanceof HTMLButtonElement)document.activeElement.blur();
}
function setPanel(mode,{title,eyebrow='',text='',content='',primary='Продолжить',secondary='',illustration='',menu=true}){
 panelMode=mode;$('panel-title').textContent=title;$('panel-eyebrow').textContent=eyebrow;$('panel-description').textContent=text;
 $('panel-content').innerHTML=content;$('panel-illustration').innerHTML=illustration||Art.icon('yarn')+Art.icon('paw')+Art.icon('bed');
 $('primary-action').textContent=primary;$('secondary-action').hidden=!secondary;$('secondary-action').textContent=secondary;
 $('panel-menu').hidden=!menu;$('modal-layer').hidden=false;$('hud').inert=true;$('touch-controls').inert=true;$('menu-screen').inert=true;$('touch-controls').hidden=true;
 $('primary-action').focus({preventScroll:true});
}
function showMenu(){
 game.state='menu';clearInput();hideScreens();$('menu-screen').hidden=false;$('hud').hidden=true;$('route').hidden=true;$('game-help').hidden=true;$('touch-controls').hidden=true;
 updateHUD();renderer.draw();
}
function showBrief(){
 const level=game.level;
 const content=`${level.challenge?'<span class="challenge-label">КАЖДЫЙ ПЯТЫЙ — ОСОБОЕ ИСПЫТАНИЕ</span>':''}<div class="mission"><div>${Art.icon('yarn')}<b>${level.yarn.length}</b><small>клубочков</small></div><div>${Art.icon('heart')}<b>${game.lives} / 3</b><small>жизни на забег</small></div><div>${Art.icon('cup')}<b>${game.completed}</b><small>уровней пройдено</small></div></div><div class="feature-list">${level.features.map(f=>'<span>'+f+'</span>').join('')}</div><p class="run-note">Собери все клубочки и доберись до лежанки. Жизни не восстанавливаются между уровнями.</p>`;
 setPanel('brief',{title:'Уровень '+game.number,eyebrow:level.name.toUpperCase(),text:level.challenge?'Особые правила этого уровня. Держи ритм и береги жизни!':'Новый маршрут. Те же три жизни на всё приключение.',content,primary:'Старт'});
}
function showPause(){
 setPanel('pause',{title:'Пауза',eyebrow:'КОТЁНОК ОТДЫХАЕТ',text:'Все таймеры, собаки и препятствия остановлены.',primary:'Продолжить',secondary:'Как играть',content:`<div class="panel-hearts">${hearts(game.lives)}</div><p class="run-note">Уровень ${game.number} · пройдено ${game.completed} · клубочков за забег ${game.totalYarn}</p>`});
}
function resultStats(){return `<div class="mission"><div>${Art.icon('cup')}<b>${game.completed}</b><small>уровней за забег</small></div><div>${Art.icon('yarn')}<b>${game.totalYarn}</b><small>клубочков за забег</small></div><div>${Art.icon('heart')}<b>${game.lives}</b><small>жизни осталось</small></div></div><p class="run-note">Рекорды: ${records.levels} уровней · ${records.yarn} клубочков</p>`;}
function showResult(){
 if(game.state==='levelWon')setPanel('levelWon',{title:'Уровень пройден!',eyebrow:'МЯУ! ВПЕРЕДИ НОВЫЙ МАРШРУТ',text:'Все клубочки собраны. Следующий уровень будет сложнее, а жизни останутся прежними.',content:resultStats(),primary:'Дальше →',illustration:Art.icon('bed')+Art.icon('cup')});
 else if(game.state==='lifeLost')setPanel('lifeLost',{title:'Минус одна жизнь',eyebrow:'ПОПРОБУЕМ ЕЩЁ РАЗ',text:game.reason,content:`<div class="panel-hearts">${hearts(game.lives)}</div>${resultStats()}<p class="run-note">Этот же уровень начнётся сначала. Уже учтённые клубочки не дадут повторных очков в общий счёт.</p>`,primary:'Повторить уровень',illustration:Art.icon('paw')});
 else setPanel('gameover',{title:'Забег завершён',eyebrow:'ТРИ ЖИЗНИ И ОДНО БОЛЬШОЕ ПРИКЛЮЧЕНИЕ',text:game.reason,content:resultStats(),primary:'Новый забег',illustration:Art.icon('cup')+Art.icon('yarn')});
}
function requestRestart(){
 if(game.state!=='running')return;
 game.pause();setPanel('restart',{title:'Повторить уровень?',eyebrow:'ПОВТОР СТОИТ ОДНУ ЖИЗНЬ',text:'Котёнок, клубочки и препятствия вернутся к началу текущего уровня. Общий счёт останется, повторные клубочки не засчитываются.',content:`<div class="panel-hearts">${hearts(game.lives)}</div>`,primary:'Повторить · −1 жизнь',secondary:'Продолжить'});
}
function requestQuit(){
 if(game.state==='menu'||game.state==='gameover'){game.endRun();return;}
 if(game.state==='running')game.pause();
 setPanel('quit',{title:'Завершить забег?',eyebrow:'РЕКОРДЫ ОСТАНУТСЯ',text:'Следующий забег начнётся с первого уровня и трёх жизней.',content:resultStats(),primary:'В главное меню',secondary:'Остаться',menu:false});
}
function restorePanel(){if(game.state==='paused')showPause();else if(game.state==='brief')showBrief();else if(game.state==='menu')showMenu();else showResult();}
const helpPages=[
 {title:'Основы',body:'<li><b>← → / A D</b> — движение. <b>Space / W / ↑</b> — прыжок. Второго прыжка в воздухе нет. На телефоне удерживай стрелки.</li><li><b>Три жизни на забег.</b> Ошибка отнимает жизнь. Тот же уровень начинается сначала. После третьей ошибки забег завершается.</li><li><b>Финиш — лежанка.</b> Собери все клубочки текущего уровня. После финиша откроется следующий с новым маршрутом.</li><li><b>Два рекорда:</b> пройденные уровни и уникальные клубочки за один забег. Повторный сбор после потери жизни не увеличивает общий счёт.</li><li><b>P / Esc</b> — пауза. Повтор уровня вручную стоит одну жизнь. Каждые 5 уровней — испытание.</li>'},
 {title:'Платформы',body:'<li><b>Голубые скользкие доски:</b> котёнок не остановится сразу. Тормози встречным движением.</li><li><b>Лифты со стрелками:</b> движутся горизонтально или вертикально и перевозят стоящего котёнка. Выбирай момент прыжка.</li><li><b>Доски с трещинами:</b> после приземления включается короткий таймер. Уходи, пока площадка не исчезла. Через 4 секунды она вернётся.</li><li><b>Зелёная подушка со стрелкой:</b> автоматически подбрасывает выше обычного. Направляй котёнка в воздухе.</li><li><b>Испытания:</b> подвесной путь, хрупкий маршрут и стая сторожей сменяют друг друга каждые 5 уровней.</li>'},
 {title:'Опасности',body:'<li><b>Собаки:</b> • — обычный патруль; → — замечает котёнка и бежит к нему; ↑ — периодически прыгает. Любое касание опасно.</li><li><b>Разбрызгиватель:</b> высокая струя перекрывает путь. Переходи, когда она выключена. Жёлтый сигнал предупреждает о включении.</li><li><b>Створки:</b> зелёный — проходи, жёлтый — скоро закроются, красный — проход закрыт. В проёме при закрытии стоять нельзя.</li><li><b>Подвесной горшок:</b> качается как маятник. Выжди фазу и пробеги или перепрыгни под ним.</li><li><b>Безопасные площадки</b> между опасностями дают место для остановки и наблюдения.</li>'}
];
function showHelp(page=0){
 helpPage=clamp(page,0,2);
 setPanel('help',{title:'Как играть',eyebrow:'БЕРЕГИ ЖИЗНИ И БЕЙ РЕКОРД',text:'',primary:helpReturn==='menu'?'Всё понятно!':'К паузе',menu:false,illustration:Art.icon('paw')+Art.icon('yarn'),content:`<div class="help-tabs">${helpPages.map((p,i)=>`<button data-help="${i}" class="${i===helpPage?'active':''}">${p.title}</button>`).join('')}</div><ul class="instructions-list">${helpPages[helpPage].body}</ul>`});
}
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');toastUntil=performance.now()+3600;}
function newSeed(){return (Date.now()^Math.floor(Math.random()*0xffffffff))>>>0;}
// Обработчики и цикл создаются один раз на всю игру, независимо от числа уровней.
document.querySelectorAll('[data-icon]').forEach(node=>node.innerHTML=Art.icon(node.dataset.icon));
$('play-button').addEventListener('click',()=>game.newRun(newSeed()));
$('how-button').addEventListener('click',()=>{helpReturn='menu';showHelp();});
$('pause').addEventListener('click',()=>game.pause());$('restart').addEventListener('click',requestRestart);$('panel-menu').addEventListener('click',requestQuit);
$('panel-content').addEventListener('click',event=>{const button=event.target.closest('[data-help]');if(button)showHelp(Number(button.dataset.help));});
$('primary-action').addEventListener('click',()=>{
 if(panelMode==='brief')game.begin();else if(panelMode==='pause')game.resume();else if(panelMode==='levelWon')game.next();else if(panelMode==='lifeLost')game.retry();else if(panelMode==='gameover')game.newRun(newSeed());
 else if(panelMode==='restart')game.loseLife('Ты начал уровень заново. Повтор стоит одну жизнь.');
 else if(panelMode==='quit')game.endRun();else if(panelMode==='help'){if(helpReturn==='menu')showMenu();else showPause();}
});
$('secondary-action').addEventListener('click',()=>{if(panelMode==='pause'){helpReturn='pause';showHelp();}else if(panelMode==='restart')game.resume();else if(panelMode==='quit')restorePanel();});
$('close-modal').addEventListener('click',()=>{if(panelMode==='pause'||panelMode==='restart')game.resume();else if(panelMode==='help'){if(helpReturn==='menu')showMenu();else showPause();}else if(panelMode==='quit')restorePanel();else requestQuit();});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('app').requestFullscreen)await $('app').requestFullscreen();else toast('Полноэкранный режим недоступен в этом браузере.');}catch(_){toast('Браузер не разрешил полный экран. Игра продолжает работать.');}});
window.addEventListener('keydown',event=>{
 if(movementCodes.has(event.code)){
  if(game.state==='running')event.preventDefault();if(game.state!=='running')return;
  if(!input.keys.has(event.code)&&['Space','KeyW','ArrowUp'].includes(event.code))input.jumpQueued=true;
  input.keys.add(event.code);
 }
 if(event.repeat)return;
 if(['KeyP','Escape'].includes(event.code)){
  if(game.state==='running'){event.preventDefault();game.pause();}
  else if(game.state==='paused'&&panelMode==='pause'){event.preventDefault();game.resume();}
 }
});
window.addEventListener('keyup',event=>input.keys.delete(event.code));
for(const button of document.querySelectorAll('[data-control]')){
 button.addEventListener('pointerdown',event=>{event.preventDefault();if(game.state!=='running')return;button.setPointerCapture(event.pointerId);input.pointers.set(event.pointerId,button.dataset.control);button.classList.add('held');if(button.dataset.control==='jump')input.jumpQueued=true;});
 const release=event=>{input.pointers.delete(event.pointerId);if(![...input.pointers.values()].includes(button.dataset.control))button.classList.remove('held');};
 button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);button.addEventListener('contextmenu',event=>event.preventDefault());
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){game.pause();clearInput();}});window.addEventListener('blur',()=>{game.pause();clearInput();});
window.addEventListener('resize',()=>renderer.resize());
let previousTime=null;
function frame(now){
 const delta=previousTime===null?0:Math.min((now-previousTime)/1000,.05);previousTime=now;
 if(game.state==='running'){
  accumulator+=delta;
  while(accumulator>=PHYSICS.step&&game.state==='running'){
   game.update(PHYSICS.step,{axis:(held('right')?1:0)-(held('left')?1:0),jump:input.jumpQueued});input.jumpQueued=false;accumulator-=PHYSICS.step;
  }
  if(game.state==='running'){renderer.draw();updateHUD();}
 }else accumulator=0;
 if(toastUntil&&now>=toastUntil){$('toast').classList.remove('visible');toastUntil=0;}
 requestAnimationFrame(frame);
}
renderer.resize();showMenu();requestAnimationFrame(frame);
