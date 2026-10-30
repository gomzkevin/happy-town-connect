import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {buildQuoteSnapshot} from '../supabase/functions/_shared/quote-snapshot.ts';

// Execute the actual submission hook with offline transport/context doubles.
const url=new URL('../src/hooks/useQuotes.ts',import.meta.url);
let source=await readFile(url,'utf8');
source=source.replace(/^import .*;\n/gm,'');
source=`import {calcularPreciosCotizacion,aplicarDescuento} from '${new URL('../supabase/functions/_shared/pricing.ts',import.meta.url).href}';\nexport function loadHook({supabase,useServices,useToast,useState}) {\n${source.replaceAll('export ','')}\nreturn useQuotes;\n}`;
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {loadHook}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

for(const category of ['Extras','Talleres Creativos','Estaciones de Juego']) test(`submission includes quantities in subtotal and saved rows: ${category}`,async()=>{
 const selectedServices=[
  {service:{id:'a',title:'A',price:'Consultar',base_price:1000,hora_extra:100,category,pricing_type:'fixed'},quantity:3},
  {service:{id:'kit',title:'Kit',price:'Consultar',base_price:25,hora_extra:999,category,pricing_type:'per_child'},quantity:2},
 ];
 const inserts={};let email,cleared=false;
 const supabase={from(table){return {insert(rows){inserts[table]=rows;return this},select(){return this},single:async()=>({data:{id:'synthetic'},error:null}),then(resolve){resolve({data:inserts[table],error:null})}}},functions:{invoke:async(name,{body})=>{email=body;return {data:{success:true},error:null}}}};
 const hook=loadHook({supabase,useState:()=>[false,()=>{}],useServices:()=>({selectedServices,clearSelection:()=>{cleared=true}}),useToast:()=>({toast:()=>{}})})();
 await hook.submitQuote({customerName:'Synthetic',email:'test@example.invalid',childrenCount:30,source:'services',extraHours:1,discountEnabled:true,discountPercentage:10});
 const unit=category==='Talleres Creativos'?1400:1100;
 const subtotal=unit*3+750*2;
 assert.equal(inserts.quotes.total_estimate,subtotal-Math.round(subtotal*0.1));
 assert.deepEqual(inserts.quote_services.map(row=>[row.service_price,row.quantity]),[[unit,3],[750,2]]);
 assert.equal(buildQuoteSnapshot(inserts.quotes,inserts.quote_services).adjustment,0);
 assert.equal(email.totalEstimate,inserts.quotes.total_estimate);
 assert.deepEqual(email.services.map(row=>[row.price,row.quantity]),[[unit,3],[750,2]]);
 assert.equal(cleared,true);
});
