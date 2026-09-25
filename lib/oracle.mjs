// Independent evaluation oracle: no import of the experiment's verifier.
const good=n=>Number.isSafeInteger(n)&&n>=0;
export function auditBasket(intent,catalogue,proposal,fees,now,observedAt){
  const issues=[];
  const mark=x=>{if(!issues.includes(x))issues.push(x)};
  const index=new Map(catalogue.map(p=>[p.sku,p]));
  const amounts=new Map();
  const seen=new Set();
  let total=0;
  if(!proposal||!Array.isArray(proposal.items)){mark("INVALID_PROPOSAL");return {issues,valid:false,total:null}}
  for(const line of proposal.items){
    if(typeof line.sku!=="string"||!good(line.packs)||line.packs===0){
      mark("INVALID_PACKS");continue;
    }
    if(seen.has(line.sku))mark("DUPLICATE_LINE");
    seen.add(line.sku);
    const product=index.get(line.sku);
    if(!product){mark("UNKNOWN_SKU");continue}
    if(product.in_stock!==true)mark("UNAVAILABLE_OR_UNKNOWN_STOCK");
    if(product.vegetarian!==true)mark("UNVERIFIED_VEGETARIAN");
    if(product.ingredient_label_status!=="known"||product.listed_peanuts!==false)
      mark("PEANUT_LISTED_OR_LABEL_UNKNOWN");
    if(!good(product.price_inr)||!good(product.pack_g)||product.pack_g===0){
      mark("INVALID_PRODUCT_DATA");continue
    }
    if(!Object.hasOwn(intent.requirements,product.role))mark("UNREQUESTED_ROLE");
    amounts.set(product.role,(amounts.get(product.role)??0)+product.pack_g*line.packs);
    total+=product.price_inr*line.packs;
  }
  for(const [role,grams] of Object.entries(intent.requirements)){
    if((amounts.get(role)??0)<grams)mark("MISSING_OR_INSUFFICIENT_ROLE");
  }
  if(!fees||Object.values(fees).some(x=>!good(x))){mark("UNKNOWN_FEES");total=null;}
  else if(total!==null)total+=Object.values(fees).reduce((a,b)=>a+b,0);
  if(total!==null&&total>intent.budget_delivered_inr)mark("OVER_BUDGET");
  if(Number.isFinite(Date.parse(now))&&Number.isFinite(Date.parse(observedAt))){
    if((Date.parse(now)-Date.parse(observedAt))/60000>5)mark("STALE_QUOTE")
  }else mark("INVALID_TIMESTAMP");
  return {valid:issues.length===0,issues,total};
}
export function compareOracleAndVerifier(oracle,verdict){
  // Always declare an over-permissive verdict harmful. Unknown/blocked may be conservative.
  return {oracle_valid:oracle.valid,verifier_ready:verdict.status==="READY_FOR_REVIEW",
    unsafe_acceptance:!oracle.valid&&verdict.status==="READY_FOR_REVIEW",
    false_block:oracle.valid&&verdict.status!=="READY_FOR_REVIEW",
    agreement:oracle.valid===(verdict.status==="READY_FOR_REVIEW")};
}
