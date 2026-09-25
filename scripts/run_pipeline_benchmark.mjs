import {mkdirSync,writeFileSync} from "node:fs";
import {LLM_SCENARIOS} from "../fixtures/llm_scenarios.mjs";
import {runRequest} from "../lib/grocery.mjs";
import {auditBasket} from "../lib/oracle.mjs";
import {inspect} from "../lib/engine.mjs";

// Transparent synthetic, deterministic controls, distinct from real LLM benchmark.
const outcomes=[];
const feesFor=(items,catalogue)=>{
 const products=new Map(catalogue.map(p=>[p.sku,p]));
 const stores=new Set(items.map(x=>products.get(x.sku)?.store).filter(Boolean));
 return {delivery:40,handling:0,tax:0,second_store_delivery:Math.max(0,stores.size-1)*300};
};
for(const scenario of LLM_SCENARIOS){
 const {intent,catalogue,prompt}=scenario;
 const naive=[];
 for(const [role,grams] of Object.entries(intent.requirements)){
  const matches=catalogue.filter(x=>x.role===role);
  matches.sort((a,b)=>(a.price_inr/a.pack_g)-(b.price_inr/b.pack_g));
  if(matches.length)naive.push({sku:matches[0].sku,packs:Math.ceil(grams/matches[0].pack_g)});
 }
 const badFees=feesFor(naive,catalogue);
 const baselineOracle=auditBasket(intent,catalogue,{items:naive},badFees,"2026-09-25T09:00:00Z","2026-09-25T09:00:00Z");
 const budgetPass=baselineOracle.total!==null&&baselineOracle.total<=intent.budget_delivered_inr;
 const best=runRequest(prompt,{catalogue,quote_time:"2026-09-25T09:00:00Z"});
 const bestOracle=best.proposal?
  auditBasket(intent,catalogue,{items:best.proposal.items},feesFor(best.proposal.items,catalogue),"2026-09-25T09:00:00Z","2026-09-25T09:00:00Z"):null;
 const verifiedReady=best.status==="READY_FOR_REVIEW";
 outcomes.push({
  id:scenario.id,
  naive_proposes:true,naive_oracle_valid:baselineOracle.valid,naive_issues:baselineOracle.issues,
  budget_only_proposes:budgetPass,budget_only_oracle_valid:budgetPass?baselineOracle.valid:null,
  verified_status:best.status,verified_proposes:verifiedReady,
  verified_oracle_valid:bestOracle?.valid??null,
  verified_issues:bestOracle?.issues??best.issues,
  verified_total_inr:best.proposal?.delivered_total_inr??null,
  checkout_allowed:false
 });
}
const sum=rows=>rows.filter(Boolean).length;
const aggregate={
 cases:outcomes.length,
 model_calls:0,
 baseline_naive_proposed:sum(outcomes.map(x=>x.naive_proposes)),
 baseline_naive_invalid:sum(outcomes.map(x=>x.naive_proposes&&!x.naive_oracle_valid)),
 budget_only_proposed:sum(outcomes.map(x=>x.budget_only_proposes)),
 budget_only_invalid:sum(outcomes.map(x=>x.budget_only_proposes&&!x.budget_only_oracle_valid)),
 verified_ready_for_review:sum(outcomes.map(x=>x.verified_proposes)),
 verified_invalid_ready_for_review:sum(outcomes.map(x=>x.verified_proposes&&!x.verified_oracle_valid)),
 verified_abstained_or_blocked:sum(outcomes.map(x=>!x.verified_proposes))
};
const report={
 title:"Phase 2+3 synthetic end-to-end pipeline comparison",
 scope:"18 invented requests and fictional SKUs; deterministic rule/optimization controls only; NOT actual LLM, Swiggy or live traffic.",
 design:"B0 cheapest grams per required role, B1-lite same basket with a delivered-price cutoff, T cheapest eligible basket with constraint gate; independent oracle tests returned proposals.",
 limitations:"Scenario author and engineer are not blind; catalogue simplistic; no customer conversion, no allergy safety, no LLM generalization; no meaningful inferential claim.",
 aggregate,rows:outcomes
};
mkdirSync(new URL("../reports/",import.meta.url),{recursive:true});
writeFileSync(new URL("../reports/pipeline_benchmark.json",import.meta.url),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({scope:report.scope,aggregate,limitations:report.limitations},null,2));
if(aggregate.verified_invalid_ready_for_review>0)process.exitCode=1;
