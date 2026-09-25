const qs=s=>document.querySelector(s);
const safeString=x=>String(x??"—");
function node(tag,text,className){
 const item=document.createElement(tag);
 item.textContent=safeString(text);
 if(className)item.className=className;
 return item;
}
async function buildPlan(){
 const input=qs("#request").value.trim();
 const area=qs("#plan-output");
 area.replaceChildren(node("p","Evaluating fictional catalogue and constraint contract…","minor"));
 if(!input||input.length>600){area.replaceChildren(node("p","Enter a request up to 600 characters.","notice"));return}
 qs("#plan").disabled=true;
 try{
  const response=await fetch("/api/plan?q="+encodeURIComponent(input));
  if(!response.ok)throw Error("Planning failed");
  const result=await response.json();
  const status=node("h3",result.status.replaceAll("_"," "),"plan-status");
  status.dataset.status=result.status;
  area.replaceChildren(node("p","PROPOSED BASKET / SYNTHETIC","eyebrow"),status);
  if(result.intent?.recipe_name)area.append(node("p",result.intent.recipe_name+" · "+result.intent.servings+" servings · cap ₹"+result.intent.budget_delivered_inr,"description"));
  if(result.basket){
   const list=node("div","","basket");
   for(const line of result.basket.items){
    const row=node("div","","basket-row");
    row.append(node("span",line.name+" × "+line.packs),node("strong","₹"+line.price_per_pack_inr*line.packs));
    list.append(row);
   }
   area.append(list);
   const fees=node("div","","basket-row fine");
   fees.append(node("span","Delivered fees"),node("strong","₹"+Object.values(result.basket.fees_inr).reduce((a,b)=>a+b,0)));
   area.append(fees);
   const total=node("div","","basket-total");
   total.append(node("strong","Estimated delivered total"),node("strong","₹"+result.basket.delivered_total_inr));
   area.append(total);
  }
  for(const text of result.issues??[])area.append(node("p",text.replaceAll("_"," "),"notice"));
  area.append(node("p",result.notice,"minor"));
  area.append(node("p",result.model,"minor"));
  area.append(node("div","Human review only. No real order can be placed.","safety"));
 }catch{area.replaceChildren(node("p","The local planner could not complete the request. Check the server.","notice"))}
 finally{qs("#plan").disabled=false}
}
async function start(){
 const res=await fetch("/api/scenarios");if(!res.ok)throw Error("Cannot fetch scenarios");
 const data=await res.json();
 for(const entry of data.cases){
  const option=document.createElement("option");
  option.value=entry.id;option.textContent=entry.id.replace(/^S\d+_/,"").replaceAll("_"," ");
  qs("#case").append(option);
 }
 qs("#evaluate").addEventListener("click",evaluate);
 qs("#plan").addEventListener("click",buildPlan);
 qs("#request").addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter")buildPlan()});
 for(const button of document.querySelectorAll("[data-example]")){
   button.addEventListener("click",()=>{qs("#request").value=button.dataset.example;buildPlan()});
 }
 await buildPlan();
 await evaluate();
}
async function evaluate(){
 const id=qs("#case").value,method=qs("#method").value;
 const res=await fetch("/api/evaluate?id="+encodeURIComponent(id)+"&method="+encodeURIComponent(method));
 if(!res.ok){qs("#rationale").textContent="Unable to evaluate local scenario.";return}
 const data=await res.json(),r=data.result;
 const status=qs("#status");status.textContent=r.status.replaceAll("_"," ");status.dataset.status=r.status;
 qs("#total").textContent=r.delivered_total_inr===null?"Unknown":"₹"+r.delivered_total_inr;
 qs("#rationale").textContent=data.rationale;
 qs("#reasons").replaceChildren();
 for(const reason of r.reasons.length?r.reasons:["No flagged constraints in this synthetic case"]){
  qs("#reasons").append(node("span",reason.replaceAll("_"," ")));
 }
 qs("#products").replaceChildren();
 for(const entry of data.selected_products){
  qs("#products").append(node("li",safeString(entry.product?.name)+" × "+entry.packs+" pack(s)"));
 }
 qs("#explain").textContent="Researcher-authored expected status: "+data.expected.decision.replaceAll("_"," ")+". No purchase is possible.";
}
start().catch(()=>{qs("#rationale").textContent="Demo failed to start. Check server logs."});
