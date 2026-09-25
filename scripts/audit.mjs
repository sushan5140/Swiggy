import {readFileSync,existsSync,writeFileSync,mkdirSync} from "node:fs";
import assert from "node:assert/strict";
import {fixture,materialize} from "../lib/scenario.mjs";
import {inspect,assertNoExternalMutation} from "../lib/engine.mjs";
const tests=[];
function check(name,callback){
 try {callback();tests.push({name,status:"PASS"});}
 catch(err){tests.push({name,status:"FAIL",message:String(err.message??err)});}
}
check("11 handcrafted frozen cases are present",()=>assert.equal(fixture.cases.length,11));
check("only fictional address and SKU IDs appear in fixture",()=>{
 assert(fixture.snapshot.address_id.startsWith("mock_"));
 assert(fixture.snapshot.products.every(p=>p.sku.startsWith("mock_")));
});
check("all 11 expected status/total pairs match verifier",()=>{
 for(const t of fixture.cases){
 const got=inspect(materialize(t));assert.equal(got.status,t.expected.decision,t.id);
 assert.equal(got.delivered_total_inr,t.expected.delivered_total_inr,t.id);
 }});
check("fixture declares no prior user order confirmation",()=>assert.equal(fixture.default_proposal.order_confirmation,false));
check("all 11 cases disallow checkout even for reviewable cart",()=>{
 for(const t of fixture.cases)assert.equal(inspect(materialize(t)).checkout_allowed,false,t.id);
});
check("mutation guard blocks known Instamart mutation tool names",()=>{
 for(const op of ["checkout","confirm_order","update_cart","clear_cart","apply_coupon","create_address","delete_address"])
 assert.throws(()=>assertNoExternalMutation(op),/LOCAL_DEMO_ONLY/);
});
check("correct baseline and product README provenance statements exist",()=>{
 const readme=readFileSync(new URL("../README.md",import.meta.url),"utf8");
 assert.match(readme,/independent|Independent/i);
 assert.match(readme,/not an official Swiggy project/i);
});
check("published technical brief exists",()=>assert(existsSync(new URL("../docs/DAY_01_RESEARCH_BRIEF.md",import.meta.url))));
check("demo is intentionally localhost-bound",()=>{
 const server=readFileSync(new URL("../demo/server.mjs",import.meta.url),"utf8");
 assert.match(server,/127\.0\.0\.1/);
 assert.match(server,/405/);
});
check("no shipped live Swiggy client implementation",()=>{
 const pkg=JSON.parse(readFileSync(new URL("../package.json",import.meta.url),"utf8"));
 assert.equal(Object.keys(pkg.dependencies??{}).length,0);
 assert.equal(Object.keys(pkg.devDependencies??{}).length,0);
});
const passed=tests.filter(t=>t.status==="PASS").length;
const summary={title:"Day 7 local prototype audit",passed,total:tests.length,status:passed===tests.length?"PASS":"FAIL",checks:tests,
 unresolved:["No staging credentials or live Swiggy integration","No user research/real world acceptance testing","No LLM conversational baseline B1","No real catalogue, payment, allergy certification or real-world performance claims","Demo video needs recording on a local browser"]};
mkdirSync(new URL("../reports/",import.meta.url),{recursive:true});
writeFileSync(new URL("../reports/audit.json",import.meta.url),JSON.stringify(summary,null,2)+"\n");
console.log(JSON.stringify(summary,null,2));
if(summary.status!=="PASS")process.exitCode=1;
