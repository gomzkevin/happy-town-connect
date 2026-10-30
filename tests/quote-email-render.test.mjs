import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import React from 'react';
import {renderAsync} from '@react-email/components';
import {buildQuoteEmailData} from '../supabase/functions/_shared/quote-email-data.ts';
test('actual email HTML renders saved price quantities and all adjustments',async()=>{
 const folder=mkdtempSync(new URL('./.email-render-',import.meta.url));
 try {
 const source=readFileSync(new URL('../supabase/functions/send-quote-email/_templates/quote-email-complete.tsx',import.meta.url),'utf8').replaceAll('npm:','');
 const normalized=source.replace('@react-email/components@0.0.22','@react-email/components').replace('react@18.3.1','react');
 const output=ts.transpileModule(normalized,{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 const file=join(folder,'template.mjs');writeFileSync(file,output);
 const {QuoteEmailComplete}=await import(pathToFileURL(file));
 const saved=buildQuoteEmailData({id:'fixture',customer_name:'Cliente sintético',email:'test@example.invalid',created_at:'2026-01-01T00:00:00Z',total_estimate:1500,discount_enabled:true,discount_percentage:10,logistics_fee_enabled:true,logistics_fee:300},[{service_id:'retired',service_name:'Servicio retirado',service_price:600,quantity:2}]);
 const html=await renderAsync(React.createElement(QuoteEmailComplete,{...saved,assetsBase:'https://example.invalid/assets',companyName:'Japitown',companyEmail:'test@example.invalid',termsConditions:'Capacidad máxima 30 niños',childrenCount:17}));
 for(const text of ['Servicio retirado','Descuento','Logística','Ajuste de cotización guardada','1,500','1,200','120','300']) assert.ok(html.includes(text),text);
 assert.ok(!html.includes('NaN'));
 assert.ok(!html.includes('Adjuntamos tu cotización'));
 const attached=await renderAsync(React.createElement(QuoteEmailComplete,{...saved,assetsBase:'https://example.invalid/assets',companyName:'Japitown',companyEmail:'test@example.invalid',pdfAttached:true}));
 assert.ok(attached.includes('Adjuntamos tu cotización'));
 assert.ok(html.includes('Capacidad máxima 30 niños'));
 assert.ok(!html.includes('Capacidad máxima 17 niños'));
 } finally {rmSync(folder,{recursive:true,force:true});}
});
