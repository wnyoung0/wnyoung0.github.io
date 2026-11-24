"use strict";
const groupsEl=document.getElementById("groups");
let nextId=1;
function addGroup(n=10,k=1,duplicates=true){
  const id=nextId++;
  const card=document.createElement("article");
  card.className="group";card.dataset.id=String(id);
  card.innerHTML='<div class="group-title"><span class="group-name">그룹 '+id+'</span><button class="btn remove" type="button" aria-label="그룹 삭제">삭제</button></div><div class="fields"><div><label>카드 종류 n</label><input class="n-input" type="number" min="1" max="30" step="1" value="'+n+'"></div><div><label>한 번에 받는 카드 k</label><input class="k-input" type="number" min="1" max="30" step="1" value="'+k+'"></div></div><label class="toggle"><input class="duplicate-input" type="checkbox" '+(duplicates?"checked":"")+'> 한 번의 구성 안에서 중복 허용</label>';
  card.querySelector(".remove").addEventListener("click",()=>{card.remove();renumber();});
  card.querySelectorAll("input").forEach(input=>input.addEventListener("input",()=>{document.getElementById("status").textContent="";}));
  groupsEl.appendChild(card);renumber();
}
function renumber(){[...groupsEl.children].forEach((el,i)=>el.querySelector(".group-name").textContent="그룹 "+(i+1));}
function powRecursive(base,exponent){
  if(exponent===0)return 1;
  if(exponent===1)return base;
  const half=powRecursive(base,Math.floor(exponent/2));
  const squared=half*half;
  return exponent%2===0?squared:squared*base;
}
function combination(n,r){
  if(r<0||r>n)return 0;
  r=Math.min(r,n-r);let value=1;
  for(let i=1;i<=r;i++)value=value*(n-r+i)/i;
  return value;
}
function buildModel(n,k,duplicates){
  if(!duplicates&&k>n)throw new Error("중복을 허용하지 않는 그룹은 k가 n보다 클 수 없습니다.");
  const terms=[];
  for(let j=1;j<=n;j++){
    let q;
    if(duplicates)q=powRecursive((n-j)/n,k);
    else q=combination(n-j,k)/combination(n,k);
    terms.push({coefficient:(j%2===1?1:-1)*combination(n,j),q});
  }
  return {n,terms};
}
function tailProbability(model,m){
  if(m===0)return 1;
  let value=0;
  for(const term of model.terms)value+=term.coefficient*powRecursive(term.q,m);
  return Math.max(0,Math.min(1,value));
}
function completeProbability(models,m){
  let p=1;
  for(const model of models)p*=1-tailProbability(model,m);
  return Math.max(0,Math.min(1,p));
}
function meanCompletion(models){
  let total=0,limit=200000;
  for(let m=0;m<limit;m++){
    const incomplete=1-completeProbability(models,m);
    total+=incomplete;
    if(m>0&&incomplete<1e-12)return {value:total,converged:true};
  }
  return {value:total,converged:false};
}
function readModels(){
  const cards=[...groupsEl.children];
  if(!cards.length)throw new Error("랜덤 그룹을 하나 이상 추가하세요.");
  return cards.map((card,index)=>{
    const n=Number(card.querySelector(".n-input").value);
    const k=Number(card.querySelector(".k-input").value);
    const duplicates=card.querySelector(".duplicate-input").checked;
    if(!Number.isInteger(n)||n<1||n>30||!Number.isInteger(k)||k<1||k>30)throw new Error("그룹 "+(index+1)+"의 n과 k는 1~30 사이의 정수여야 합니다.");
    if(!duplicates&&k>n)throw new Error("그룹 "+(index+1)+": 중복을 허용하지 않으면 k ≤ n이어야 합니다.");
    return buildModel(n,k,duplicates);
  });
}
function formatNumber(value,digits=2){return new Intl.NumberFormat("ko-KR",{maximumFractionDigits:digits}).format(value);}
function calculate(){
  const status=document.getElementById("status");
  try{
    const x=Number(document.getElementById("purchaseCount").value);
    if(!Number.isInteger(x)||x<0||x>1000000)throw new Error("구매 개수 X는 0~1,000,000 사이의 정수여야 합니다.");
    const models=readModels();
    const p=completeProbability(models,x);
    const average=meanCompletion(models);
    document.getElementById("probability").textContent=(p*100).toLocaleString("ko-KR",{maximumFractionDigits:6})+"%";
    document.getElementById("probSub").textContent=x+"회 구매했을 때";
    document.getElementById("mean").textContent=formatNumber(average.value,2);
    document.getElementById("groupCount").textContent=models.length;
    status.textContent=average.converged?"":"평균 계산이 설정된 반복 한도에 도달했습니다. 표시값은 근삿값입니다.";
  }catch(error){status.textContent=error.message;}
}
document.getElementById("addGroup").addEventListener("click",()=>{if(groupsEl.children.length>=8){document.getElementById("status").textContent="그룹은 최대 8개까지 설정할 수 있습니다.";return;}addGroup();});
document.getElementById("calculate").addEventListener("click",calculate);
document.getElementById("purchaseCount").addEventListener("keydown",event=>{if(event.key==="Enter")calculate();});
addGroup(10,1,true);
calculate();
