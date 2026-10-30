import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQuoteSnapshot } from '../supabase/functions/_shared/quote-snapshot.ts';
const rows=[{id:'line-a',service_id:'inactive',service_name:'Nombre guardado',service_price:750,quantity:2}];
test('saved lines preserve prices, name, quantity without catalog',()=>{
 const s=buildQuoteSnapshot({total_estimate:1500},rows);
 assert.equal(s.total,1500); assert.equal(s.lines[0].total,1500); assert.equal(s.lines[0].name,'Nombre guardado'); assert.equal(s.lines[0].quantity,2);
});
test('discount precedes logistics, saved total is authoritative',()=>{
 const s=buildQuoteSnapshot({total_estimate:1700,discount_enabled:true,discount_percentage:10,logistics_fee_enabled:true,logistics_fee:350},rows);
 assert.equal(s.servicesSubtotal,1500); assert.equal(s.discountAmount,150);assert.equal(s.logisticsFee,350);assert.equal(s.adjustment,0);
});
test('legacy total discrepancies are explicit, never rewritten',()=>{
 const s=buildQuoteSnapshot({total_estimate:1400},rows);
 assert.equal(s.total,1400);assert.equal(s.adjustment,-100);assert.equal(s.pricingVersion,'legacy-saved');
});
test('null total falls back to saved lines only, zero total remains zero',()=>{
 assert.equal(buildQuoteSnapshot({total_estimate:null},rows).total,1500);
 assert.equal(buildQuoteSnapshot({total_estimate:0},rows).total,0);
});
test('duplicate service references preserve independent line identities',()=>{
 const s=buildQuoteSnapshot({},[...rows,{...rows[0],id:'line-b',service_price:100}]);
 assert.equal(s.total,1700);assert.notEqual(s.lines[0].key,s.lines[1].key);
});
test('invalid saved amounts or quantities fail rather than reprice',()=>{
 for(const quantity of [0,-1,1.5,NaN]) assert.throws(()=>buildQuoteSnapshot({},[{...rows[0],quantity}]));
 for(const service_price of [-1,Infinity,NaN]) assert.throws(()=>buildQuoteSnapshot({},[{...rows[0],service_price}]));
});
