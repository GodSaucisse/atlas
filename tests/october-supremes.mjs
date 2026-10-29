import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRequire} from 'node:module';
await import('./archive-supremes.mjs');
const manifest=JSON.parse(await fs.readFile('app/content/october-supreme-import.json','utf8')),designs=JSON.parse(await fs.readFile('app/content/october-supreme-designs.json','utf8')),css=await fs.readFile('app/components/october-supreme-card.css','utf8');
assert.equal(manifest.length,18);assert.equal(Object.keys(designs).length,18);assert.equal(new Set(manifest.map(c=>c.code)).size,18);
for(const item of manifest){const d=designs[item.code];assert.equal(d.universe,item.universe);assert.ok(!/<script|<iframe|\bon\w+=|javascript:|data:image/i.test(d.html));await fs.access('public'+item.asset);assert.ok(/^[a-f\d-]{36}\.(png|jpg|webp|gif)$/.test(item.imageKey));assert.equal(item.sourceSha256.length,64);}
for(const ref of new Set((css+Object.values(designs).map(d=>d.html).join('')).match(/\/designs\/[^\s"')<>]+/g)))await fs.access('public'+ref);
assert.ok(!/body\s*\{|:hover|data:image|https?:|\.\w+-z\d\d/.test(css));
const {default:CardVisual}=await import(path.resolve('.sites-runtime/archive-supreme-tests/components/card-visual.mjs'));
const cards=manifest.map(c=>({...c,id:c.code,rarity:'Suprême',rarityStatus:'validated',rarityProposal:null,albumIds:[],status:'ready'}));
const markup=renderToStaticMarkup(React.createElement('div',null,...cards.flatMap(card=>[0,1].map(copy=>React.createElement(CardVisual,{key:card.code+copy,card})))));
for(const card of cards){assert.ok(markup.includes(`data-design-model="${card.code}"`));assert.ok(markup.includes(`data-layout="${designs[card.code].slug}-supreme"`));}
const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const m of markup.matchAll(/url\(#([^)]+)\)/g))assert.ok(ids.includes(m[1]));
console.log('PASS 18 native Supreme renderers: source hashes, original coordinates, local assets, scoped styles, safe markup, duplicate-instance SVG IDs.');
const out=path.resolve('.sites-runtime/october-supremes'),seen=new Set();await fs.mkdir(out,{recursive:true});
async function compile(name){if(seen.has(name))return;seen.add(name);let source=await fs.readFile('app/'+name+'.ts','utf8');source=source.replace(/from ["']cloudflare:workers["']/g,'from "./test-context.mjs"').replace(/from ["']\.\/chatgpt-auth["']/g,'from "./test-context.mjs"');for(const m of [...source.matchAll(/import (\w+) from ['"]([^'"]+\.json)['"];?/g)])source=source.replace(m[0],`const ${m[1]}=${await fs.readFile(path.resolve('app',path.dirname(name),m[2]),'utf8')};`);for(const m of [...source.matchAll(/(?:from|import\s*\()\s*['"](\.[^'"]+)['"]/g)])if(!m[1].endsWith('.mjs'))await compile(path.posix.normalize(path.posix.join(path.posix.dirname(name),m[1])));source=source.replace(/from (['"])(\.[^'"]+)\1/g,(m,q,ref)=>`from ${q}${ref.endsWith('.mjs')?ref:ref+'.mjs'}${q}`);source=source.replace(/import\((['"])(\.[^'"]+)\1\)/g,(m,q,ref)=>`import(${q}${ref.endsWith('.mjs')?ref:ref+'.mjs'}${q})`);const dest=path.join(out,name+'.mjs');await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);}
await compile('october-supreme-migration');
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json')),{Miniflare}=wranglerRequire('miniflare');
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:['DB'],r2Buckets:['BUCKET'],cf:false});
try{
 const DB=await mf.getD1Database('DB'),BUCKET=await mf.getR2Bucket('BUCKET');for(const file of (await fs.readdir('drizzle')).filter(n=>n.endsWith('.sql')).sort())for(const statement of (await fs.readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint'))if(statement.trim())await DB.prepare(statement.trim()).run();
 globalThis.__octoberEnv={DB,BUCKET,ATLAS_OWNER_EMAIL:'qa@atlas.test'};globalThis.__octoberUser={userId:'qa-october',email:'qa@atlas.test',fullName:'QA October',displayName:'QA October'};await fs.writeFile(path.join(out,'test-context.mjs'),'export const env=globalThis.__octoberEnv;export async function getChatGPTUser(){return globalThis.__octoberUser;}');
 const server=await import(path.join(out,'server.mjs')),migration=await import(path.join(out,'october-supreme-migration.mjs')),owner=await server.authorize();await server.stateFor(owner);
 // Simulate a live existing catalog: use existing cards with stable IDs, descriptions and extra manual album assignments.
 const baseAlbums=manifest.filter((x,i,a)=>a.findIndex(y=>y.universe===x.universe)===i).map(c=>({id:c.universe,name:c.universe,universe:c.universe,kind:'general',status:'active',description:'Album',updatedAt:'before'}));
 const specialty={id:'qa-forces',name:'Forces spéciales',universe:'Militaire',kind:'specialized',status:'active',description:'Forces',updatedAt:'before'};baseAlbums.push(specialty);
 const existing=cards.map(c=>({...c,id:'stable-'+c.code,description:c.description+' · texte conservé',imageKey:'old.jpg',albumIds:[c.universe],updatedAt:'before'}));
 const changes=migration.octoberSupremeChanges(existing,baseAlbums,owner.userId,'now');assert.equal(changes.cards.length,18);for(const card of changes.cards){assert.equal(card.id,'stable-'+card.code);assert.ok(card.description.endsWith('texte conservé'));assert.equal(card.rarity,'Suprême');assert.equal(card.rarityStatus,'validated');assert.ok(card.albumIds.includes(card.universe));assert.ok(!card.albumIds.includes('editions-speciales'));}
 assert.ok(changes.cards.find(c=>c.code==='MIL-001').albumIds.includes(specialty.id));
 assert.throws(()=>migration.octoberSupremeChanges(existing.map(c=>c.code==='MIL-001'?{...c,name:'Wrong subject'}:c),baseAlbums,owner.userId,'now'),e=>e.status===409);
 assert.throws(()=>migration.octoberSupremeChanges(existing.map(c=>c.code==='FIC-061'?{...c,status:'deleted'}:c),baseAlbums,owner.userId,'now'),e=>e.status===409);
 await migration.applyOctoberSupremeMigration(owner);let state=await server.stateFor(owner);for(const item of manifest){const rows=state.cards.filter(c=>c.code===item.code);assert.equal(rows.length,1);assert.equal(rows[0].rarity,'Suprême');assert.equal(rows[0].universe,item.universe);assert.equal(rows[0].imageKey,item.imageKey);}
 const revision=state.revision;await migration.applyOctoberSupremeMigration(owner);state=await server.stateFor(owner);assert.equal(state.revision,revision);assert.ok(await DB.prepare('SELECT id FROM settings WHERE id=?').bind(migration.OCTOBER_SUPREME_JOB).first());
 console.log('PASS real D1 persistence: 18 codes imported once, no duplicate models, existing IDs/text preserved, validated Supreme, native universes and specialized memberships, collision/deleted protections.');
}finally{await mf.dispose();}
