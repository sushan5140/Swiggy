import test from "node:test";
import assert from "node:assert/strict";
import { fixture,materialize } from "../lib/scenario.mjs";
import {inspect,baselineSearchAndAdd,baselineBudgetOnly,assertNoExternalMutation} from "../lib/engine.mjs";

for(const sample of fixture.cases) {
  test("frozen case "+sample.id+": "+sample.expected.decision, ()=>{
    const result=inspect(materialize(sample));
    assert.equal(result.status,sample.expected.decision);
    assert.equal(result.delivered_total_inr,sample.expected.delivered_total_inr);
    for(const reason of sample.expected.reasons)assert(result.reasons.includes(reason),"missing "+reason);
    assert.equal(result.checkout_allowed,false);
    assert.equal(result.ready_for_human_review,result.status==="READY_FOR_REVIEW");
  });
}
test("baseline B0 is intentionally naive, not described as Swiggy behaviour",()=>{
  const caseData=materialize(fixture.cases.find(x=>x.id==="S04_fees_break_budget"));
  assert.equal(baselineSearchAndAdd(caseData).status,"READY_FOR_REVIEW");
  assert.equal(baselineBudgetOnly(caseData).status,"BLOCKED");
});
test("explicit mutation guard refuses external cart, order, address and payment writes",()=>{
  for(const action of ["checkout","confirm_order","update_cart","clear_cart","apply_coupon","create_address","delete_address"])
    assert.throws(()=>assertNoExternalMutation(action),/LOCAL_DEMO_ONLY/);
});
test("empty basket cannot pass contract",()=>{
  const c=materialize();c.proposal.items=[];
  assert.equal(inspect(c).status,"BLOCKED");
});
test("unknown SKU cannot pass contract",()=>{
  const c=materialize();c.proposal.items[0].sku="mock_unknown";
  const res=inspect(c);
  assert.equal(res.status,"BLOCKED");assert(res.reasons.includes("UNKNOWN_SKU"));
  assert.equal(res.delivered_total_inr,null);
});
test("invalid packs and negative fees fail closed",()=>{
  const c=materialize();c.proposal.items[0].packs=-2;
  assert.equal(inspect(c).status,"BLOCKED");
  const d=materialize();d.snapshot.fees_inr.delivery=-1;
  assert.equal(inspect(d).status,"NEEDS_INFORMATION");
  assert.equal(inspect(d).delivered_total_inr,null);
});
test("missing stock and vegetarian declaration remain unknown",()=>{
  const c=materialize();c.snapshot.products[0].in_stock=null;c.snapshot.products[0].vegetarian=null;
  const r=inspect(c);
  assert.equal(r.status,"NEEDS_INFORMATION");
  assert(r.reasons.includes("STOCK_UNKNOWN"));
  assert(r.reasons.includes("INGREDIENT_LABEL_UNKNOWN"));
});
test("selected product from wrong address is rejected",()=>{
  const c=materialize();c.snapshot.products[0].address_id="mock_different_address";
  const r=inspect(c);
  assert.equal(r.status,"BLOCKED");assert(r.reasons.includes("ADDRESS_MISMATCH"));
});
test("approved explicit replacement no longer awaits swap approval",()=>{
  const c=materialize(fixture.cases.find(x=>x.id==="S06_swap_without_approval"));
  c.proposal.substitutions[0].approved=true;
  assert.equal(inspect(c).status,"READY_FOR_REVIEW");
});
test("undeclared product swap is detected even if proposer omits substitution array",()=>{
  const c=materialize(fixture.cases.find(x=>x.id==="S06_swap_without_approval"));
  c.proposal.substitutions=[];
  const result=inspect(c);
  assert.equal(result.status,"NEEDS_APPROVAL");
  assert(result.reasons.includes("SUBSTITUTION_NOT_APPROVED"));
});
test("missing fee estimate prevents ready verdict",()=>{
  const c=materialize();c.snapshot.fees_inr.delivery=null;
  assert.equal(inspect(c).status,"NEEDS_INFORMATION");
});
test("stale quote cannot be rescued by an approved swap",()=>{
  const c=materialize(fixture.cases.find(x=>x.id==="S07_stale_inventory"));
  c.proposal.substitutions=[{original_sku:"mock_veg_250g",replacement_sku:"mock_zucchini_250g",approved:true}];
  assert.equal(inspect(c).status,"REFRESH_REQUIRED");
});
test("user rejection takes precedence over all violations",()=>{
  const c=materialize(fixture.cases.find(x=>x.id==="S04_fees_break_budget"));
  c.proposal.user_decision="declined";
  assert.equal(inspect(c).status,"STOPPED");
});
test("protect originals: transformations do not mutate frozen fixtures",()=>{
  const before=JSON.stringify(fixture);
  const c=materialize();c.proposal.items[0].packs=99;c.snapshot.products[0].price_inr=0;
  assert.equal(JSON.stringify(fixture),before);
});
test("all proposals are read-only including ready for review",()=>{
  const r=inspect(materialize());
  assert.equal(r.status,"READY_FOR_REVIEW");
  assert.equal(r.checkout_allowed,false);
  assert.equal(materialize().proposal.order_confirmation,false);
});
test("256 seeded perturbations fail closed when prices/labels/stock vary",()=>{
  let state=20260925;
  const rnd=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
  for(let i=0;i<256;i++){
    const c=materialize();const selectedSku=c.proposal.items[Math.floor(rnd()*3)].sku;const target=c.snapshot.products.find(p=>p.sku===selectedSku);
    switch(Math.floor(rnd()*4)){
      case 0:target.in_stock=false;break;
      case 1:target.ingredient_label_status="unknown";break;
      case 2:target.listed_peanuts=true;break;
      case 3:target.price_inr=null;break;
    }
    const r=inspect(c);
    assert.notEqual(r.status,"READY_FOR_REVIEW");
    assert.equal(r.checkout_allowed,false);
    assert(["BLOCKED","NEEDS_INFORMATION"].includes(r.status));
  }
});
