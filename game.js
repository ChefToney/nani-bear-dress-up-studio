// Resolve assets from the folder containing this script, not the browser page URL.
// This remains correct if GitHub Pages serves the game from a nested project path.
const ASSET_BASE = new URL(".", document.currentScript.src);
const url = n => new URL(encodeURIComponent(n), ASSET_BASE).href;
const BASE="Nani Base model.PNG";

const backgrounds=[
 "Background Beach.PNG",
 "Background Castle View.PNG",
 "Background Nani’s Room.PNG",
 "Background Princess Park.PNG",
 "Background Runway.PNG",
 "Background The Mall.PNG",
 "Background beach.jpg",
 "Background stage.jpg"
];

const assets=[
 " Pants Pink.PNG",
 "Blue Dress.PNG","Blue Skirt.PNG","Blue bow.PNG",
 "Converse Sneakers Pink.PNG","Converse Sneakers Purple.PNG","Converse Sneakers Teal.PNG",
 "Glasses.PNG","Lady Dress Red.PNG","Lady Dress blue.PNG","Lady Dress pink.PNG","Lady Dress purple.PNG",
 "Nani Tee Shirt.PNG","Pants Blue.PNG","Pants Tan.PNG","Pants White.PNG",
 "Pink Dress.PNG","Pink Skirt.PNG","Pink bow.PNG","Princess Tiara.PNG","Purple Skirt.PNG",
 "Queen Crown.PNG","Red Skirt.PNG","Red Sneakers.PNG",
 "Running Sneakers Blue.PNG","Running Sneakers Purple.PNG","Running Sneakers Red.PNG","Running Sneakers Yellow.PNG",
 "Sneakers Blue.PNG","Sneakers Grey.PNG","Sneakers Pink.PNG","Sneakers Red.PNG","Sneakers White.PNG","Sneakers Yellow & Red.PNG","Sneakers Yellow.PNG",
 "Star glasses.PNG","Sweater Blue.PNG","Sweater Grey.PNG","Sweater Pink.PNG","Sweater Red.PNG","Sweater Yellow.PNG",
 "Tan dress.PNG","Yellow Skirt.PNG","Yellow dress.PNG"
];

const tracks=["KA_HU_TI PT2.mp3","KA_HU_TI.mp3","Move_Pose.mp3","Move_Pose_Stop.mp3","Nani_Bear_Runway(1).mp3","Pah! PT2.mp3","Pah!.mp3"];
const $=id=>document.getElementById(id), music=$("music");
let trackOrder=[],trackIndex=0,activeCategory="All",worn=new Map(),dragState=null,justDragged=false;
let fxContext=null,fxEnabled=true;
function unlockFx(){
 const AudioCtx=window.AudioContext||window.webkitAudioContext;
 if(!AudioCtx)return;
 if(!fxContext)fxContext=new AudioCtx();
 if(fxContext.state==="suspended")fxContext.resume();
}
function playFx(kind="tap"){
 if(!fxEnabled||!fxContext||fxContext.state!=="running")return;
 const now=fxContext.currentTime;
 const patterns={
  tap:[[520,0,.045,"sine",.035]],
  pop:[[420,0,.07,"triangle",.055],[690,.045,.085,"sine",.035]],
  sparkle:[[880,0,.10,"sine",.045],[1175,.075,.12,"sine",.035],[1568,.15,.16,"sine",.025]],
  bling:[[1046,0,.09,"sine",.045],[1568,.08,.14,"sine",.035]]
 };
 (patterns[kind]||patterns.tap).forEach(([hz,delay,duration,wave,volume])=>{
  const osc=fxContext.createOscillator(),gain=fxContext.createGain();
  osc.type=wave;osc.frequency.setValueAtTime(hz,now+delay);
  gain.gain.setValueAtTime(.0001,now+delay);
  gain.gain.exponentialRampToValueAtTime(volume,now+delay+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);
  osc.connect(gain);gain.connect(fxContext.destination);
  osc.start(now+delay);osc.stop(now+delay+duration+.015);
 });
}

