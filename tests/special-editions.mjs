import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
await import('./archive-supremes.mjs');
const out=path.resolve('.sites-runtime/archive-supreme-tests');
const {archiveSupremeDesign}=await import(path.join(out,'components/archive-supreme-card.mjs'));
const {default:CardVisual}=await import(path.join(out,'components/card-visual.mjs'));
const manifest=JSON.parse(await fs.readFile('app/content/special-edition-import.json','utf8'));
const registry=JSON.parse(await fs.readFile('app/content/special-edition-designs.json','utf8'));
assert.equal(manifest.length,21);assert.equal(Object.keys(registry).length,21);
assert.equal(new Set(manifest.map(x=>x.code)).size,21);assert.equal(new Set(Object.values(registry).map(x=>x.sourceHash)).size,21);
const cards=manifest.map(item=>({...item,id:item.code,code:item.editionCode,universe:'Editions spéciales',editionSubjectUniverse:item.universe,rarity:'Editions spéciales',rarityStatus:'validated',rarityProposal:null,albumIds:['editions-speciales'],status:'ready'}));
for(const card of cards){
 assert.ok(archiveSupremeDesign(card));assert.equal(archiveSupremeDesign({...card,rarity:'Suprême'}),undefined);
 const html=renderToStaticMarkup(React.createElement(CardVisual,{card}));
 assert.ok(html.includes('data-rarity="Editions spéciales"'));assert.ok(html.includes(`data-design-model="${card.code}"`));assert.ok(html.includes('viewBox="0 0 630 972"'));assert.ok(html.includes('foreignObject'));assert.ok(html.includes('aspect-ratio:630 / 972'));
 assert.ok(!/<script|<iframe|\bon\w+=/i.test(html));
 for(const ref of new Set((registry[card.code].html).match(/\/designs\/[^\s"')<>]+/g)))await fs.access('public'+ref);
}
const all=renderToStaticMarkup(React.createElement('div',null,...[0,1].flatMap(copy=>cards.map(card=>React.createElement(CardVisual,{card,key:copy+card.id})))));
const ids=[...all.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const ref of all.matchAll(/url\(#([^)]+)\)/g))assert.ok(ids.includes(ref[1]));
for(const file of ['album-membership','config/event','config/boosters']){
 const source=(await fs.readFile('app/'+file+'.ts','utf8')).replace(/from (['"])(\.[^'"]+)\1/g,(m,q,ref)=>`from ${q}${ref}.mjs${q}`);
 const dest=path.join(out,file+'.mjs');await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
}
const {albumContains,albumAccepts}=await import(path.join(out,'album-membership.mjs'));
const album={id:'editions-speciales',name:'Editions spéciales',universe:'Editions spéciales',kind:'general'};
for(const card of cards){assert.ok(albumContains(card,album));assert.ok(albumAccepts(card,album));assert.ok(albumContains(card,{id:'subject',kind:'general',universe:'Editions spéciales'}));}
assert.equal(albumContains({...cards[0],universe:'NBA'},album),false);assert.equal(albumAccepts({...cards[0],universe:'NBA'},album),false);
const {BOOSTER_POLICY}=await import(path.join(out,'config/boosters.mjs'));
const expected=[[52100,28000,13000,5000,1850,50],[52100,28000,13000,5000,1850,50],[49000,28000,14000,6400,2500,100],[42000,28000,17000,9000,3800,200],[75000,20000,4000,900,95,5],[47800,28000,15000,6500,2550,150]];
for(const [i,b] of BOOSTER_POLICY.boosters.entries()){assert.equal(b.rates.length,7);assert.deepEqual(b.rates.slice(0,6),expected[i].map((v,j)=>j===0?v-1000:v));assert.equal(b.rates[6],1000);assert.equal(b.rates.reduce((a,b)=>a+b),100000);}
console.log('PASS 21 special editions: unique original models, correct rarity gates, responsive original artwork, unique SVG ids, valid assets, cross-universe album membership, Halloween 1% rates normalized; non-common ordinary rates unchanged.');
