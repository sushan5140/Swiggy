import {MOCK_CATALOGUE} from "../lib/grocery.mjs";
import {llmCase} from "../lib/llm.mjs";
const base=()=>MOCK_CATALOGUE.map(p=>({...p}));
const withChanges=(changes,drop=[])=>base().filter(p=>!drop.includes(p.sku)).map(p=>({...p,...(changes[p.sku]??{})}));
const situations=[
 ["P01_pasta_4","Vegetarian tomato pasta for four, delivered budget ₹600.",base()],
 ["P02_pasta_2","Vegetarian pasta for two, below ₹300 delivered.",base()],
 ["P03_biryani_3","Vegetarian biryani for 3, budget 450 rupees including fees.",base()],
 ["P04_oats_2","Oats breakfast for two, under ₹300 delivered.",base()],
 ["P05_pasta_8","Pasta for eight, budget ₹700 including delivery.",base()],
 ["P06_biryani_6","Vegetarian biryani for six under ₹500 delivered.",base()],
 ["P07_pasta_stock","Pasta for four under ₹600.",withChanges({mock_pasta_500:{in_stock:false}})],
 ["P08_tomato_out","Tomato pasta for four below ₹600.",withChanges({mock_tomato_500:{in_stock:false}})],
 ["P09_tomato_unknown","Pasta for four under ₹600.",withChanges({mock_tomato_500:{ingredient_label_status:"unknown"},mock_tomato_250:{ingredient_label_status:"unknown"}})],
 ["P10_low_budget","Pasta for four under ₹120 delivered.",base()],
 ["P11_oats_low","Oatmeal for four under ₹160 delivered.",base()],
 ["P12_no_veg","Biryani for four under ₹700.",withChanges({},["mock_veg_500","mock_veg_250","mock_veg_store_b","mock_chicken"])],
 ["P13_veggies_unavailable","Vegetarian pasta for four under ₹500.",withChanges({mock_veg_500:{in_stock:false},mock_veg_250:{in_stock:false},mock_veg_store_b:{in_stock:false},mock_chicken:{in_stock:false}})],
 ["P14_peanut_trap","Pasta for four below ₹600.",withChanges({mock_tomato_500:{in_stock:false},mock_tomato_250:{in_stock:false}})],
 ["P15_multi_store","Biryani for five within ₹700.",withChanges({},["mock_veg_500","mock_veg_250","mock_chicken"])],
 ["P16_pasta_1","Pasta for one under ₹250.",base()],
 ["P17_oats_8","Oats for eight below ₹700.",base()],
 ["P18_biryani_8","Vegetarian biryani for eight below ₹800.",base()]
];
export const LLM_SCENARIOS=situations.map(([id,prompt,catalogue])=>({id,...llmCase(prompt,{catalogue})}));
