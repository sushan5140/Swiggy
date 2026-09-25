// Optional *real* LLM benchmark. Never runs during CI or public demo.
// Run deliberately with OPENROUTER_API_KEY and I_AUTHORIZE_LLM_COSTS=YES.
import {writeFileSync,mkdirSync} from "node:fs";
import {LLM_SCENARIOS} from "../fixtures/llm_scenarios.mjs";
import {runPairedCase} from "../lib/llm.mjs";
const selected=process.argv.includes("--all")?LLM_SCENARIOS:LLM_SCENARIOS.slice(0,3);
if(!process.argv.includes("--execute-llm")){
  console.log(JSON.stringify({status:"NOT_RUN",scenarios_available:LLM_SCENARIOS.length,
    scenarios_selected:selected.map(x=>x.id),
    why:"Explicit --execute-llm flag required. No API calls or claims of model results.",instructions:"Set OPENROUTER_API_KEY and I_AUTHORIZE_LLM_COSTS=YES to run paid model calls."},null,2));
  process.exit(0);
}
if(!process.env.OPENROUTER_API_KEY||process.env.I_AUTHORIZE_LLM_COSTS!=="YES"){
  console.error("BLOCKED: supply OPENROUTER_API_KEY and I_AUTHORIZE_LLM_COSTS=YES. No model was called.");
  process.exit(2);
}
const entries=[];
for(const test of selected){
  try{
    const result=await runPairedCase(test);
    entries.push({...result,status:"OK"});
    console.log(test.id+": evaluated A, B and B+verifier");
  }catch(error){
    entries.push({scenario:test.id,status:"ERROR",reason:String(error.message).slice(0,150)});
    console.error(test.id+": "+String(error.message).slice(0,150));
  }
}
const paired=entries.filter(x=>x.status==="OK");
const summary={
  dataset:"18 prospectively frozen fictional scenarios; only selected cases attempted",
  model:process.env.OPENROUTER_MODEL??"openai/gpt-4o-mini",
  requested_cases:selected.length,completed_cases:paired.length,failed_cases:entries.length-paired.length,
  A_invalid:paired.filter(x=>!x.simple.oracle.valid).length,
  B_invalid:paired.filter(x=>!x.strong.oracle.valid).length,
  C_unsafe_acceptances:paired.filter(x=>x.strong_plus_contract.comparison.unsafe_acceptance).length,
  C_false_blocks:paired.filter(x=>x.strong_plus_contract.comparison.false_block).length,
  interpretation:"A=weak prompted LLM, B=strictly prompted LLM, C=the SAME B response gated by deterministic verifier. No population inference from synthetic cases; outputs can depend on model/version.",
};
const report={summary,results:entries};
mkdirSync(new URL("../reports/",import.meta.url),{recursive:true});
writeFileSync(new URL("../reports/llm_benchmark.json",import.meta.url),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(summary,null,2));
if(entries.length!==paired.length)process.exitCode=1;
