const qs=s=>document.querySelector(s);
const safeString=x=>String(x??"—");
async function start(){
 const res=await fetch("/api/scenarios");if(!res.ok)throw Error("Cannot fetch scenarios");
 const data=await res.json();
 for(const entry of data.cases){
  const option=document.createElement("option");option.value=entry.id;option.textContent=entry.id.replace(/^S\d+_/,"").replaceAll("_"," ");
  qs("#case").append(option);
 }
 qs("#evaluate").addEventListener("click",evaluate);
 await evaluate();
}
async function evaluate(){
 const id=qs("#case").value,method=qs("#method").value;
 const res=await fetch("/api/evaluate?id="+encodeURIComponent(id)+"&method="+encodeURIComponent(method));
 if(!res.ok){qs("#rationale").textContent="Unable to evaluate local scenario.";return;}
 const data=await res.json(),r=data.result;
 const status=qs("#status");status.textContent=r.status.replaceAll("_"," ");status.dataset.status=r.status;
 qs("#total").textContent=r.delivered_total_inr===null?"Unknown":"₹"+r.delivered_total_inr;
 qs("#rationale").textContent=data.rationale;
 qs("#reasons").replaceChildren();
 for(const reason of r.reasons.length?r.reasons:["No flagged constraints in this synthetic case"]){
  const tag=document.createElement("span");tag.textContent=reason.replaceAll("_"," ");qs("#reasons").append(tag);
 }
 qs("#products").replaceChildren();
 for(const entry of data.selected_products){
  const li=document.createElement("li");
  li.textContent=safeString(entry.product?.name)+" × "+entry.packs+" pack(s)";
  qs("#products").append(li);
 }
 qs("#explain").textContent="Researcher-authored expected status: "+data.expected.decision.replaceAll("_"," ")+". No purchase is possible.";
}
start().catch(err=>{qs("#rationale").textContent="Local demo failed to start. Check server logs.";});
