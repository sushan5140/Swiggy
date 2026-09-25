import {fixture,materialize} from "../lib/scenario.mjs";
import {inspect,baselineSearchAndAdd,baselineBudgetOnly} from "../lib/engine.mjs";
const methods={B0:baselineSearchAndAdd,"B1-lite":baselineBudgetOnly,T:inspect};
export default function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="GET")return res.status(405).json({error:"READ_ONLY_SYNTHETIC_DEMO"});
 const url=new URL(req.url,"http://localhost");
 const sample=fixture.cases.find(c=>c.id===url.searchParams.get("id"));
 const method=methods[url.searchParams.get("method")];
 if(!sample||!method)return res.status(400).json({error:"UNKNOWN_CASE_OR_METHOD"});
 const materialized=materialize(sample);
 const result=method(materialized);
 return res.status(200).json({method:url.searchParams.get("method"),case_id:sample.id,
   rationale:sample.why,expected:sample.expected,proposal:materialized.proposal,
   selected_products:materialized.proposal.items.map(i=>({...i,product:materialized.snapshot.products.find(p=>p.sku===i.sku)})),
   fees_inr:materialized.snapshot.fees_inr,result,synthetic:true,no_checkout:true});
}
