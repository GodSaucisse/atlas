// Fixed editorial enrichment tested with real isolated D1/R2, never production data.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url),wr=createRequire(require.resolve('wrangler/package.json')),{Miniflare}=wr('miniflare');
const out=path.resolve('.sites-runtime/aviation-tests');await fs.mkdir(out,{recursive:true});
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:['DB'],r2Buckets:['BUCKET'],cf:false});
let checks=0;const pass=label=>console.log(`PASS ${++checks} ${label}`);
try{
 const DB=await mf.getD1Database('DB'),BUCKET=await mf.getR2Bucket('BUCKET');
 for(const filename of (await fs.readdir('drizzle')).filter(n=>n.endsWith('.sql')).sort())for(const sql of (await fs.readFile(`drizzle/${filename}`,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await DB.prepare(sql.trim()).run();
 globalThis.__atlasEnrichmentEnv={DB,BUCKET};
 await fs.writeFile(path.join(out,'context.mjs'),'export const env=globalThis.__atlasEnrichmentEnv;export async function getChatGPTUser(){return null;}');
 const content=JSON.parse(await fs.readFile('app/content/aviation-enrichment.json','utf8'));
 for(const name of ['server','model','config/rarities','config/boosters','aviation-content']){
  let source=await fs.readFile(`app/${name}.ts`,'utf8');source=source.replace(/from ['"]cloudflare:workers['"]/g,"from './context.mjs'").replace('from "./chatgpt-auth"',"from './context.mjs'").replace("import content from './content/aviation-enrichment.json';",`const content=${JSON.stringify(content)};`);
  source=source.replace(/from (['"])(\.[^'"]+)\1/g,(m,q,ref)=>`from ${q}${ref.endsWith('.mjs')?ref:ref+'.mjs'}${q}`);
  const target=path.join(out,`${name}.mjs`);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 }
 let routeSource=await fs.readFile('app/api/maintenance/aviation-content/route.ts','utf8');routeSource=routeSource.replace("from 'cloudflare:workers'","from './context.mjs'").replace("from '../../../server'","from './server.mjs'").replace("from '../../../aviation-content'","from './aviation-content.mjs'");await fs.writeFile(path.join(out,'route.mjs'),ts.transpileModule(routeSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 const api=await import(path.join(out,'server.mjs')),route=await import(path.join(out,'route.mjs'));
 const actor={slot:'owner',email:'',name:'Test principal',userId:'qa-principal',updatedAt:new Date().toISOString()};
 const request=(key,origin)=>new Request('https://atlas.test/api/maintenance/aviation-content',{method:'POST',headers:{...(key?{'X-Atlas-Content-Key':key}:{}),...(origin?{Origin:origin}:{})}});
 assert.equal((await route.POST(request())).status,404);globalThis.__atlasEnrichmentEnv.ATLAS_AVIATION_CONTENT_KEY='isolated-editorial-key';assert.equal((await route.POST(request('incorrect'))).status,404);assert.equal((await route.POST(request('isolated-editorial-key','https://other.test'))).status,403);pass('absent key, incorrect key and cross-origin writes denied');
 let state=await api.stateFor(actor);
 const concorde=state.cards.find(c=>c.code==='AVI-027');Object.assign(concorde,{category:'Avion de ligne',description:'Concorde déjà validé : à conserver.',imageKey:'d4d41b38-31c0-45b1-9243-8f871c50c861.jpg',albumIds:['aviation','ligne'],status:'ready'});await DB.prepare('UPDATE cards SET data=? WHERE id=?').bind(JSON.stringify(concorde),concorde.id).run();
 const mirage=state.cards.find(c=>c.code==='AVI-049');Object.assign(mirage,{rarity:'Précieuse',albumIds:['aviation','chasse','francais']});await DB.prepare('UPDATE cards SET data=? WHERE id=?').bind(JSON.stringify(mirage),mirage.id).run();
 const first=state.cards.find(c=>c.code==='AVI-001');await DB.prepare('UPDATE cards SET data=? WHERE id=?').bind(JSON.stringify({...first,category:'Saisie récente'}),first.id).run();
 assert.equal((await route.POST(request('isolated-editorial-key'))).status,409);state=await api.stateFor(actor);assert.equal(state.revision,1);assert.equal((await BUCKET.list()).objects.length,0);pass('existing content cannot be overwritten; entire operation is rejected before uploading');
 await DB.prepare('UPDATE cards SET data=? WHERE id=?').bind(JSON.stringify(first),first.id).run();
 const before=await api.stateFor(actor),result=await route.POST(request('isolated-editorial-key'));assert.equal(result.status,200);const response=await result.json();assert.equal(response.updated.length,11);assert.equal(response.concordeUnchanged,true);assert.equal(response.complete.length,12);state=await api.stateFor(actor);assert.equal(state.cards.length,12);assert.equal(state.revision,before.revision+1);pass('11 existing cards completed in one atomic catalogue revision without duplicates');
 const keys=['category','description','imageKey','imageCredit','imageSource','updatedAt'];
 for(const old of before.cards){const fresh=state.cards.find(c=>c.id===old.id);if(old.code==='AVI-027'){assert.deepEqual(fresh,old);continue;}for(const k of Object.keys(old).filter(k=>!keys.includes(k)))assert.deepEqual(fresh[k],old[k],`${old.code}.${k}`);assert.ok(fresh.category&&fresh.description&&fresh.imageCredit&&fresh.imageSource);}
 assert.equal(state.cards.find(c=>c.code==='AVI-049').rarity,'Précieuse');assert.deepEqual(state.albums,before.albums);assert.deepEqual(state.admins,before.admins);assert.deepEqual(state.boosterPolicy,before.boosterPolicy);pass('Concorde, all rarity metadata, statuses, memberships, albums, accounts and probabilities preserved');
 for(const item of content){const object=await BUCKET.get(item.imageKey);assert.deepEqual(Buffer.from(await object.arrayBuffer()),Buffer.from(item.imageBase64,'base64'));}pass('all 11 photographs stored as exact R2 bytes');
 const audit=state.logs[0];assert.equal(audit.action,'Enrichissement éditorial · Aviation');assert.equal(JSON.parse(audit.before).length,11);assert.equal(JSON.parse(audit.after).length,11);assert.ok(audit.actorName.includes('Mathis'));pass('attributed history retains complete before/after snapshots');
 assert.equal((await route.POST(request('isolated-editorial-key'))).status,410);assert.equal((await api.stateFor(actor)).revision,state.revision);pass('repeat application blocked without extra revision or images');
 delete globalThis.__atlasEnrichmentEnv.ATLAS_AVIATION_CONTENT_KEY;assert.equal((await route.POST(request('isolated-editorial-key'))).status,404);pass('revoked key disables the maintenance operation');
 const reloaded=await api.stateFor(actor);assert.deepEqual(reloaded.cards,state.cards);pass('all content persists when state is read afresh');
 console.log(`${checks} enrichment checks passed`);
}finally{await mf.dispose();}
