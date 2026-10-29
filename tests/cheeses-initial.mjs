// Fixed editorial enrichment tested with real isolated D1/R2, never production data.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url),wr=createRequire(require.resolve('wrangler/package.json')),{Miniflare}=wr('miniflare');
const out=path.resolve('.sites-runtime/cheese-tests');await fs.mkdir(out,{recursive:true});
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:['DB'],r2Buckets:['BUCKET'],cf:false});
let checks=0;const pass=label=>console.log(`PASS ${++checks} ${label}`);
try{
 const DB=await mf.getD1Database('DB'),BUCKET=await mf.getR2Bucket('BUCKET');
 for(const filename of (await fs.readdir('drizzle')).filter(n=>n.endsWith('.sql')).sort())for(const sql of (await fs.readFile(`drizzle/${filename}`,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await DB.prepare(sql.trim()).run();
 globalThis.__atlasEnrichmentEnv={DB,BUCKET};
 await fs.writeFile(path.join(out,'context.mjs'),'export const env=globalThis.__atlasEnrichmentEnv;export async function getChatGPTUser(){return null;}');
 const content=JSON.parse(await fs.readFile('app/content/cheeses-initial.json','utf8'));
 for(const name of ['server','model','config/rarities','config/boosters','cheeses-initial']){
  let source=await fs.readFile(`app/${name}.ts`,'utf8');source=source.replace(/from ['"]cloudflare:workers['"]/g,"from './context.mjs'").replace('from "./chatgpt-auth"',"from './context.mjs'").replace("import content from './content/cheeses-initial.json';",`const content=${JSON.stringify(content)};`);
  source=source.replace(/from (['"])(\.[^'"]+)\1/g,(m,q,ref)=>`from ${q}${ref.endsWith('.mjs')?ref:ref+'.mjs'}${q}`);
  const target=path.join(out,`${name}.mjs`);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 }
 let routeSource=await fs.readFile('app/api/maintenance/cheeses-initial/route.ts','utf8');routeSource=routeSource.replace("from 'cloudflare:workers'","from './context.mjs'").replace("from '../../../server'","from './server.mjs'").replace("from '../../../cheeses-initial'","from './cheeses-initial.mjs'");await fs.writeFile(path.join(out,'route.mjs'),ts.transpileModule(routeSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 const api=await import(path.join(out,'server.mjs')),route=await import(path.join(out,'route.mjs'));
 const actor={slot:'owner',email:'',name:'Test principal',userId:'qa-principal',updatedAt:new Date().toISOString()};
 const request=(key,origin)=>new Request('https://atlas.test/api/maintenance/cheeses-initial',{method:'POST',headers:{...(key?{'X-Atlas-Content-Key':key}:{}),...(origin?{Origin:origin}:{})}});
 assert.equal((await route.POST(request())).status,404);globalThis.__atlasEnrichmentEnv.ATLAS_CHEESES_IMPORT_KEY='isolated-editorial-key';assert.equal((await route.POST(request('incorrect'))).status,404);assert.equal((await route.POST(request('isolated-editorial-key','https://other.test'))).status,403);pass('absent key, incorrect key and cross-origin writes denied');
 const before=await api.stateFor(actor);
 const template=before.cards[0],duplicate={...template,id:'duplicate-cheese',code:'FRO-999',name:'Comte',universe:'Fromages'};
 await DB.prepare('INSERT INTO cards(id,code,data) VALUES(?,?,?)').bind(duplicate.id,duplicate.code,JSON.stringify(duplicate)).run();
 assert.equal((await route.POST(request('isolated-editorial-key'))).status,409);assert.equal((await BUCKET.list()).objects.length,0);pass('accent-insensitive duplicate rejected before uploads');
 await DB.prepare('DELETE FROM cards WHERE id=?').bind(duplicate.id).run();
 const response=await route.POST(request('isolated-editorial-key'));assert.equal(response.status,200);assert.equal((await response.json()).created,9);
 const state=await api.stateFor(actor),cheeses=state.cards.filter(c=>c.universe==='Fromages');assert.equal(cheeses.length,9);assert.equal(state.cards.length,before.cards.length+9);
 for(const old of before.cards)assert.deepEqual(state.cards.find(c=>c.id===old.id),old);pass('9 cheeses created; existing Aviation catalogue unchanged');
 for(const item of content){const c=cheeses.find(c=>c.code===item.code);assert.equal(c.name,item.name);assert.equal(c.category,item.category);assert.equal(c.description,item.description);assert.equal(c.rarity,null);assert.equal(c.rarityProposal,item.rarityProposal);assert.equal(c.rarityStatus,'pending');assert.equal(c.status,'draft');assert.deepEqual(c.albumIds,['fromages']);const image=await BUCKET.get(c.imageKey);assert.deepEqual(Buffer.from(await image.arrayBuffer()),Buffer.from(item.imageBase64,'base64'));assert.ok(c.imageSource&&c.imageCredit);}
 pass('all categories, descriptions, exact R2 photographs, attribution and pending rarity proposals persisted');
 for(const old of before.albums)assert.deepEqual(state.albums.find(a=>a.id===old.id),old);assert.equal(state.albums.filter(a=>a.universe==='Fromages'&&a.kind==='general').length,1);assert.deepEqual(state.admins,before.admins);assert.deepEqual(state.boosterPolicy,before.boosterPolicy);pass('one general cheese album added; existing albums, roles and probabilities preserved');
 assert.equal((await route.POST(request('isolated-editorial-key'))).status,410);assert.equal((await BUCKET.list()).objects.length,9);pass('repeat application blocked without duplicates');
 const editor=await api.stateFor({...actor,slot:'editor',userId:'qa-editor'});assert.deepEqual(editor.cards,state.cards);pass('both roles read the same persistent catalogue');
 assert.equal(state.logs[0].action,'Catalogue Fromages · import initial');assert.ok(state.logs[0].actorName.includes('Mathis'));pass('complete attributed import history');
 delete globalThis.__atlasEnrichmentEnv.ATLAS_CHEESES_IMPORT_KEY;assert.equal((await route.POST(request('isolated-editorial-key'))).status,404);pass('revoked key disables the operation');
 console.log(`${checks} cheese import checks passed`);
}finally{await mf.dispose();}
