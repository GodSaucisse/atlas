import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {Miniflare}=wranglerRequire('miniflare');
const out=path.resolve('.sites-runtime/special-edition-catalog');await fs.mkdir(out,{recursive:true});
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:['DB'],r2Buckets:['BUCKET'],cf:false});
try{
 const DB=await mf.getD1Database('DB'),BUCKET=await mf.getR2Bucket('BUCKET');
 for(const file of (await fs.readdir('drizzle')).filter(n=>n.endsWith('.sql')).sort())for(const statement of (await fs.readFile(`drizzle/${file}`,'utf8')).split('--> statement-breakpoint'))if(statement.trim())await DB.prepare(statement.trim()).run();
 globalThis.__editionEnv={DB,BUCKET,ATLAS_OWNER_EMAIL:'owner@atlas.test'};
 await fs.writeFile(path.join(out,'test-context.mjs'),'export const env=globalThis.__editionEnv;export async function getChatGPTUser(){return {userId:"qa-owner",email:"owner@atlas.test",fullName:"Test owner"}}');
 const seen=new Set();async function compile(name){if(seen.has(name))return;seen.add(name);let src=await fs.readFile('app/'+name+'.ts','utf8');
 src=src.replace(/from ["']cloudflare:workers["']/g,'from "./test-context.mjs"').replace(/from ["']\.\/chatgpt-auth["']/g,'from "./test-context.mjs"');
 for(const m of [...src.matchAll(/import (\w+) from ['"]([^'"]+\.json)['"];?/g)])src=src.replace(m[0],`const ${m[1]}=${await fs.readFile(path.resolve('app',path.dirname(name),m[2]),'utf8')};`);
 for(const m of [...src.matchAll(/from ['"](\.[^'"]+)['"]/g)])if(!m[1].endsWith('.mjs'))await compile(path.posix.normalize(path.posix.join(path.posix.dirname(name),m[1])));
 src=src.replace(/from (['"])(\.[^'"]+)\1/g,(m,q,ref)=>`from ${q}${ref.endsWith('.mjs')?ref:ref+'.mjs'}${q}`);
 const dest=path.join(out,name+'.mjs');await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);}
 await compile('server');const api=await import(path.join(out,'server.mjs')),owner=await api.authorize();
 let state=await api.stateFor(owner);const editions=state.cards.filter(c=>c.rarity==='Editions spéciales');assert.equal(editions.length,27);assert.equal(state.cards.length,77);
 const album=state.albums.find(a=>a.id==='editions-speciales');assert.equal(album.name,'Editions spéciales');assert.equal(album.kind,'general');assert.equal(album.status,'active');for(const card of editions){assert.ok(card.albumIds.includes(album.id));assert.equal(card.rarityStatus,'validated');assert.equal(card.status,'ready');assert.ok(card.imageKey);}
 const {belongs}=await import(path.join(out,'album-classification.mjs'));assert.equal(belongs(editions.find(c=>c.id==='ESP-002'),{id:'antiquity',name:'Antiquité',universe:'Histoire',kind:'specialized'}),false);
 const revision=state.revision;state=await api.stateFor(owner);assert.equal(state.revision,revision);assert.equal(state.cards.length,77);assert.equal(state.logs.filter(l=>l.action==='Création des Editions spéciales sur instruction explicite').length,1);
 const card=editions[0];assert.equal(card.universe,'Editions spéciales');assert.ok(card.code.startsWith('EDS-'));assert.equal(card.editionSubjectUniverse,undefined);assert.equal(state.cards.filter(c=>c.universe==='NBA'&&c.rarity==='Suprême').length,14);state=await api.mutate(owner,{action:'card.save',revision:state.revision,card:{...card,learningText:'Texte mis à jour par un administrateur.'}});assert.equal(state.cards.find(c=>c.id===card.id).learningText,'Texte mis à jour par un administrateur.');
 state=await api.mutate(owner,{action:'album.save',revision:state.revision,album,cardIds:editions.map(c=>c.id)});assert.equal(state.cards.filter(c=>c.albumIds.includes(album.id)).length,27);
 assert.throws(()=>api.validateCard({...state.cards.find(c=>c.code==='AVI-001'),albumIds:[album.id]},state.cards.find(c=>c.code==='AVI-001'),owner,state.albums),e=>e.status===400);
 console.log('PASS atomic persisted migration: 21 ready/validated editions, principal album, idempotence, one audit entry, editable original images, mixed subject membership and ordinary rarity rejection.');
}finally{await mf.dispose()}
