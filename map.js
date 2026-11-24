"use strict";
const SIZE=11;
const START=5*SIZE+5;
const WALL_COUNT=18;
const destinations=[
  {id:"about",index:1*SIZE+1,label:"ABOUT",title:"소개"},
  {id:"github",index:1*SIZE+9,label:"GITHUB",title:"GitHub"},
  {id:"hamster",index:9*SIZE+1,label:"HAMSTER",title:"햄스터"},
  {id:"cards",index:9*SIZE+9,label:"CARDS",title:"포토카드"}
];
const destinationByIndex=new Map(destinations.map(item=>[item.index,item]));
const board=document.getElementById("board");
const cursor=document.getElementById("cursor");
const panel=document.getElementById("contentPanel");
const emptyPanel=document.getElementById("emptyPanel");
const panelContent=document.getElementById("panelContent");
const statusEl=document.getElementById("mapStatus");
const wallCountEl=document.getElementById("wallCount");
let walls=new Set();
let position=START;
let moving=false;
function randomizeWalls(){
  const reserved=new Set([START,...destinations.map(item=>item.index)]);
  const candidates=[];
  for(let i=0;i<SIZE*SIZE;i++)if(!reserved.has(i))candidates.push(i);
  for(let attempt=0;attempt<2000;attempt++){
    for(let i=candidates.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
    walls=new Set(candidates.slice(0,WALL_COUNT));
    if(destinations.every(item=>findPath(START,item.index)!==null))return;
  }
  // A connected fallback layout keeps all destinations reachable.
  const edgeCandidates=[];
  for(let c=0;c<SIZE;c++){edgeCandidates.push(c,(SIZE-1)*SIZE+c);}
  for(let r=1;r<SIZE-1;r++)edgeCandidates.push(r*SIZE,r*SIZE+SIZE-1);
  walls=new Set(edgeCandidates.filter(i=>!reserved.has(i)).slice(0,WALL_COUNT));
}
function neighbors(index){
  const r=Math.floor(index/SIZE),c=index%SIZE,result=[];
  if(r>0)result.push(index-SIZE);
  if(r<SIZE-1)result.push(index+SIZE);
  if(c>0)result.push(index-1);
  if(c<SIZE-1)result.push(index+1);
  return result;
}
function heuristic(a,b){return Math.abs(Math.floor(a/SIZE)-Math.floor(b/SIZE))+Math.abs(a%SIZE-b%SIZE);}
function findPath(start,goal){
  const open=[start],cameFrom=new Map(),gScore=new Map([[start,0]]),fScore=new Map([[start,heuristic(start,goal)]]),closed=new Set();
  while(open.length){
    let best=0;
    for(let i=1;i<open.length;i++)if(fScore.get(open[i])<fScore.get(open[best]))best=i;
    const current=open.splice(best,1)[0];
    if(current===goal){
      const path=[current];let step=current;
      while(cameFrom.has(step)){step=cameFrom.get(step);path.push(step);}
      return path.reverse();
    }
    closed.add(current);
    for(const next of neighbors(current)){
      if(walls.has(next)||closed.has(next))continue;
      const tentative=gScore.get(current)+1;
      if(tentative<(gScore.get(next)??Infinity)){
        cameFrom.set(next,current);gScore.set(next,tentative);fScore.set(next,tentative+heuristic(next,goal));
        if(!open.includes(next))open.push(next);
      }
    }
  }
  return null;
}
function renderBoard(){
  board.replaceChildren();
  const fragment=document.createDocumentFragment();
  for(let i=0;i<SIZE*SIZE;i++){
    const target=destinationByIndex.get(i);
    if(walls.has(i)){
      const wall=document.createElement("button");wall.type="button";wall.className="cell wall";wall.dataset.wall=String(i);wall.setAttribute("aria-label","벽입니다. 클릭하면 부서집니다.");wall.title="클릭해서 벽 부수기";fragment.appendChild(wall);
    }else if(target){
      const tile=document.createElement("button");tile.type="button";tile.className="cell target "+target.id;tile.dataset.target=target.id;tile.setAttribute("aria-label",target.title+" 페이지로 이동");tile.innerHTML='<span class="tile-label">'+target.label+"</span>";fragment.appendChild(tile);
    }else{
      const cell=document.createElement("div");cell.className="cell";cell.setAttribute("aria-hidden","true");fragment.appendChild(cell);
    }
  }
  board.appendChild(fragment);
  wallCountEl.textContent="벽 "+walls.size+"개";
}
function placeCursor(index){
  position=index;
  const row=Math.floor(index/SIZE),col=index%SIZE;
  cursor.style.setProperty("--x",((col+.5)/SIZE*100)+"%");
  cursor.style.setProperty("--y",((row+.5)/SIZE*100)+"%");
}
function closePanel(){
  panelContent.hidden=true;panelContent.replaceChildren();emptyPanel.hidden=false;
}
function openPanel(id){
  const item=destinations.find(entry=>entry.id===id);
  if(id==="cards"){window.location.href="photocard.html";return;}
  emptyPanel.hidden=true;panelContent.hidden=false;
  const close='<button class="panel-close" type="button" data-close>닫기</button>';
  let html='<div class="panel-top"><p class="eyebrow">DESTINATION / '+item.label+'</p>'+close+'</div><h2>'+item.title+'</h2>';
  if(id==="about"){
    html+='<p class="detail">소개 :  이곳은 자료구조 및 알고리즘 수업 덕분에 탄생한 웹페이지이빈다.</p><p class="detail">여기 내용은 아마 생각나면 나중에 채우지 않을까 싶습니다. 근데 아마 당분간 방치될 듯</p>';
  }else if(id==="github"){
    html+='<p class="detail">깃허브 입니다. 물론 공개된 뭔가는 딱히 없습니다. 뭔가를 개발중이긴 한데 와우 하느라 유기했습니다. 아마 완성되면 공개될 듯 합니다.</p><a class="link-card" href="https://github.com/wnyoung0" target="_blank" rel="noopener noreferrer">GitHub 프로필 열기 <span aria-hidden="true">↗</span></a>';
  }else if(id==="hamster"){
    html+='<figure class="photo-frame"><img id="hamsterPhoto" src="src/hamster.png" alt="hamster"></figure><p class="detail">햄스터.</p>';
  }
  panelContent.innerHTML=html;
  panelContent.querySelector("[data-close]").addEventListener("click",closePanel);
  const photo=document.getElementById("hamsterPhoto");
  if(photo){photo.addEventListener("error",()=>{photo.hidden=true;document.getElementById("photoEmpty").hidden=false;});photo.addEventListener("load",()=>{document.getElementById("photoEmpty").hidden=true;});}
}
function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function travelTo(id){
  if(moving)return;
  const target=destinations.find(item=>item.id===id);
  closePanel();
  const path=findPath(position,target.index);
  if(!path){statusEl.textContent="경로가 막혀 있네요. 벽을 부수거나 뚤릴 때 까지 맵을 재생성하세요.";return;}
  moving=true;
  statusEl.textContent="A* 경로를 따라 이동 중";
  const stepDelay=window.matchMedia("(prefers-reduced-motion: reduce)").matches?0:Math.min(75,850/Math.max(1,path.length-1));
  for(const cell of path.slice(1)){placeCursor(cell);if(stepDelay)await wait(stepDelay);}
  moving=false;statusEl.textContent="도착했습니다";
  openPanel(id);
}
board.addEventListener("click",event=>{
  const wallButton=event.target.closest("[data-wall]");
  if(wallButton&&!moving){walls.delete(Number(wallButton.dataset.wall));renderBoard();statusEl.textContent="벽을 부쉈습니다. 뭔가 변화가 생겼으니 방금은 못 했던 무언가를 할 수도 있지 않을까 싶네요.";return;}
  const targetButton=event.target.closest("[data-target]");
  if(targetButton&&!moving)travelTo(targetButton.dataset.target);
});
document.getElementById("resetMap").addEventListener("click",()=>{
  if(moving)return;
  randomizeWalls();placeCursor(START);renderBoard();closePanel();statusEl.textContent="맵 재생성됨";
});
randomizeWalls();renderBoard();placeCursor(START);
