// Resolve assets from the folder containing this script, not the browser page URL.
// This remains correct if GitHub Pages serves the game from a nested project path.
const ASSET_BASE = new URL(".", document.currentScript.src);
const url = n => new URL(encodeURIComponent(n), ASSET_BASE).href;
const BASE="Nani Base model.PNG";
// Expressive, lightweight magic burst layered over the character stage.
function magicPoof(x,y,flavor="pink"){
 const stage=$("stage");if(!stage)return;
 const r=stage.getBoundingClientRect();
 const burst=document.createElement("div");
 burst.className="magic-poof "+(flavor==="gold"?"magic-gold":"");
 burst.style.left=(x==null?50:(x-r.left)/r.width*100)+"%";
 burst.style.top=(y==null?46:(y-r.top)/r.height*100)+"%";
 const glyphs=["✦","✧","✺","✧","✦","•","✧"];
 glyphs.forEach((glyph,i)=>{
  const bit=document.createElement("span");
  bit.className="magic-bit bit-"+i;
  bit.textContent=glyph;
  burst.append(bit);
 });
 const cloud=document.createElement("span");cloud.className="magic-cloud";burst.append(cloud);
 stage.append(burst);
 burst.addEventListener("animationend",()=>burst.remove(),{once:true});
 setTimeout(()=>burst.remove(),950);
}


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
let trackOrder=[],trackIndex=0,activeCategory="All",worn=new Map(),wornColors=new Map(),selectedTarget=null,dragState=null,justDragged=false;
let fxContext=null,fxEnabled=true;
function getFxContext(){
 const AudioCtx=window.AudioContext||window.webkitAudioContext;
 if(!AudioCtx)return null;
 if(!fxContext)fxContext=new AudioCtx();
 return fxContext;
}
function unlockFx(){
 const ctx=getFxContext();if(!ctx)return;
 if(ctx.state!=="running"){
  const resumed=ctx.resume();
  if(resumed&&typeof resumed.then==="function")resumed.then(()=>playFx("sparkle")).catch(()=>{});
 }else playFx("sparkle");
}
function scheduleFx(kind,ctx){
 if(!fxEnabled||!ctx||ctx.state!=="running")return;
 const now=ctx.currentTime;
 const patterns={
  tap:[[520,0,.065,"sine",.075]],
  pop:[[420,0,.09,"triangle",.09],[690,.05,.11,"sine",.065]],
  sparkle:[[880,0,.12,"sine",.075],[1175,.08,.14,"sine",.06],[1568,.16,.18,"sine",.05]],
  bling:[[1046,0,.11,"sine",.075],[1568,.09,.16,"sine",.06]]
 };
 (patterns[kind]||patterns.tap).forEach(([hz,delay,duration,wave,volume])=>{
  try{
   const osc=ctx.createOscillator(),gain=ctx.createGain();
   osc.type=wave;osc.frequency.setValueAtTime(hz,now+delay);
   gain.gain.setValueAtTime(.0001,now+delay);
   gain.gain.exponentialRampToValueAtTime(volume,now+delay+.012);
   gain.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);
   osc.connect(gain);gain.connect(ctx.destination);
   osc.start(now+delay);osc.stop(now+delay+duration+.02);
  }catch(e){console.warn("Sound effect could not play:",e)}
 });
}
function playFx(kind="tap"){
 if(!fxEnabled)return;
 let ctx;
 try{ctx=getFxContext()}catch(e){return}
 if(!ctx)return;
 if(ctx.state==="running"){scheduleFx(kind,ctx);return}
 // iOS Safari may suspend Web Audio between touches. Resume on the
 // interaction itself, then schedule the requested effect.
 try{
  const resumed=ctx.resume();
  if(resumed&&typeof resumed.then==="function")resumed.then(()=>scheduleFx(kind,ctx)).catch(()=>{});
 }catch(e){console.warn("Sound effects unavailable:",e)}
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
 if(worn.get(target)===file){worn.delete(target);wornColors.delete(target);if(selectedTarget===target)selectedTarget=null}
 else{
  if(worn.has(target))wornColors.delete(target);
  if(target==="dress"){worn.delete("top");worn.delete("bottoms")}
  if(target==="top"||target==="bottoms")worn.delete("dress");
  worn.set(target,file);selectedTarget=target;
 }
 // The magic happens exactly where the outfit changes: around Nani.
 const stage=$("stage"),r=stage.getBoundingClientRect();
 const fxY=Math.max(28,Math.min(62,44+(Math.random()*10-5)));
 magicPoof(r.left+r.width*(.5+(Math.random()-.5)*.12),r.top+r.height*fxY/100,
   ["headwear","glasses","accessory","bag"].includes(target)?"gold":"pink");
 playFx(target==="headwear"||target==="accessory"?"bling":"pop");
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
function hexHue(hex){
 const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
 const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=0;
 if(d){if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60}
 return (h+360)%360;
}
function tintFilter(color){return "grayscale(1) sepia(1) saturate(5) hue-rotate("+Math.round(hexHue(color)-35)+"deg)"}
function selectWorn(target){
 selectedTarget=target;const file=worn.get(target),color=wornColors.get(target);
 $("selectedLabel").textContent=file?label(file):"Tap something Nani is wearing";
 $("selectedColor").disabled=!file;$("clearColor").disabled=!file;
 $("selectedColor").value=color||"#ff70c8";
 $("characterLayer").querySelectorAll(".wearable").forEach(img=>img.classList.toggle("selected-wearable",img.dataset.target===target));
}
function setWornColor(color){
 if(!selectedTarget||!worn.has(selectedTarget))return;
 wornColors.set(selectedTarget,color);
 const img=$("characterLayer").querySelector('[data-target="'+selectedTarget+'"]');
 if(img)img.style.filter=tintFilter(color);
}
function renderColorSwatches(){
 const colors=["#ff70c8","#ff3f63","#ff9f43","#ffd84d","#8bd65a","#32c7ad","#45a5ff","#7864e8","#b66be8","#9b6848","#24212b","#ffffff"];
 const box=$("colorSwatches");box.innerHTML="";
 colors.forEach(color=>{const b=document.createElement("button");b.type="button";b.className="color-swatch";b.style.background=color;b.setAttribute("aria-label","Color "+color);b.onclick=()=>{if(!selectedTarget||!worn.has(selectedTarget))return;$("selectedColor").value=color;setWornColor(color)};box.append(b)});
}
function renderWorn(){
 const layer=$("characterLayer");layer.innerHTML="";
 layer.append(makeImage(BASE,"character-base","Nani Bear"));
 ["bottoms","top","dress","shoes","bag","headwear","glasses","accessory"].forEach(target=>{
  const f=worn.get(target);if(f){
   const img=makeImage(f,"wearable wearable-"+target,label(f));img.dataset.target=target;
   img.addEventListener("click",e=>{e.stopPropagation();selectWorn(target)});
   const color=wornColors.get(target);if(color)img.style.filter=tintFilter(color);
   layer.append(img);
  }
 });
 if(selectedTarget&&!worn.has(selectedTarget))selectedTarget=null;
 selectWorn(selectedTarget);
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
$("startBtn").onclick=()=>{$("intro").hidden=true;$("studio").hidden=false;try{unlockFx()}catch(e){console.warn("Sound effects unavailable:",e)}shuffle();try{loadTrack()}catch(e){console.warn("Music unavailable:",e)}renderBackgrounds();renderCategories();renderItems();renderColorSwatches();renderWorn()};
$("nextTrack").onclick=()=>{playFx("tap");next()};
$("prevTrack").onclick=()=>{playFx("tap");trackIndex=(trackIndex-1+trackOrder.length)%trackOrder.length;loadTrack()};
$("playPause").onclick=()=>{playFx("tap");if(music.paused){music.play();$("playPause").textContent="⏸"}else{music.pause();$("playPause").textContent="▶"}};
$("muteBtn").onclick=()=>{playFx("tap");music.muted=!music.muted;$("muteBtn").textContent=music.muted?"🔇":"🔊"};
music.addEventListener("ended",next);
$("selectedColor").addEventListener("input",e=>setWornColor(e.target.value));
$("clearColor").onclick=()=>{if(!selectedTarget)return;wornColors.delete(selectedTarget);const img=$("characterLayer").querySelector('[data-target="'+selectedTarget+'"]');if(img)img.style.filter="";$("selectedColor").value="#ff70c8"};
$("resetBtn").onclick=()=>{playFx("sparkle");worn.clear();wornColors.clear();selectedTarget=null;renderItems();renderWorn()};
