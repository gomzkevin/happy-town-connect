// Node.js 24+: node --test tests/quote-pdf.test.mjs
// Optional local visual fixtures: PDF_TEST_OUTPUT=/tmp/quote-pdf-qa node --test tests/quote-pdf.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { PDFDocument, PDFPage } from 'pdf-lib';
import { renderer, offlineAssets } from './helpers/load-quote-pdf.mjs';
import { buildQuoteEmailData } from '../supabase/functions/_shared/quote-email-data.ts';
import { buildQuoteSnapshot } from '../supabase/functions/_shared/quote-snapshot.ts';
import { calcularPreciosCotizacion, aplicarDescuento } from '../supabase/functions/_shared/pricing.ts';
const { calcularTotal, calcularLayout, deriveServiceSets, validate, distribuirEnFilas, mapSavedQuoteToConfig, mapQuoteToConfig, generateQuotePDF } = renderer;
const service = (id, category = 'Extras', extra = {}) => ({id, title:`Servicio ${id}`, category, base_price:1000, hora_extra:0, features:['Material incluido', 'Personal de apoyo'], pdf_color:'blue', pdf_subtitle:'Diversión para tu evento', ...extra});
const catalog = new Map([
  service('a', 'Estaciones de Juego'), service('b', 'estaciones-de-juego', {hora_extra:500}), service('c', 'Estaciones de Juego'),
  service('w', 'Talleres Creativos', {base_price:1500, hora_extra:900}),
  service('f'), service('kit', 'Talleres Creativos', {pricing_type:'per_child', base_price:25, hora_extra:999}),
].map(s => [s.id,s]));
const base = {cliente:'Cliente de prueba', n_ninos:30, horas:4, fecha:'22 de octubre de 2026', fecha_emision:'22 de octubre de 2026'};
const rows = [
  {id:'r1',service_id:'a',service_name:'Estación conservada',service_price:1111,quantity:2},
  {id:'r2',service_id:'kit',service_name:'Kit precio original',service_price:50,quantity:4},
  {id:'r3',service_id:'deleted',service_name:'Servicio retirado del catálogo',service_price:300,quantity:2},
  {id:'r4',service_id:'deleted',service_name:'Otra línea del servicio retirado',service_price:90,quantity:1},
];
const savedQuote = {id:'fixture',email:'test@example.invalid',created_at:'2026-10-01T00:00:00Z',customer_name:'Cliente de prueba',children_count:45,extra_hours:2,event_date:'2026-10-22',discount_enabled:true,discount_percentage:10,logistics_fee_enabled:true,logistics_fee:250,total_estimate:3100};

