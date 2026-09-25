// Phase 1: locally reproducible, synthetic request -> basket pipeline.
// All SKUs, prices and ingredients below are fictional. No Swiggy credentials/API.
import { inspect, baselineSearchAndAdd } from "./engine.mjs";

export const RECIPES = Object.freeze({
  pasta: {name:"vegetarian tomato pasta",requirements:{pasta:80,tomato_sauce:100,vegetables:50},
    aliases:["pasta","spaghetti","macaroni"]},
  biryani: {name:"vegetarian biryani",requirements:{rice:90,vegetables:100,spices:10},
    aliases:["biryani","pulao"]},
  oats: {name:"oatmeal breakfast",requirements:{oats:60,milk:150,fruit:75},
    aliases:["oats","oatmeal","porridge"]}
});
export const MOCK_CATALOGUE=[
  {sku:"mock_pasta_500",name:"Wheat pasta 500g",role:"pasta",pack_g:500,price_inr:110,store:"A"},
  {sku:"mock_pasta_250",name:"Wheat pasta 250g",role:"pasta",pack_g:250,price_inr:70,store:"A"},
  {sku:"mock_tomato_500",name:"Tomato sauce 500g",role:"tomato_sauce",pack_g:500,price_inr:125,store:"A"},
  {sku:"mock_tomato_250",name:"Tomato puree 250g",role:"tomato_sauce",pack_g:250,price_inr:72,store:"A"},
  {sku:"mock_veg_500",name:"Mixed vegetables 500g",role:"vegetables",pack_g:500,price_inr:95,store:"A"},
  {sku:"mock_veg_250",name:"Mixed vegetables 250g",role:"vegetables",pack_g:250,price_inr:55,store:"A"},
  {sku:"mock_rice_500",name:"Rice 500g",role:"rice",pack_g:500,price_inr:70,store:"A"},
  {sku:"mock_rice_1kg",name:"Rice 1kg",role:"rice",pack_g:1000,price_inr:115,store:"A"},
  {sku:"mock_spices_50",name:"Spice mix 50g",role:"spices",pack_g:50,price_inr:40,store:"A"},
  {sku:"mock_oats_500",name:"Rolled oats 500g",role:"oats",pack_g:500,price_inr:100,store:"A"},
  {sku:"mock_milk_500",name:"Milk 500ml equivalent fixture",role:"milk",pack_g:500,price_inr:45,store:"A"},
  {sku:"mock_fruit_250",name:"Banana 250g",role:"fruit",pack_g:250,price_inr:35,store:"A"},
  {sku:"mock_veg_store_b",name:"Premium vegetables 500g",role:"vegetables",pack_g:500,price_inr:80,store:"B"},
  {sku:"mock_tomato_peanut",name:"Peanut tomato sauce 500g",role:"tomato_sauce",pack_g:500,price_inr:60,store:"A",listed_peanuts:true},
  {sku:"mock_tomato_unknown",name:"Tomato sauce unlabeled 500g",role:"tomato_sauce",pack_g:500,price_inr:50,store:"A",ingredient_label_status:"unknown"},
  {sku:"mock_chicken",name:"Chicken strips 500g",role:"vegetables",pack_g:500,price_inr:100,store:"A",vegetarian:false}
].map(p=>Object.freeze({
  in_stock:true,vegetarian:true,ingredient_label_status:"known",listed_peanuts:false,...p
}));
export const VALID_REQUEST_EXAMPLES=[
 "Vegetarian tomato pasta for four, no peanuts, under ₹600 delivered.",
 "Vegetarian biryani for 3, budget 450 rupees including fees.",
 "Oats breakfast for two, delivered total below 300."
];
const plain = x=>JSON.parse(JSON.stringify(x));
function parseBudget(text) {
  // Constrain to budget-specific phrases so 'pasta for 4' is not interpreted as ₹4.
  const patterns=[
    /(?:budget|under|below|at most|not more than|up to|within|max(?:imum)?|≤|<=)\s*(?:rs\.?\s*|inr\s*|₹\s*)?(\d{2,5})/i,
    /(?:₹|rs\.?\s*|inr\s*)(\d{2,5})\s*(?:budget|total|all in|delivered)?/i,
    /(\d{2,5})\s*(?:rupees|rs)\b/i
  ];
  for(const pattern of patterns){const m=text.match(pattern);if(m)return Number(m[1]);}
  return null;
}
export function extractIntent(text){
  if(typeof text!=="string"||text.trim().length<5||text.length>600)
    return {status:"NEEDS_INFORMATION",issues:["Enter a grocery request of 5–600 characters."]};
  const matched=Object.entries(RECIPES).filter(([,recipe])=>recipe.aliases.some(a=>new RegExp("\\b"+a+"\\b","i").test(text)));
  if(matched.length!==1)return {status:"NEEDS_INFORMATION",issues:["Specify exactly one supported meal: pasta, vegetarian biryani or oats."]};
  const [recipe_id,recipe]=matched[0];
  const people=text.match(/(?:for|feeds?|serves?)\s+(\d{1,2}|one|two|three|four|five|six|seven|eight)\s*(?:people|persons|guests|servings?)?/i);
  const words={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8};
  const servings=people?(words[people[1].toLowerCase()]??Number(people[1])):null;
  const budget=parseBudget(text);
  const issues=[];
  if(!Number.isInteger(servings)||servings<1||servings>8)issues.push("Specify 1–8 servings, e.g. 'for four'.");
  if(!Number.isSafeInteger(budget)||budget<50||budget>20000)issues.push("Specify a delivered budget between ₹50 and ₹20,000.");
  // We handle vegetarian and labelled peanut-ingredient avoidance. Never promise allergy safety.
  if(/\b(?:meat|chicken|egg|fish|non.?veg)\b/i.test(text))
    issues.push("This prototype supports vegetarian meal requests only.");
  if(/\b(?:allerg(?:y|ic|en)|anaphyla|cross.contact)\b/i.test(text))
    issues.push("The fictional catalogue cannot verify allergy or cross-contact safety. Do not use it for an allergy decision.");
  if(issues.length)return {status:"NEEDS_INFORMATION",issues,recipe_id};
  return {status:"PARSED",recipe_id,recipe_name:recipe.name,servings,budget_delivered_inr:budget,
    vegetarian:true,exclude_listed_peanuts:true,
    requirements:Object.fromEntries(Object.entries(recipe.requirements).map(([r,g])=>[r,g*servings])),
    assumptions:["Per-serving quantities are synthetic benchmark assumptions.","Ingredient labels are fictional, not allergy certifications."],
    source:"parsed from user text and synthetic recipe defaults"};
}
function candidateSets(intent,products){
  const byRole=Object.keys(intent.requirements).map(role=>{
    const matching=products.filter(p=>p.role===role);
    if(!matching.length)return [];
    const entries=[];
    for(const p of matching){
      if(p.in_stock!==true||p.vegetarian!==true||p.ingredient_label_status!=="known"||
        p.listed_peanuts!==false||!Number.isSafeInteger(p.price_inr)||p.price_inr<0)continue;
      const packs=Math.ceil(intent.requirements[role]/p.pack_g);
      if(!Number.isSafeInteger(packs)||packs<1||packs>20)continue;
      entries.push({sku:p.sku,packs});
    }
    return entries;
  });
  return byRole;
}
export function generateBasket(parsed,{catalogue=MOCK_CATALOGUE,fee_base=40,fee_second_store=300,quote_time=new Date().toISOString()}={}){
  if(parsed.status!=="PARSED")return {status:"NEEDS_INFORMATION",issues:parsed.issues??["Intent must be parsed first."],intent:parsed};
  if(!Array.isArray(catalogue)||catalogue.length>1000)return {status:"NEEDS_INFORMATION",issues:["Invalid catalogue."],intent:parsed};
  const products=plain(catalogue);
  const sets=candidateSets(parsed,products);
  if(sets.some(x=>x.length===0))return {status:"NEEDS_INFORMATION",
    issues:["Required products are unavailable or their ingredient, diet, stock or price information cannot be verified."],intent:parsed,proposal:null};
  let best=null;
  function walk(index,items){
    if(index===sets.length){
      const stores=new Set(items.map(i=>products.find(p=>p.sku===i.sku).store));
      const fees={delivery:fee_base,handling:0,tax:0,second_store_delivery:Math.max(0,stores.size-1)*fee_second_store};
      const subtotal=items.reduce((sum,i)=>sum+products.find(p=>p.sku===i.sku).price_inr*i.packs,0);
      const total=subtotal+Object.values(fees).reduce((a,b)=>a+b,0);
      const candidate={items:plain(items),fees,delivered_total_inr:total,stores:[...stores]};
      if(!best||total<best.delivered_total_inr||
        (total===best.delivered_total_inr&&items.map(x=>x.sku).join(",")<best.items.map(x=>x.sku).join(",")))best=candidate;
      return;
    }
    for(const entry of sets[index])walk(index+1,[...items,entry]);
  }
  walk(0,[]);
  const contract={
    case_id:"dynamic_synthetic",
    intent:{required_roles_min_grams:parsed.requirements,budget_delivered_inr:parsed.budget_delivered_inr},
    snapshot:{address_id:"mock_address_01",observed_at:quote_time,evaluation_at:quote_time,max_age_minutes:5,
      currency:"INR",products,fees_inr:best.fees,valid_discounts_inr:0},
    proposal:{items:best.items,substitutions:[],user_decision:"undecided",order_confirmation:false},
    reference_plan:[]
  };
  const verified=inspect(contract);
  return {status:verified.status,intent:parsed,proposal:best,verification:verified,
    issues:verified.reasons,
    notice:"Fictional catalogue; price and labels cannot establish real product or allergen safety.",
    checkout_allowed:false,contract};
}
export function runRequest(text,options){
  const extracted=extractIntent(text);
  if(extracted.status!=="PARSED")return {input:text,...extracted,checkout_allowed:false};
  const generated=generateBasket(extracted,options);
  return {input:text,...generated,
    baseline:generated.contract?baselineSearchAndAdd(generated.contract):null};
}
