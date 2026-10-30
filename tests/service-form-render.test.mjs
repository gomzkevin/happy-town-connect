import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {join} from 'node:path';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

test('actual service editor renders separate display and numeric prices for new and existing services', async () => {
 const folder=await mkdtemp(new URL('./.service-render-',import.meta.url));
 try {
  const result=await build({entryPoints:['src/components/admin/ServiceForm.tsx'],bundle:true,write:false,platform:'node',format:'esm',packages:'external',alias:{'@':fileURLToPath(new URL('../src',import.meta.url))},jsx:'automatic'});
  const file=join(folder,'form.mjs'); await writeFile(file,result.outputFiles[0].text);
  const {ServiceForm}=await import(pathToFileURL(file));
  const render=initialData=>renderToStaticMarkup(React.createElement(ServiceForm,{initialData,onSubmit:()=>{},onCancel:()=>{}}));
  const fresh=render();
  for(const name of ['price','base_price','hora_extra']) assert.ok(fresh.includes(`name="${name}"`),name);
  const saved=render({id:'cafeteria',title:'Cafetería',description:'Prueba',price:'Consultar',base_price:2000,hora_extra:0,category:'Estaciones de Juego',pricing_type:'fixed',icon:'star'});
  for(const text of ['Cafetería','Consultar','value="2000"','value="0"']) assert.ok(saved.includes(text),text);
 } finally {await rm(folder,{recursive:true,force:true});}
});