test('raw PDF prices and detail totals share canonical engine across all child tiers', () => {
  for (const n_ninos of [1,15,16,30,31,50,51]) for (const horas of [3,4,5]) {
    const config = {...base,n_ninos,horas,estaciones:['a','b','c'],talleres:['w'],fijos:['f'],per_child:['kit'],discount_enabled:true,discount_percentage:12,logistics_fee:333};
    const expected = calcularPreciosCotizacion([...catalog.values()], n_ninos, horas-3);
    const result = calcularTotal(config,catalog);
    assert.equal(result.servicesSubtotal,expected.total);
    assert.equal(result.total,aplicarDescuento(expected.total,12).totalConDescuento+333);
    const layout = calcularLayout(config,catalog);
    assert.equal(layout.reduce((sum,b) => sum + (b.tipo === 'estacion_resumen' ? b.precio : b.cards.reduce((sum,c)=>sum+c.precio,0)),0),expected.total);
    const station = layout.find(b=>b.tipo==='estacion_resumen');
    assert.equal(station.rows[0].price,3500+500*(horas-3));
    assert.equal(station.rows[1].price,2000); // zero hora_extra stays zero, never 800
  }
});
test('per-child-only request accepted; category membership and raw minimum unchanged', () => {
  const sets = deriveServiceSets(catalog);
  assert.deepEqual(validate({...base,per_child:['kit']},sets),[]);
  assert.ok(validate({...base,per_child:['w']},sets).some(s=>s.includes('inválido')));
  assert.ok(validate({...base,talleres:['kit']},sets).some(s=>s.includes('inválido')));
  assert.ok(validate({...base,estaciones:['a']},sets).includes('Mínimo 2 estaciones'));
  assert.deepEqual(validate({...base,estaciones:['a','b']},sets),[]);
});
test('duplicate IDs and malformed numeric or collection values rejected without throwing', () => {
  const sets=deriveServiceSets(catalog);
  for(const value of [NaN,Infinity,-1,0,1.5,'30',null]) assert.ok(validate({...base,per_child:['kit'],n_ninos:value},sets).length);
  for(const value of [NaN,Infinity,-1,0,'3',null]) assert.ok(validate({...base,per_child:['kit'],horas:value},sets).length);
  for(const value of [NaN,Infinity,-1,'12',null]) assert.ok(validate({...base,per_child:['kit'],logistics_fee:value},sets).length);
  for(const field of ['discount_percentage','anticipo_pct']) for(const value of [NaN,Infinity,-1,101,'12',null]) assert.ok(validate({...base,per_child:['kit'],[field]:value},sets).length);
  for(const field of ['estaciones','fijos','talleres','per_child']) for(const value of ['a',3,{},null]) assert.ok(validate({...base,[field]:value},sets).length);
  assert.ok(validate({...base,per_child:['kit','kit']},sets).some(s=>s.includes('duplicado')));
  assert.ok(validate({...base,fijos:['kit'],per_child:['kit']},sets).some(s=>s.includes('duplicado')));
  assert.ok(validate({...base,cliente:1,fecha:2,per_child:['kit'],notas_extra:[3]},sets).length>=3);
});
test('saved snapshot names, quantities, duplicate rows, retired services and exact total remain authoritative', () => {
  const snapshot=buildQuoteSnapshot(savedQuote,rows);
  const config=mapSavedQuoteToConfig(savedQuote,snapshot,catalog);
  assert.equal(config.horas,5);
  assert.deepEqual(config.per_child,['kit']);
  assert.equal(config.fijos.length,2);
  assert.equal(calcularTotal(config,catalog,snapshot),snapshot);
  const layout=calcularLayout(config,catalog,snapshot);
  const station=layout.find(b=>b.tipo==='estacion_resumen');
  assert.equal(station.rows[0].price,2222);
  assert.match(station.rows[0].name,/Estación conservada.*Cantidad: 2/);
  const cards=layout.flatMap(b=>b.tipo==='fila_cards'?b.cards:[]);
  assert.deepEqual(cards.map(c=>c.nombre),rows.slice(1).map(r=>r.service_name));
  assert.match(cards[0].subtitulo,/Cantidad: 4 × \$50/);
  assert.equal(cards[0].precio,200); // never current 45 children x current 25
  assert.equal(snapshot.total,3100);
  assert.notEqual(snapshot.adjustment,0);
  assert.equal(cards.length+station.rows.length,rows.length);
  const renamedCatalog = new Map([...catalog].map(([id,s])=>[id,{...s,title:'Changed',base_price:999999,hora_extra:9000}]));
  assert.deepEqual(calcularLayout(config,renamedCatalog,snapshot),layout);
});
test('database mapper fetches only saved quote and rows; row query errors fail closed', async () => {
  const tables=[];
  const fake=(failure=false)=>({from(table){ tables.push(table);return {select(){return this},eq(){return this},single:async()=>({data:savedQuote,error:null}),order:async()=>({data:rows,error:failure?new Error('unavailable'):null})};}});
  const mapped=await mapQuoteToConfig(fake(),'quote-1',catalog);
  assert.equal(mapped.snapshot.lines.length,4);
  assert.deepEqual(tables,['quotes','quote_services']);
  await assert.rejects(()=>mapQuoteToConfig(fake(true),'quote-1',catalog),/Could not load saved quote services/);
});
test('layout keeps every service beyond the old nine-card truncation', () => {
  const cards=Array.from({length:22},(_,i)=>({key:String(i)}));
  assert.equal(distribuirEnFilas(cards).flat().length,22);
  assert.ok(distribuirEnFilas(cards).every(row=>row.length<=3));
});

