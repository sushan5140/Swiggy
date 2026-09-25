import test from "node:test";
import assert from "node:assert/strict";
import plan from "../api/plan.js";
import scenarios from "../api/scenarios.js";
import evaluate from "../api/evaluate.js";
function mock(url,method="GET"){
 const res={statusCode:200,headers:{},body:null,
 setHeader(k,v){this.headers[k]=v},
 status(x){this.statusCode=x;return this},
 json(x){this.body=x;return this}};
 return {req:{url,method},res};
}
test("hosted-style read-only API covers request → basket",()=>{
 const {req,res}=mock("/api/plan?q="+encodeURIComponent("Vegetarian pasta for four under ₹600"));
 plan(req,res);
 assert.equal(res.statusCode,200);
 assert.equal(res.body.status,"READY_FOR_REVIEW");
 assert.equal(res.body.checkout_allowed,false);
 assert.equal(res.body.model.includes("NOT an LLM"),true);
 assert(res.body.basket.items.length>0);
});
test("hosted-style API declines missing budget",()=>{
 const {req,res}=mock("/api/plan?q=pasta%20for%20four");plan(req,res);
 assert.equal(res.body.status,"NEEDS_INFORMATION");
});
test("hosted-style API rejects mutations",()=>{
 for(const handler of [plan,scenarios,evaluate]){
  const {req,res}=mock("/api/plan","POST");handler(req,res);
  assert.equal(res.statusCode,405);
 }
});
test("hosted-style scenario catalog has frozen eleven cases",()=>{
 const {req,res}=mock("/api/scenarios");scenarios(req,res);
 assert.equal(res.body.cases.length,11);
});
test("hosted-style scenario evaluation is safe and handles malformed input",()=>{
 const good=mock("/api/evaluate?id=S04_fees_break_budget&method=T");
 evaluate(good.req,good.res);
 assert.equal(good.res.body.result.status,"BLOCKED");
 assert.equal(good.res.body.result.checkout_allowed,false);
 const bad=mock("/api/evaluate?id=S04_fees_break_budget&method=invalid");
 evaluate(bad.req,bad.res);
 assert.equal(bad.res.statusCode,400);
});
