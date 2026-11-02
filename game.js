const ROOT="https://raw.githubusercontent.com/ChefToney/nani-bear-dress-up-studio/main/";
const url=n=>ROOT+encodeURIComponent(n);
const backgrounds=["Background Beach Day.PNG","Background Fashion Show.PNG","Background Lovely Park.PNG","Background My Room.PNG","Background Palace View.PNG","BackgroundThe Mall.PNG","Background beach.jpg","Background stage.jpg"];
const assets=["Bell bottoms.PNG","Blue sneakers.PNG","Cute dress.PNG","Flow skirt.PNG","Handbag.PNG","Librarian glasses.PNG","Lovely dress.PNG","Pink bow.PNG","Pink heels.PNG","Pink sneakers.PNG","Princess tiara.PNG","Purple bow.PNG","Queen crown.PNG","Short heels.PNG","Sneakers.PNG","Star glasses.PNG","Sweat shirt.PNG","Teal bow.PNG"];
const tracks=["KA_HU_TI PT2.mp3","KA_HU_TI.mp3","Move_Pose.mp3","Move_Pose_Stop.mp3","Nani_Bear_Runway(1).mp3","Pah! PT2.mp3","Pah!.mp3"];
const $=id=>document.getElementById(id), music=$("music");
let trackOrder=[],trackIndex=0,activeCategory="All",worn=new Map(),dragState=null,justDragged=false;

