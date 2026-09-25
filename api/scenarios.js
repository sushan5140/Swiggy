import {fixture} from "../lib/scenario.mjs";
export default function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="GET")return res.status(405).json({error:"READ_ONLY_SYNTHETIC_DEMO"});
 return res.status(200).json({scenario:fixture.intent,cases:fixture.cases.map(({id,why,expected})=>({id,why,expected:expected.decision}))});
}
