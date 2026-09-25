import test from "node:test";
import assert from "node:assert/strict";
import {extractIntent,generateBasket,runRequest,MOCK_CATALOGUE} from "../lib/grocery.mjs";

const valid=[
 ["Make vegetarian tomato pasta for four under ₹600 delivered.","pasta",4,600],
 ["Vegetarian biryani for 3, budget 450 rupees including fees.","biryani",3,450],
 ["Oats breakfast for two, delivered total below 300.","oats",2,300],
 ["I need spaghetti for 8 within 1000 rupees.","pasta",8,1000],
];
for(const [prompt,recipe,servings,budget] of valid)test("parse: "+prompt,()=>{
 const result=extractIntent(prompt);
 assert.equal(result.status,"PARSED");
 assert.equal(result.recipe_id,recipe);assert.equal(result.servings,servings);
 assert.equal(result.budget_delivered_inr,budget);
});
test("no explicit budget or servings -> ask instead of inventing",()=>{
 assert.equal(extractIntent("I want pasta for four").status,"NEEDS_INFORMATION");
 assert.equal(extractIntent("I want biryani under 500 rupees").status,"NEEDS_INFORMATION");
});
test("unsupported recipe -> ask",()=>assert.equal(extractIntent("sushi for two under ₹700").status,"NEEDS_INFORMATION"));
test("unverified allergy -> refuse use as allergy safety assurance",()=>{
 const result=extractIntent("pasta for four with peanut allergy, under ₹600");
 assert.equal(result.status,"NEEDS_INFORMATION");
 assert(result.issues.some(i=>i.includes("allergy")));
});
test("non-vegetarian request -> ask, not silently change food",()=>{
 assert.equal(extractIntent("Chicken biryani for three under ₹600").status,"NEEDS_INFORMATION");
});
test("end to end fictional pasta request is verified with no checkout",()=>{
 const result=runRequest("Vegetarian pasta for four under ₹600 delivered.");
 assert.equal(result.status,"READY_FOR_REVIEW");
 assert(result.proposal.delivered_total_inr<=600);
 assert.equal(result.checkout_allowed,false);
 assert.equal(result.verification.checkout_allowed,false);
 assert.equal(result.proposal.items.length,3);
});
test("underfunded basket is blocked, price includes fees",()=>{
 const result=runRequest("pasta for four under ₹100 delivered.");
 assert.equal(result.status,"BLOCKED");
 assert(result.proposal.delivered_total_inr>100);
 assert(result.verification.reasons.includes("DELIVERED_BUDGET_EXCEEDED"));
});
test("missing purchasable role fails closed",()=>{
 const catalogue=MOCK_CATALOGUE.filter(p=>p.role!=="pasta");
 const r=runRequest("pasta for four under ₹600",{catalogue});
 assert.equal(r.status,"NEEDS_INFORMATION");assert.equal(r.proposal,null);
});
test("unknown ingredient label is not treated as safe when alternatives disappear",()=>{
 const catalogue=MOCK_CATALOGUE.filter(p=>p.role!=="tomato_sauce"||p.ingredient_label_status==="unknown");
 const r=runRequest("pasta for four under ₹600",{catalogue});
 assert.equal(r.status,"NEEDS_INFORMATION");
});
test("listed peanuts excluded even when cheaper",()=>{
 const result=runRequest("pasta for four under ₹600");
 assert(result.proposal.items.every(item=>item.sku!=="mock_tomato_peanut"));
});
test("nonvegetarian meat never selected for veggie role",()=>{
 const result=runRequest("biryani for three under ₹600");
 assert(result.proposal.items.every(item=>item.sku!=="mock_chicken"));
});
test("store fee considered in optimizing across stores",()=>{
 const catalogue=MOCK_CATALOGUE.filter(p=>p.sku!=="mock_veg_250"&&p.sku!=="mock_veg_500");
 const r=runRequest("pasta for four under ₹600",{catalogue});
 assert.equal(r.proposal.fees.second_store_delivery,300);
 assert.equal(r.status,"BLOCKED");
});
test("out of stock products excluded before proposal",()=>{
 const catalogue=MOCK_CATALOGUE.map(p=>p.sku==="mock_pasta_500"?{...p,in_stock:false}:p);
 const r=runRequest("pasta for four under ₹600",{catalogue});
 assert(r.proposal.items.every(p=>p.sku!=="mock_pasta_500"));
});
test("all outcomes only propose and never mutate or charge",()=>{
 for(const s of ["pasta for two under ₹300","biryani for three under ₹500","oats for four under ₹400"]){
 const r=runRequest(s);
 assert.equal(r.checkout_allowed,false);
 if(r.verification)assert.equal(r.verification.checkout_allowed,false);
 }
});
