import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildQuoteEmailData} from '../supabase/functions/_shared/quote-email-data.ts';
const quote={id:'synthetic-quote',customer_name:'Cliente de prueba',email:'test@example.invalid',created_at:'2026-10-01T00:00:00Z',total_estimate:3050,discount_enabled:true,discount_percentage:10,logistics_fee_enabled:true,logistics_fee:350};
const lines=[{service_id:'retired',service_name:'Servicio histórico',service_price:1500,quantity:2}];
test('email uses saved per-child/hours-inclusive unit prices, quantities, discounts and logistics',()=>{
 const data=buildQuoteEmailData(quote,lines);
 assert.equal(data.services[0].price,1500);assert.equal(data.services[0].quantity,2);
 assert.equal(data.totalEstimate,3050);assert.equal(data.discountAmount,300);assert.equal(data.logisticsFee,350);assert.equal(data.savedAdjustment,0);
});
test('email reference and date stable across regeneration',()=>{
 assert.deepEqual(buildQuoteEmailData(quote,lines),buildQuoteEmailData(quote,lines));
 assert.equal(buildQuoteEmailData(quote,lines).quoteNumber,'QUO-synthetic-quote');
});
test('email surfaces legacy mismatches instead of using catalog price',()=>{
 assert.equal(buildQuoteEmailData({...quote,total_estimate:3000},lines).savedAdjustment,-50);
});
test('email endpoint uses stored facts without duplicated pricing engine',()=>{
 const source=readFileSync(new URL('../supabase/functions/send-quote-email/index.ts',import.meta.url),'utf8');
 assert.ok(source.includes('buildQuoteEmailData('));assert.ok(!source.includes('function calcularPreciosCotizacion'));
 assert.ok(!source.includes(".from('services')"));
});
