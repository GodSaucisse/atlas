// Fixed editorial enrichment tested with real isolated D1/R2, never production data.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url),wr=createRequire(require.resolve('wrangler/package.json')),{Miniflare}=wr('miniflare');
const out=path.resolve('.sites-runtime/service-span-tests');await fs.mkdir(out,{recursive:true});
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:['DB'],r2Buckets:['BUCKET'],cf:false});
let checks=0;const pass=label=>console.log(`PASS ${++checks} ${label}`);
try{
 const DB=await mf.getD1Database('DB'),BUCKET=await mf.getR2Bucket('BUCKET');
 for(const filename of (await fs.readdir('drizzle')).filter(n=>n.endsWith('.sql')).sort())for(const sql of (await fs.readFile(`drizzle/${filename}`,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await DB.prepare(sql.trim()).run();
 globalThis.__atlasEnrichmentEnv={DB,BUCKET};
 await fs.writeFile(path.join(out,'context.mjs'),'export const env=globalThis.__atlasEnrichmentEnv;export async function getChatGPTUser(){return null;}');
 const content=JSON.parse(await fs.readFile('app/content/aviation-service-span.json','utf8'));
 for(const name of ['server','model','config/rarities','config/boosters','aviation-service-span']){
  let source=await fs.readFile(`app/${name}.ts`,'utf8');source=source.replace(/from ['"]cloudflare:workers['"]/g,"from './context.mjs'").replace('from "./chatgpt-auth"',"from './context.mjs'").replace("import content from './content/aviation-service-span.json';",`const content=${JSON.stringify(content)};`);
  source=source.replace(/from (['"])(\.[^'"]+)\1/g,(m,q,ref)=>`from ${q}${ref.endsWith('.mjs')?ref:ref+'.mjs'}${q}`);
  const target=path.join(out,`${name}.mjs`);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 }
 let routeSource=await fs.readFile('app/api/maintenance/aviation-service-span/route.ts','utf8');routeSource=routeSource.replace("from 'cloudflare:workers'","from './context.mjs'").replace("from '../../../server'","from './server.mjs'").replace("from '../../../aviation-service-span'","from './aviation-service-span.mjs'");await fs.writeFile(path.join(out,'route.mjs'),ts.transpileModule(routeSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 const api=await import(path.join(out,'server.mjs')),route=await import(path.join(out,'route.mjs'));
 const actor={slot:'owner',email:'',name:'Test principal',userId:'qa-principal',updatedAt:new Date().toISOString()};
 const request=(key,origin,batch=1)=>new Request('https://atlas.test/api/maintenance/aviation-service-span',{method:'POST',body:JSON.stringify({batch}),headers:{...(key?{'X-Atlas-Content-Key':key}:{}),...(origin?{Origin:origin}:{})}});
 assert.equal((await route.POST(request())).status,404);globalThis.__atlasEnrichmentEnv.ATLAS_AVIATION_SERVICE_SPAN_KEY='isolated-editorial-key';assert.equal((await route.POST(request('incorrect'))).status,404);assert.equal((await route.POST(request('isolated-editorial-key','https://other.test'))).status,403);pass('absent key, incorrect key and cross-origin writes denied');
 let state=await api.stateFor(actor);
 const snapshot=content.map((item,index)=>({...state.cards[index%state.cards.length],id:item.code,code:item.code,name:item.code,description:item.expectedDescription,imageKey:`test-${item.code}.jpg`}));
 await DB.prepare('DELETE FROM cards').run();
 for(const c of snapshot)await DB.prepare('INSERT INTO cards(id,code,data) VALUES(?,?,?)').bind(c.id,c.code,JSON.stringify(c)).run();
 const before=await api.stateFor(actor);
 for(const batch of [1]){const response=await route.POST(request('isolated-editorial-key',undefined,batch));assert.equal(response.status,200);assert.equal((await response.json()).updated.length,content.length);}
 state=await api.stateFor(actor);assert.equal(state.cards.length,content.length);
 for(const old of before.cards){const fresh=state.cards.find(c=>c.id===old.id);const item=content.find(c=>c.code===old.code);assert.equal(fresh.description,item.description);for(const key of Object.keys(old).filter(k=>!['description','updatedAt'].includes(k)))assert.deepEqual(fresh[key],old[key]);}
 pass('Military descriptions persisted; all other card fields preserved');
 assert.deepEqual(state.albums,before.albums);assert.deepEqual(state.admins,before.admins);assert.deepEqual(state.boosterPolicy,before.boosterPolicy);pass('albums, roles and booster policy preserved');
 assert.equal((await route.POST(request('isolated-editorial-key',undefined,1))).status,410);pass('duplicate application blocked');
 const editor=await api.stateFor({...actor,slot:'editor',userId:'qa-editor'});assert.deepEqual(editor.cards,state.cards);pass('same persistent catalogue visible to both roles');
 assert.equal(state.logs.filter(l=>l.action==='Dates de service · Aviation').length,1);pass('before/after history attributed to requested editorial service');
 delete globalThis.__atlasEnrichmentEnv.ATLAS_AVIATION_SERVICE_SPAN_KEY;assert.equal((await route.POST(request('isolated-editorial-key'))).status,404);pass('revocation disables operation');
 console.log(`${checks} history checks passed`);
}finally{await mf.dispose();}
