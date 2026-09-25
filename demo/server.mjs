// Local-only demonstration: GET requests, synthetic files, NO Swiggy SDK or checkout.
import {createServer} from "node:http";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {fixture,materialize} from "../lib/scenario.mjs";
import {inspect,baselineSearchAndAdd,baselineBudgetOnly} from "../lib/engine.mjs";
import {runRequest,MOCK_CATALOGUE,VALID_REQUEST_EXAMPLES} from "../lib/grocery.mjs";
const routes=new Map([
 ["/",["index.html","text/html; charset=utf-8"]],
 ["/app.js",["app.js","text/javascript; charset=utf-8"]],
 ["/style.css",["style.css","text/css; charset=utf-8"]]
]);
const methods={B0:baselineSearchAndAdd,"B1-lite":baselineBudgetOnly,T:inspect};
const port=Number(process.env.PORT??3000);
if(!Number.isInteger(port)||port<1||port>65535)throw Error("Invalid PORT");
const server=createServer((req,res)=>{
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("Content-Security-Policy","default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'");
  if(req.method!=="GET"){res.writeHead(405,{"Content-Type":"application/json"});res.end(JSON.stringify({error:"READ_ONLY_LOCAL_DEMO"}));return;}
  try{
    const url=new URL(req.url,"http://localhost");
    if(url.pathname==="/api/plan"){
      const request=url.searchParams.get("q")??"";
      if(request.length>600){res.writeHead(400,{"Content-Type":"application/json"});res.end(JSON.stringify({error:"REQUEST_TOO_LONG"}));return;}
      const outcome=runRequest(request);
      const products=new Map(MOCK_CATALOGUE.map(p=>[p.sku,p]));
      res.writeHead(200,{"Content-Type":"application/json"});
      res.end(JSON.stringify({
        intent:outcome.intent??null,status:outcome.status,
        issues:outcome.issues??[],notice:outcome.notice??"Fictional catalogue; no real product or food safety claims.",
        basket:outcome.proposal?{items:outcome.proposal.items.map(item=>({
          sku:item.sku,packs:item.packs,name:products.get(item.sku)?.name,
          grams_per_pack:products.get(item.sku)?.pack_g,price_per_pack_inr:products.get(item.sku)?.price_inr,
          role:products.get(item.sku)?.role
        })),subtotal_inr:outcome.proposal.delivered_total_inr-Object.values(outcome.proposal.fees).reduce((a,b)=>a+b,0),
        fees_inr:outcome.proposal.fees,delivered_total_inr:outcome.proposal.delivered_total_inr}:null,
        verification:outcome.verification??null,checkout_allowed:false,read_only:true,
        model:"Deterministic local plan generator, NOT an LLM or live Swiggy agent.",
        fictional:true
      }));
      return;
    }
    if(url.pathname==="/api/examples"){
      res.writeHead(200,{"Content-Type":"application/json"});
      res.end(JSON.stringify({examples:VALID_REQUEST_EXAMPLES}));
      return;
    }
    if(url.pathname==="/api/scenarios"){
      res.writeHead(200,{"Content-Type":"application/json"});
      res.end(JSON.stringify({scenario:fixture.intent, cases:fixture.cases.map(({id,why,expected})=>({id,why,expected:expected.decision}))}));
      return;
    }
    if(url.pathname==="/api/evaluate"){
      const sample=fixture.cases.find(x=>x.id===url.searchParams.get("id"));
      const method=methods[url.searchParams.get("method")];
      if(!sample||!method){res.writeHead(400,{"Content-Type":"application/json"});res.end(JSON.stringify({error:"UNKNOWN_CASE_OR_METHOD"}));return;}
      const materialized=materialize(sample);
      const result=method(materialized);
      res.writeHead(200,{"Content-Type":"application/json"});
      res.end(JSON.stringify({method:url.searchParams.get("method"),case_id:sample.id,rationale:sample.why,expected:sample.expected,
        proposal:materialized.proposal,selected_products:materialized.proposal.items.map(item=>({...item,product:materialized.snapshot.products.find(p=>p.sku===item.sku)})),
        fees_inr:materialized.snapshot.fees_inr,result,synthetic:true,no_checkout:true}));
      return;
    }
    if(routes.has(url.pathname)){
      const [filename,mime]=routes.get(url.pathname);
      res.writeHead(200,{"Content-Type":mime});
      res.end(readFileSync(fileURLToPath(new URL("./"+filename,import.meta.url))));
      return;
    }
    res.writeHead(404,{"Content-Type":"text/plain"});res.end("Not found");
  }catch(e){res.writeHead(500,{"Content-Type":"application/json"});res.end(JSON.stringify({error:"LOCAL_DEMO_ERROR"}));}
});
server.listen(port,"127.0.0.1",()=>console.log("Read-only synthetic demo: http://127.0.0.1:"+port));