async function renderFixture(name,config,services,snapshot) {
  const drawn=[];
  const originalDraw=PDFPage.prototype.drawText;
  const originalFetch=globalThis.fetch;
  PDFPage.prototype.drawText=function(text,opts){drawn.push({text,...opts});return originalDraw.call(this,text,opts);};
  globalThis.fetch=()=>{throw new Error('Offline test must not access network');};
  let bytes;
  try {bytes=await generateQuotePDF(config,services,undefined,undefined,snapshot,offlineAssets);}
  finally {PDFPage.prototype.drawText=originalDraw;globalThis.fetch=originalFetch;}
  const pdf=await PDFDocument.load(bytes);
  if(process.env.PDF_TEST_OUTPUT){await mkdir(process.env.PDF_TEST_OUTPUT,{recursive:true});await writeFile(`${process.env.PDF_TEST_OUTPUT}/${name}.pdf`,bytes);}
  assert.ok(drawn.every(t=>Number.isFinite(t.x)&&Number.isFinite(t.y)&&t.y>=0&&t.y<792));
  return {pdf,drawn};
}
test('offline branded raw PDF renders inclusive extra-hours without catalog fallbacks', async () => {
  const config={...base,estaciones:['a','b','c'],talleres:['w'],per_child:['kit'],discount_enabled:true,discount_percentage:10,logistics_fee:500};
  const {pdf,drawn}=await renderFixture('current-quote',config,catalog);
  assert.equal(pdf.getPageCount(),2);
  assert.ok(drawn.some(t=>t.text==='$4,000'));
  assert.ok(drawn.some(t=>t.text==='$2,000'));
  assert.ok(drawn.some(t=>t.text==='30 niños × $25'));
  assert.ok(drawn.some(t=>t.text==='Contactar para datos de pago'));
});
test('offline historical PDF displays reconciliation and all saved financial facts', async () => {
  const snapshot=buildQuoteSnapshot(savedQuote,rows);
  const config=mapSavedQuoteToConfig(savedQuote,snapshot,catalog);
  const {pdf,drawn}=await renderFixture('saved-quote',config,catalog,snapshot);
  assert.ok(pdf.getPageCount()>=2);
  assert.ok(drawn.some(t=>t.text==='Ajuste para conciliar el total guardado'));
  assert.ok(drawn.some(t=>t.text==='$3,100'));
  assert.ok(drawn.some(t=>t.text==='Cantidad: 4 × $50'));
  assert.ok(drawn.some(t=>t.text==='Importes conservados de la cotización guardada.'));
});
test('offline many-service PDF paginates without losing names or drawing into footer', async () => {
  const savedRows=Array.from({length:22},(_,i)=>({id:String(i),service_id:`deleted-${i}`,service_name:`Servicio conservado número ${i+1}`,service_price:100+i,quantity:i%3+1}));
  const snapshot=buildQuoteSnapshot({},savedRows);
  const config=mapSavedQuoteToConfig({...savedQuote,discount_enabled:false,logistics_fee_enabled:false},snapshot,new Map());
  const {pdf,drawn}=await renderFixture('many-services',config,new Map(),snapshot);
  assert.ok(pdf.getPageCount()>=4);
  for(const row of savedRows) assert.ok(drawn.some(t=>t.text.includes(row.service_name.split(' ').slice(-2).join(' '))));
  assert.ok(drawn.filter(t=>t.text.startsWith('Servicio conservado') || t.text.startsWith('Cantidad:')).every(t=>t.y>94));
});

