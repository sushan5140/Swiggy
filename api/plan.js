import {runRequest,MOCK_CATALOGUE} from "../lib/grocery.mjs";
export default function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 res.setHeader("X-Content-Type-Options","nosniff");
 if(req.method!=="GET")return res.status(405).json({error:"READ_ONLY_SYNTHETIC_DEMO"});
 const q=new URL(req.url,"http://localhost").searchParams.get("q")??"";
 if(q.length>600)return res.status(400).json({error:"REQUEST_TOO_LONG"});
 const o=runRequest(q);
 const bySku=new Map(MOCK_CATALOGUE.map(p=>[p.sku,p]));
 return res.status(200).json({
   intent:o.intent??null,status:o.status,issues:o.issues??[],
   notice:o.notice??"Fictional catalogue. No real product/allergen certification.",
   basket:o.proposal?{
     items:o.proposal.items.map(i=>({sku:i.sku,packs:i.packs,name:bySku.get(i.sku)?.name,
       grams_per_pack:bySku.get(i.sku)?.pack_g,price_per_pack_inr:bySku.get(i.sku)?.price_inr,
       role:bySku.get(i.sku)?.role})),
     subtotal_inr:o.proposal.delivered_total_inr-Object.values(o.proposal.fees).reduce((a,b)=>a+b,0),
     fees_inr:o.proposal.fees,delivered_total_inr:o.proposal.delivered_total_inr
   }:null,
   verification:o.verification??null,checkout_allowed:false,read_only:true,
   model:"Deterministic local plan generator, NOT an LLM or live Swiggy agent.",fictional:true
 });
}
