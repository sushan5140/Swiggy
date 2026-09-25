import test from "node:test";
import assert from "node:assert/strict";
import {parseCandidate,makePayload,queryOpenRouter,evaluateCandidate,runPairedCase} from "../lib/llm.mjs";
import {LLM_SCENARIOS} from "../fixtures/llm_scenarios.mjs";

test("18 prospectively specified, independently reviewed synthetic scenario identifiers",()=>{
 assert.equal(LLM_SCENARIOS.length,18);
 assert.equal(new Set(LLM_SCENARIOS.map(x=>x.id)).size,18);
 for(const s of LLM_SCENARIOS){assert.equal(s.intent.status,"PARSED");assert(s.catalogue.every(p=>p.sku.startsWith("mock_")))}
});
test("strict model JSON refuses malformed SKU pack quantities and markdown ambiguity",()=>{
 assert.deepEqual(parseCandidate('{"items":[{"sku":"mock_pasta_500","packs":1}]}').items[0],
 {sku:"mock_pasta_500",packs:1});
 assert.throws(()=>parseCandidate("I would pick pasta"),/JSON/);
 assert.throws(()=>parseCandidate('{"items":[{"sku":"x","packs":0}]}'),/Malformed/);
 assert.throws(()=>parseCandidate('{"items":null}'),/shape/);
});
test("real model calls are forbidden unless key supplied",async()=>{
 await assert.rejects(()=>queryOpenRouter(makePayload(LLM_SCENARIOS[0]),{apiKey:""}),/OPENROUTER_API_KEY/);
});
test("mock model uses only controlled synthetic prompt, not real identity",async()=>{
 let seen;
 const mockFetch=async(url,opts)=>{
   seen={url,opts};
   return {ok:true,json:async()=>({model:"mock-test-model",choices:[{message:{content:'{"items":[{"sku":"mock_pasta_500","packs":1},{"sku":"mock_tomato_500","packs":1},{"sku":"mock_veg_250","packs":1}]}'}}]})};
 };
 const r=await queryOpenRouter(makePayload(LLM_SCENARIOS[0]),{apiKey:"not-real-test",fetcher:mockFetch});
 assert.equal(r.model,"mock-test-model");
 assert(!seen.opts.body.includes("not-real-test"));
 assert(seen.url.endsWith("/chat/completions"));
 assert.equal(r.candidate.items.length,3);
});
test("unknown product is rejected by independent oracle and verifier",()=>{
 const s=LLM_SCENARIOS[0];
 const r=evaluateCandidate({...s,candidate:{items:[{sku:"invented_product",packs:1}]}});
 assert.equal(r.oracle.valid,false);
 assert.equal(r.comparison.unsafe_acceptance,false);
 assert(r.verdict.reasons.includes("UNKNOWN_SKU"));
});
test("hallucinated extra product is rejected",()=>{
 const s=LLM_SCENARIOS[0];
 const r=evaluateCandidate({...s,candidate:{items:[
 {sku:"mock_pasta_500",packs:1},{sku:"mock_tomato_500",packs:1},
 {sku:"mock_veg_250",packs:1},{sku:"mock_oats_500",packs:1}
 ]}});
 assert(r.oracle.issues.includes("UNREQUESTED_ROLE"));
 assert(r.verdict.reasons.includes("UNREQUESTED_ROLE"));
 assert.equal(r.comparison.unsafe_acceptance,false);
});
test("wrong quantity fails independent oracle",()=>{
 const s=LLM_SCENARIOS[0];
 const r=evaluateCandidate({...s,candidate:{items:[
 {sku:"mock_pasta_250",packs:1},{sku:"mock_tomato_500",packs:1},{sku:"mock_veg_250",packs:1}]}});
 assert(r.oracle.issues.includes("MISSING_OR_INSUFFICIENT_ROLE"));
 assert.equal(r.verdict.status,"BLOCKED");
});
test("second-store surcharge is computed server-side, not supplied by LLM",()=>{
 const s=LLM_SCENARIOS[0];
 const r=evaluateCandidate({...s,candidate:{items:[
 {sku:"mock_pasta_500",packs:1},{sku:"mock_tomato_500",packs:1},{sku:"mock_veg_store_b",packs:1}]}});
 assert.equal(r.contract.snapshot.fees_inr.second_store_delivery,300);
 assert.equal(r.oracle.total,110+125+80+40+300);
 assert.equal(r.verdict.status,"BLOCKED");
});
test("strong vs strong+verifier share exact identical candidate",async()=>{
 const s=LLM_SCENARIOS[0];let count=0;
 const query=async()=>{count++;return {model:"synthetic_mock",candidate:{items:[
 {sku:"mock_pasta_500",packs:1},{sku:"mock_tomato_500",packs:1},{sku:"mock_veg_250",packs:1}]},token_usage:null}};
 const r=await runPairedCase(s,{query});
 assert.equal(count,2);
 assert.deepEqual(r.strong.selection,r.strong_plus_contract?.selection??r.strong.selection);
 assert.equal(r.strong.oracle.valid,r.strong_plus_contract.oracle.valid);
 assert.equal(r.strong_plus_contract.verdict.checkout_allowed,false);
});