test('saved PDF and email retain original issuance date after regeneration', async () => {
 const snapshot=buildQuoteSnapshot(savedQuote,rows);
 const config=mapSavedQuoteToConfig(savedQuote,snapshot,catalog);
 const email=buildQuoteEmailData(savedQuote,rows);
 assert.equal(config.fecha_emision,'1 de octubre de 2026');
 assert.equal(config.fecha_emision,email.createdDate);
 const {drawn}=await renderFixture('saved-date',config,catalog,snapshot);
 assert.ok(drawn.some(row=>row.text===email.createdDate));
 assert.throws(()=>mapSavedQuoteToConfig({...savedQuote,created_at:'bad'},snapshot,catalog),/creation date/);
});


test('corrected Cafetería catalog membership creates the Construcción + Cafetería pair in raw PDF', () => {
  const ids=['supermercado','veterinaria','construccion','cafeteria'];
  const names=['Supermercado','Veterinaria','Construcción','Cafetería'];
  const fixedCatalog=new Map(ids.map((id,i)=>[id,service(id,'Estaciones de Juego',{title:names[i],base_price:2000,pricing_type:'fixed'})]));
  const sets=deriveServiceSets(fixedCatalog);
  assert.deepEqual([...sets.estacionIds],ids);
  assert.equal(sets.fijoIds.has('cafeteria'),false);
  const config={...base,horas:3,estaciones:ids};
  const blocks=calcularLayout(config,fixedCatalog);
  assert.equal(blocks.length,1);
  assert.deepEqual(blocks[0].rows.map(row=>[row.name,row.price]),[
    ['Supermercado + Veterinaria',3500],['Construcción + Cafetería',3500],
  ]);
  assert.equal(calcularTotal(config,fixedCatalog).total,7000);
});

test('reported four-station quote totals 10000 when corrected, while saved 9800 stays authoritative', () => {
  const ids=['supermercado','veterinaria','construccion','cafeteria'];
  const names=['Supermercado','Veterinaria','Construcción','Cafetería'];
  const corrected=new Map(ids.map((id,i)=>[id,service(id,'Estaciones de Juego',{title:names[i],base_price:2000,pricing_type:'fixed',hora_extra:500})]));
  corrected.set('caballetes',service('caballetes','Talleres Creativos',{title:'Caballetes',base_price:2000,pricing_type:'fixed',hora_extra:800}));
  const incorrect=new Map(corrected);
  incorrect.set('cafeteria',{...corrected.get('cafeteria'),category:'entretenimiento'});
  const common={...base,horas:3,n_ninos:30,talleres:['caballetes'],logistics_fee:400,discount_enabled:false};
  const before={...common,estaciones:ids.slice(0,3),fijos:['cafeteria']};
  const after={...common,estaciones:ids};
  assert.equal(calcularTotal(before,incorrect).total,10500); // attached PDF
  assert.equal(calcularTotal(after,corrected).total,10000); // two station pairs + workshop + logistics
  assert.equal(calcularPreciosCotizacion([...corrected.values()],30,0).total+400,10000);
  assert.deepEqual(validate(after,deriveServiceSets(corrected)),[]);

  // Previously saved financial facts are not retroactively replaced by catalog correction.
  const saved={...savedQuote,extra_hours:0,children_count:30,total_estimate:9800,discount_enabled:false,discount_percentage:0,logistics_fee_enabled:true,logistics_fee:400};
  const savedRows=[...ids.map((id,i)=>({id:`row-${id}`,service_id:id,service_name:names[i],service_price:id==='cafeteria'?2000:1600,quantity:1})),
    {id:'row-caballetes',service_id:'caballetes',service_name:'Caballetes',service_price:2600,quantity:1}];
  const snapshot=buildQuoteSnapshot(saved,savedRows);
  assert.equal(snapshot.total,9800);
  const savedConfig=mapSavedQuoteToConfig(saved,snapshot,corrected);
  assert.equal(calcularTotal(savedConfig,corrected,snapshot).total,9800);
  assert.deepEqual(snapshot.lines.map(line=>line.unitPrice),[1600,1600,1600,2000,2600]);
});
