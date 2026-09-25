// Optional actual LLM candidate generation. Opt-in CLI only; key never goes to the browser.
// Synthetic prompts/catalogues; NO Swiggy MCP access or real personal information.
import {inspect} from "./engine.mjs";
import {auditBasket,compareOracleAndVerifier} from "./oracle.mjs";
import {extractIntent,MOCK_CATALOGUE} from "./grocery.mjs";

const SYSTEM_SIMPLE="You select fictional grocery products. Reply only with JSON {\"items\":[{\"sku\":\"...\",\"packs\":1}]}. No markdown.";
const SYSTEM_STRONG=[
 "You propose, NOT PURCHASE, a grocery basket using ONLY SKU values in the attached fictional catalogue.",
 "You must respect every requirement including quantities/servings, vegetarian declaration, listed peanut-ingredient exclusion, in-stock status, delivered total including fees, and product label uncertainty.",
 "Do not invent products, prices, ingredients or product assurances. Do not add unrequested roles.",
 "If no proposal meets all restrictions, return {\"items\":[],\"uncertainty\":\"explain briefly\"}.",
 "Reply only with strict JSON {\"items\":[{\"sku\":\"...\",\"packs\":1}],\"uncertainty\":\"\"}.",
 "No checkout, payment or Swiggy system access."
].join("\n");
export function makePayload({prompt,intent,catalogue,fees},strength="simple"){
  return {
    model:process.env.OPENROUTER_MODEL??"openai/gpt-4o-mini",
    temperature:0,
    max_tokens:500,
    messages:[
      {role:"system",content:strength==="strong"?SYSTEM_STRONG:SYSTEM_SIMPLE},
      {role:"user",content:JSON.stringify({
        scenario:"fictional shopping only",
        request:prompt,
        intent:{recipe:intent.recipe_name,servings:intent.servings,
          requirements_min_grams:intent.requirements,budget_delivered_inr:intent.budget_delivered_inr,
          vegetarian:true,exclude_listed_peanuts:true},
        products:catalogue.map(p=>({sku:p.sku,role:p.role,pack_g:p.pack_g,price_inr:p.price_inr,
          store:p.store,in_stock:p.in_stock,vegetarian:p.vegetarian,
          ingredient_label_status:p.ingredient_label_status,listed_peanuts:p.listed_peanuts})),
        fees,additional_store_fee_inr:300,approval:"Only a proposed basket. Never place an order."
      })}
    ],
  };
}
export function parseCandidate(raw){
  const s=String(raw??"").trim().replace(/^\`\`\`(?:json)?\s*/i,"").replace(/\s*\`\`\`$/,"");
  let parsed;
  try{parsed=JSON.parse(s)}catch{throw Error("LLM response was not strict JSON")}
  if(!parsed||!Array.isArray(parsed.items)||parsed.items.length>12)throw Error("Invalid proposed item shape");
  for(const item of parsed.items){
    if(typeof item.sku!=="string"||item.sku.length>120||
      !Number.isSafeInteger(item.packs)||item.packs<1||item.packs>20)
      throw Error("Malformed SKU/pack count");
  }
  return {items:parsed.items,uncertainty:typeof parsed.uncertainty==="string"?parsed.uncertainty.slice(0,300):""};
}
export async function queryOpenRouter(payload,{apiKey=process.env.OPENROUTER_API_KEY,fetcher=fetch}={}){
  if(!apiKey)throw Error("OPENROUTER_API_KEY required for genuine LLM benchmark");
  let response;
  try{
    response=await fetcher("https://openrouter.ai/api/v1/chat/completions",{
      method:"POST",
      signal:AbortSignal.timeout(35000),
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey,
        "HTTP-Referer":"https://github.com/sushan5140/Swiggy","X-Title":"Intent-to-Transaction synthetic research"},
      body:JSON.stringify(payload)
    });
  }catch{throw Error("LLM provider request failed or timed out")}
  if(!response.ok)throw Error("LLM provider returned HTTP "+response.status);
  const data=await response.json();
  return {candidate:parseCandidate(data.choices?.[0]?.message?.content),
    model:data.model??payload.model,
    token_usage:data.usage??null};
}
export function evaluateCandidate({intent,catalogue,candidate,fees,quote_time="2026-09-25T10:00:00+05:30"}){
  const bySku=new Map(catalogue.map(p=>[p.sku,p]));
  const selectedStores=new Set(candidate.items.map(i=>bySku.get(i.sku)?.store).filter(Boolean));
  const effectiveFees={...fees,second_store_delivery:Math.max(0,selectedStores.size-1)*300};
  const contract={
    case_id:"llm_synthetic",
    intent:{required_roles_min_grams:intent.requirements,budget_delivered_inr:intent.budget_delivered_inr},
    snapshot:{address_id:"mock_address_01",observed_at:quote_time,evaluation_at:quote_time,max_age_minutes:5,
      currency:"INR",products:catalogue,fees_inr:effectiveFees,valid_discounts_inr:0},
    reference_plan:[],
    proposal:{items:candidate.items,substitutions:[],user_decision:"undecided",order_confirmation:false}
  };
  const verdict=inspect(contract);
  const oracle=auditBasket(intent,catalogue,contract.proposal,effectiveFees,quote_time,quote_time);
  return {contract,verdict,oracle,comparison:compareOracleAndVerifier(oracle,verdict)};
}
export function llmCase(prompt,{catalogue=MOCK_CATALOGUE,fees={delivery:40,handling:0,tax:0,second_store_delivery:0}}={}){
  const intent=extractIntent(prompt);
  if(intent.status!=="PARSED")throw Error("LLM benchmark case requires a fully specified parseable request");
  return {prompt,intent,catalogue,fees};
}
export async function runPairedCase(scenario,{query=queryOpenRouter}={}){
  const a=await query(makePayload(scenario,"simple"));
  const b=await query(makePayload(scenario,"strong"));
  const simple=evaluateCandidate({...scenario,candidate:a.candidate});
  const strong=evaluateCandidate({...scenario,candidate:b.candidate});
  return {
    scenario:scenario.id??"synthetic",
    model:a.model,
    simple:{oracle:simple.oracle,selection:a.candidate.items,token_usage:a.token_usage},
    strong:{oracle:strong.oracle,selection:b.candidate.items,token_usage:b.token_usage},
    strong_plus_contract:{oracle:strong.oracle,verdict:strong.verdict,comparison:strong.comparison,
      token_usage:b.token_usage},
    note:"B and C share identical strong LLM candidates, allowing paired comparison of an additional verifier."
  };
}
