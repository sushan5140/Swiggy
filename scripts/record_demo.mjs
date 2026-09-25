// Genuine browser recording of our local, read-only fictional demo in CI.
// No real Swiggy product pages, user addresses, orders, cards or credentials.
import {chromium} from "playwright";
import {mkdirSync,copyFileSync} from "node:fs";
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const base="http://127.0.0.1:"+(process.env.PORT??3000);
mkdirSync(new URL("../artifacts/",import.meta.url),{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({
 viewport:{width:1365,height:900},deviceScaleFactor:1,
 recordVideo:{dir:new URL("../artifacts/",import.meta.url).pathname,size:{width:1365,height:900}},
 reducedMotion:"reduce",colorScheme:"light"
});
const page=await context.newPage();
try{
 await page.goto(base,{waitUntil:"networkidle"});
 await page.locator("#plan-output .plan-status").waitFor();
 await wait(2500);
 await page.screenshot({path:new URL("../artifacts/cover.png",import.meta.url).pathname,fullPage:true});
 await page.locator('[data-example="Vegetarian biryani for 3, budget 450 rupees including fees."]').click();
 await wait(2400);
 await page.locator('[data-example="Oats breakfast for two, delivered total below 300."]').click();
 await wait(2400);
 await page.locator('[data-example="Vegetarian tomato pasta for four, delivered budget ₹600."]').click();
 await wait(2000);
 await page.locator("#case").selectOption("S04_fees_break_budget");
 await page.locator("#method").selectOption("B0");
 await page.locator("#evaluate").click();
 await page.locator("#status").scrollIntoViewIfNeeded();
 await wait(2500);
 await page.locator("#method").selectOption("T");
 await page.locator("#evaluate").click();
 await wait(2900);
 await page.locator("#case").selectOption("S03_unknown_ingredient_label");
 await page.locator("#evaluate").click();
 await wait(2800);
 await page.locator("#case").selectOption("S06_swap_without_approval");
 await page.locator("#evaluate").click();
 await wait(2700);
 await page.locator("#case").selectOption("S07_stale_inventory");
 await page.locator("#evaluate").click();
 await wait(2700);
 await page.locator(".hero").scrollIntoViewIfNeeded();
 await wait(1900);
}finally{
 const video=page.video();
 await context.close();
 const videoPath=await video.path();
 copyFileSync(videoPath,new URL("../artifacts/intent-lab-screen-recording.webm",import.meta.url));
 await browser.close();
}
console.log("Completed actual headless browser recording with synthetic inputs.");