// Each slot is independent. Dresses are full outfits and replace both separates.
const itemInfo={
 "Bell bottoms.PNG":{slot:"bottoms",category:"Bottoms"},
 "Flow skirt.PNG":{slot:"bottoms",category:"Bottoms"},
 "Sweat shirt.PNG":{slot:"top",category:"Tops"},
 "Cute dress.PNG":{slot:"dress",category:"Dresses"},
 "Lovely dress.PNG":{slot:"dress",category:"Dresses"},
 "Blue sneakers.PNG":{slot:"shoes",category:"Shoes"},
 "Pink heels.PNG":{slot:"shoes",category:"Shoes"},
 "Pink sneakers.PNG":{slot:"shoes",category:"Shoes"},
 "Short heels.PNG":{slot:"shoes",category:"Shoes"},
 "Sneakers.PNG":{slot:"shoes",category:"Shoes"},
 "Librarian glasses.PNG":{slot:"glasses",category:"Glasses"},
 "Star glasses.PNG":{slot:"glasses",category:"Glasses"},
 "Handbag.PNG":{slot:"bag",category:"Bags"},
 "Pink bow.PNG":{slot:"headwear",category:"Headwear"},
 "Purple bow.PNG":{slot:"headwear",category:"Headwear"},
 "Teal bow.PNG":{slot:"headwear",category:"Headwear"},
 "Princess tiara.PNG":{slot:"headwear",category:"Headwear"},
 "Queen crown.PNG":{slot:"headwear",category:"Headwear"}
};
const info=file=>itemInfo[file]||{slot:"accessory",category:"Accessories"};
function label(s){return s.replace(/\\.[^.]+$/,"").replace(/^Background ?/i,"").replace(/_/g," ").replace(/\\(1\\)/g,"").trim()}
function equip(file){
 const slot=info(file).slot;
 if(worn.get(slot)===file){worn.delete(slot)}
 else{
  if(slot==="dress"){worn.delete("top");worn.delete("bottoms")}
  if(slot==="top"||slot==="bottoms")worn.delete("dress");
  worn.set(slot,file);
 }
 renderItems();renderWorn();
}
function renderBackgrounds(){const box=$("backgrounds");backgrounds.forEach((f,i)=>{const b=document.createElement("button");b.className="background-choice"+(!i?" active":"");b.innerHTML='<img alt=""><span>'+label(f)+'</span>';b.querySelector("img").src=url(f);b.onclick=()=>{box.querySelectorAll("button").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("scene").src=url(f)};box.append(b)});$("scene").src=url(backgrounds[0])}
function renderCategories(){
 const cats=["All",...new Set(assets.map(f=>info(f).category))],box=$("categories");box.innerHTML="";
 cats.forEach(c=>{const b=document.createElement("button");b.className="category"+(c==="All"?" active":"");b.textContent=c;b.onclick=()=>{activeCategory=c;box.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));renderItems()};box.append(b)});
}
function renderItems(){
 const box=$("items");box.innerHTML="";
 assets.filter(f=>activeCategory==="All"||info(f).category===activeCategory).forEach(f=>{
  const slot=info(f).slot,b=document.createElement("button");
  b.className="item-choice"+(worn.get(slot)===f?" active":"");b.draggable=false;
  b.innerHTML='<img alt=""><span>'+label(f)+'</span>';b.querySelector("img").src=url(f);
  b.setAttribute("aria-label","Select "+label(f)+". Tap to wear or drag onto Nani.");
  b.addEventListener("click",()=>{if(justDragged)return;equip(f)});
  b.addEventListener("pointerdown",e=>beginDrag(e,f,b));box.append(b);
 });
}
function renderWorn(){
 const layer=$("characterLayer");layer.innerHTML="";
 const base=document.createElement("img");base.className="character-base";base.src=url("Nani Bear Base model.PNG");base.alt="Nani Bear";layer.append(base);
 const drawOrder=["bottoms","top","dress","shoes","bag","headwear","glasses","accessory"];
 drawOrder.forEach(slot=>{const f=worn.get(slot);if(!f)return;const im=document.createElement("img");im.className="wearable wearable-"+slot;im.src=url(f);im.alt=label(f);im.draggable=false;layer.append(im)});
}
function beginDrag(e,file,button){
 if(e.button!==undefined&&e.button!==0)return;
 const ghost=document.createElement("div");ghost.className="drag-ghost";
 const img=document.createElement("img");img.src=url(file);ghost.append(img,document.createTextNode(label(file)));document.body.append(ghost);
 dragState={file,ghost,startX:e.clientX,startY:e.clientY,moved:false};
 button.setPointerCapture?.(e.pointerId);moveDrag(e);
 document.addEventListener("pointermove",moveDrag);document.addEventListener("pointerup",endDrag,{once:true});
}
function moveDrag(e){
 if(!dragState)return;const dx=e.clientX-dragState.startX,dy=e.clientY-dragState.startY;
 if(Math.hypot(dx,dy)>8)dragState.moved=true;
 dragState.ghost.style.left=e.clientX+"px";dragState.ghost.style.top=e.clientY+"px";
 const r=$("stage").getBoundingClientRect();$("stage").classList.toggle("drop-ready",e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom);
}
function endDrag(e){
 if(!dragState)return;const {file,ghost,moved}=dragState;ghost.remove();$("stage").classList.remove("drop-ready");document.removeEventListener("pointermove",moveDrag);
 const r=$("stage").getBoundingClientRect(),dropped=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
 if(moved&&dropped){justDragged=true;equip(file);setTimeout(()=>justDragged=false,350)}
 else if(moved){justDragged=true;setTimeout(()=>justDragged=false,350)}
 dragState=null;
}
function shuffle(){trackOrder=[...tracks].sort(()=>Math.random()-.5);trackIndex=0}
function loadTrack(){music.src=url(trackOrder[trackIndex]);music.play().then(()=>$("playPause").textContent="⏸").catch(()=>$("playPause").textContent="▶")}
function next(){trackIndex=(trackIndex+1)%trackOrder.length;loadTrack()}
$("startBtn").onclick=()=>{$("intro").hidden=true;$("studio").hidden=false;shuffle();loadTrack();renderBackgrounds();renderCategories();renderItems();renderWorn()};
$("nextTrack").onclick=next;$("prevTrack").onclick=()=>{trackIndex=(trackIndex-1+trackOrder.length)%trackOrder.length;loadTrack()};
$("playPause").onclick=()=>{if(music.paused){music.play();$("playPause").textContent="⏸"}else{music.pause();$("playPause").textContent="▶"}};
$("muteBtn").onclick=()=>{music.muted=!music.muted;$("muteBtn").textContent=music.muted?"🔇":"🔊"};
music.addEventListener("ended",next);
$("resetBtn").onclick=()=>{worn.clear();renderItems();renderWorn()};
