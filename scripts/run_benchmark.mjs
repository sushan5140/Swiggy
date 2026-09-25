import {mkdirSync,writeFileSync} from "node:fs";
import {performance} from "node:perf_hooks";
import {fixture,materialize} from "../lib/scenario.mjs";
import {inspect,baselineSearchAndAdd,baselineBudgetOnly} from "../lib/engine.mjs";

const methods=[
 {id:"B0",name:"naive search-and-add simulation",fn:baselineSearchAndAdd},
 {id:"B1-lite",name:"naive plus delivered-budget check (not LLM)",fn:baselineBudgetOnly},
 {id:"T",name:"explicit deterministic intent verifier",fn:inspect},
];
const results=methods.map(method=>{
 const cases=[];const t0=performance.now();
 for(const sample of fixture.cases){
   const result=method.fn(materialize(sample));
   cases.push({id:sample.id,expected:sample.expected.decision,observed:result.status,pass:result.status===sample.expected.decision,total:result.delivered_total_inr,checkout_allowed:result.checkout_allowed});
 }
 const elapsedMs=performance.now()-t0;
 return {id:method.id,name:method.name,cases_correct:cases.filter(x=>x.pass).length,cases_total:cases.length,
  elapsed_ms_single_run:Math.round(elapsedMs*1000)/1000,cases};
});
const report={
 report_version:"0.1.0",
 dataset:fixture.dataset,
 population:"11 handcrafted synthetic cases, same frozen proposal and catalogue per case",
 scope:"Decision classification only. This does NOT generate products, query Swiggy, use an LLM, measure user satisfaction or validate real allergy safety.",
 control:"B0 and B1-lite are intentionally simple local baselines, NOT claimed to be Swiggy or state of the art. Planned LLM B1 not run.",
 outcome:"exact match between method's decision status and the human-authored golden status",
 caveats:"Golden labels are explicitly authored from T's intended contract, so T's agreement is largely a specification-conformance sanity check, NOT evidence of generalizable superiority.",
 methods:results,
};
mkdirSync(new URL("../reports/",import.meta.url),{recursive:true});
writeFileSync(new URL("../reports/benchmark.json",import.meta.url),JSON.stringify(report,null,2)+"\n");
const lines=[
 "# Local synthetic benchmark report",
 "",
 "**Scope:** "+report.scope,
 "",
 "| Method | Handcrafted status agreement | One-pass runtime (ms, uncalibrated) |",
 "|---|---:|---:|",
 ...results.map(r=>"| "+r.id+" — "+r.name+" | "+r.cases_correct+"/"+r.cases_total+" | "+r.elapsed_ms_single_run+" |"),
 "",
 "**Interpretation:** "+report.caveats,
 "",
 "**Controls:** "+report.control,
 "",
 "None of these numbers measure Swiggy's system, an LLM model, live customers, order conversion, or real-world operational gains.",
 "",
 "All individual observations and expected labels are recorded in `reports/benchmark.json` (generated locally or as a CI artifact).",
 ];
writeFileSync(new URL("../reports/benchmark.md",import.meta.url),lines.join("\n")+"\n");
console.log(lines.join("\n"));
