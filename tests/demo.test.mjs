import test from "node:test";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {createServer} from "node:net";

test("local HTTP demo is read-only and rejects unknown scenarios",async t=>{
  const probe=createServer();await new Promise(resolve=>probe.listen(0,"127.0.0.1",resolve));
  const port=probe.address().port;
  await new Promise(resolve=>probe.close(resolve));
  const child=spawn(process.execPath,[new URL("../demo/server.mjs",import.meta.url).pathname],{
    env:{...process.env,PORT:String(port)},stdio:"ignore"});
  t.after(()=>{if(child.exitCode===null)child.kill();});
  const base="http://127.0.0.1:"+port;
  let ready=false;
  for(let i=0;i<60;i++){
    if(child.exitCode!==null)throw Error("Demo server exited unexpectedly");
    try{const r=await fetch(base+"/api/scenarios");ready=r.ok;if(ready)break;}catch{}
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  assert(ready,"Local server did not start");
  const list=await fetch(base+"/api/scenarios").then(x=>x.json());
  assert.equal(list.cases.length,11);
  const response=await fetch(base+"/api/evaluate?id=S04_fees_break_budget&method=T");
  assert.equal(response.status,200);
  const result=await response.json();
  assert.equal(result.result.status,"BLOCKED");
  assert.equal(result.result.delivered_total_inr,645);
  assert.equal(result.result.checkout_allowed,false);
  const plan=await fetch(base+"/api/plan?q="+encodeURIComponent("pasta for four under ₹600"));
  assert.equal(plan.status,200);
  const planned=await plan.json();
  assert.equal(planned.status,"READY_FOR_REVIEW");
  assert.equal(planned.checkout_allowed,false);
  assert.equal(planned.read_only,true);
  assert.equal(planned.basket.items.length,3);
  assert.equal(planned.model.includes("NOT an LLM"),true);
  const uncertain=await fetch(base+"/api/plan?q="+encodeURIComponent("I need pasta"));
  assert.equal((await uncertain.json()).status,"NEEDS_INFORMATION");
  assert.equal((await fetch(base+"/api/plan?q="+encodeURIComponent("x".repeat(601)))).status,400);
  assert.equal((await fetch(base+"/api/plan",{method:"POST",body:"please order"})).status,405);
  assert.equal((await fetch(base+"/api/examples")).status,200);
  assert.equal((await fetch(base+"/api/evaluate?id=bogus&method=T")).status,400);
  assert.equal((await fetch(base+"/api/evaluate?id=S01_valid_basket&method=bogus")).status,400);
  assert.equal((await fetch(base+"/api/evaluate",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"})).status,405);
  assert.equal((await fetch(base+"/checkout",{method:"POST"})).status,405);
  assert.equal((await fetch(base+"/api/../../etc/passwd")).status,404);
  assert.equal((await fetch(base+"/")).headers.get("Content-Security-Policy")?.includes("default-src 'none'"),true);
});