function category(file){
 const s=file.toLowerCase();
 if(/dress|tiara|crown/.test(s))return "Princess";
 if(/sweater|tee shirt|pants|skirt|bell|flow/.test(s))return "Urban";
 if(/converse|running sneakers|sneakers|heels/.test(s))return "Shoes";
 if(/bow|glasses|handbag/.test(s))return "Accessories";
 return "Runway";
}
function slot(file){
 const s=file.toLowerCase();
 if(/dress/.test(s))return "dress";
 if(/skirt|pants|bell bottoms|flow skirt/.test(s))return "bottoms";
 if(/tee shirt|sweater|sweat shirt/.test(s))return "top";
 if(/sneakers|heels/.test(s))return "shoes";
 if(/glasses/.test(s))return "glasses";
 if(/bow|tiara|crown/.test(s))return "headwear";
 if(/handbag/.test(s))return "bag";
 return "accessory";
}
function label(s){return s.replace(/^\s+/,"").replace(/\.[^.]+$/,"").replace(/^Background ?/i,"").replace(/_/g," ").trim()}
function equip(file){
 const target=slot(file);
 if(worn.get(target)===file)worn.delete(target);
 else{
  if(target==="dress"){worn.delete("top");worn.delete("bottoms")}
  if(target==="top"||target==="bottoms")worn.delete("dress");
  worn.set(target,file);
 }
 renderItems();renderWorn();
}
function makeImage(file,cls,alt){
 const im=document.createElement("img");im.className=cls;im.alt=alt||"";im.draggable=false;im.src=url(file);
 im.onerror=()=>{const msg=document.createElement("div");msg.className="asset-error";msg.textContent="Could not load: "+file; if(cls==="character-base"){$("characterLayer").append(msg)} else if(cls.startsWith("wearable")){$("characterLayer").append(msg)} else {im.replaceWith(msg)}};return im;
}
function renderBackgrounds(){
 const box=$("backgrounds");box.innerHTML="";
 backgrounds.forEach((f,i)=>{
  const b=document.createElement("button");b.className="background-choice"+(!i?" active":"");
  b.innerHTML='<img alt=""><span>'+label(f)+'</span>';
  const im=b.querySelector("img");im.src=url(f);im.onerror=()=>{im.alt="Image failed";b.classList.add("asset-missing");b.querySelector("span").textContent=label(f)+" (not loading)"};
  b.onclick=()=>{playFx("sparkle");box.querySelectorAll("button").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("scene").src=url(f)};
  box.append(b);
 });
 $("scene").src=url(backgrounds[0]);
 $("scene").onerror=()=>{const msg=document.createElement("div");msg.className="asset-error scene-error";msg.textContent="Background image did not load: "+backgrounds[0];$("stage").append(msg)};
}
function renderCategories(){
 const cats=["All","Princess","Punk Rock","Urban","Runway","Beach","Shoes","Accessories"];
 const box=$("categories");box.innerHTML="";
 cats.forEach(c=>{
  const b=document.createElement("button");b.className="category"+(c==="All"?" active":"");b.textContent=c;
  b.onclick=()=>{playFx("tap");activeCategory=c;box.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));renderItems()};
  box.append(b);
 });
}
function belongs(file,c){
 if(c==="All")return true;
 const s=file.toLowerCase();
 if(c==="Princess")return /dress|tiara|crown|pink bow|blue bow/.test(s);
 if(c==="Punk Rock")return /star glasses|red sneakers|red skirt|sweater red|pants white/.test(s);
 if(c==="Urban")return /tee shirt|sweater|pants|skirt/.test(s);
 if(c==="Runway")return /lady dress|dress|heels|glasses/.test(s);
 if(c==="Beach")return /blue skirt|yellow skirt|pink skirt|sneakers|bow/.test(s);
 if(c==="Shoes")return slot(file)==="shoes";
 if(c==="Accessories")return ["glasses","headwear","bag","accessory"].includes(slot(file));
 return category(file)===c;
}
function renderItems(){
 const box=$("items");box.innerHTML="";
 assets.filter(f=>belongs(f,activeCategory)).forEach(f=>{
  const target=slot(f),b=document.createElement("button");b.className="item-choice"+(worn.get(target)===f?" active":"");b.draggable=false;
  b.append(makeImage(f,"",""));const span=document.createElement("span");span.textContent=label(f);b.append(span);
  b.setAttribute("aria-label","Select "+label(f)+". Tap to wear or drag onto Nani.");
  b.addEventListener("click",()=>{if(!justDragged)equip(f)});
  b.addEventListener("pointerdown",e=>beginDrag(e,f,b));box.append(b);
 });
}
function renderWorn(){
 const layer=$("characterLayer");layer.innerHTML="";
 layer.append(makeImage(BASE,"character-base","Nani Bear"));
 ["bottoms","top","dress","shoes","bag","headwear","glasses","accessory"].forEach(target=>{
  const f=worn.get(target);if(f)layer.append(makeImage(f,"wearable wearable-"+target,label(f)));
 });
}
function beginDrag(e,file,button){
 if(e.button!==undefined&&e.button!==0)return;
 const ghost=document.createElement("div");ghost.className="drag-ghost";
 ghost.append(makeImage(file,"",""),document.createTextNode(label(file)));document.body.append(ghost);
 dragState={file,ghost,startX:e.clientX,startY:e.clientY,moved:false};
 button.setPointerCapture?.(e.pointerId);moveDrag(e);
 document.addEventListener("pointermove",moveDrag);document.addEventListener("pointerup",endDrag,{once:true});
}
function moveDrag(e){
 if(!dragState)return;
 const dx=e.clientX-dragState.startX,dy=e.clientY-dragState.startY;if(Math.hypot(dx,dy)>8)dragState.moved=true;
 dragState.ghost.style.left=e.clientX+"px";dragState.ghost.style.top=e.clientY+"px";
 const r=$("stage").getBoundingClientRect();$("stage").classList.toggle("drop-ready",e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom);
}
function endDrag(e){
 if(!dragState)return;
 const {file,ghost,moved}=dragState;ghost.remove();$("stage").classList.remove("drop-ready");document.removeEventListener("pointermove",moveDrag);
 const r=$("stage").getBoundingClientRect(),dropped=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
 if(moved&&dropped){justDragged=true;equip(file);setTimeout(()=>justDragged=false,350)}
 else if(moved){justDragged=true;setTimeout(()=>justDragged=false,350)}
 dragState=null;
}
function shuffle(){trackOrder=[...tracks].sort(()=>Math.random()-.5);trackIndex=0}
function loadTrack(){music.src=url(trackOrder[trackIndex]);music.play().then(()=>$("playPause").textContent="⏸").catch(()=>$("playPause").textContent="▶")}
function next(){trackIndex=(trackIndex+1)%trackOrder.length;loadTrack()}
$("startBtn").onclick=()=>{unlockFx();playFx("sparkle");$("intro").hidden=true;$("studio").hidden=false;shuffle();loadTrack();renderBackgrounds();renderCategories();renderItems();renderWorn()};
$("nextTrack").onclick=()=>{playFx("tap");next()};
$("prevTrack").onclick=()=>{playFx("tap");trackIndex=(trackIndex-1+trackOrder.length)%trackOrder.length;loadTrack()};
$("playPause").onclick=()=>{playFx("tap");if(music.paused){music.play();$("playPause").textContent="⏸"}else{music.pause();$("playPause").textContent="▶"}};
$("muteBtn").onclick=()=>{playFx("tap");music.muted=!music.muted;$("muteBtn").textContent=music.muted?"🔇":"🔊"};
music.addEventListener("ended",next);
$("resetBtn").onclick=()=>{playFx("sparkle");worn.clear();renderItems();renderWorn()};
