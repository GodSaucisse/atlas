import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
await import('./archive-supremes.mjs');
const manifest=JSON.parse(await fs.readFile('app/content/remaining-supreme-import.json','utf8')),designs=JSON.parse(await fs.readFile('app/content/remaining-supreme-designs.json','utf8')),css=await fs.readFile('app/components/remaining-supreme-card.css','utf8');
assert.equal(manifest.length,10);assert.equal(manifest.filter(c=>c.rarity==='Suprême').length,9);assert.equal(manifest.filter(c=>c.rarity==='Editions spéciales').length,1);
for(const item of manifest){const d=designs[item.code];assert.equal(d.universe,item.universe);assert.equal(d.rarity,item.rarity);assert.ok(!/<script|<iframe|\bon\w+=|javascript:|data:image/i.test(d.html));assert.ok(/^[a-f\d-]{36}\.(png|jpg|webp|gif)$/.test(item.imageKey));assert.equal(item.sourceSha256.length,64);}
for(const ref of new Set((css+Object.values(designs).map(d=>d.html).join('')).match(/\/designs\/[^\s"')<>]+/g)))await fs.access('public'+ref);
assert.ok(!/body\s*\{|:hover|data:image|https?:/.test(css));
const {default:CardVisual}=await import(path.resolve('.sites-runtime/archive-supreme-tests/components/card-visual.mjs'));
const {archiveSupremeDesign}=await import(path.resolve('.sites-runtime/archive-supreme-tests/components/archive-supreme-card.mjs'));
const cards=manifest.map(c=>({...c,id:c.code,rarityStatus:'validated',rarityProposal:null,albumIds:[],status:'ready'}));
const markup=renderToStaticMarkup(React.createElement('div',null,...cards.flatMap(card=>[0,1].map(copy=>React.createElement(CardVisual,{key:card.code+copy,card})))));
for(const card of cards){assert.ok(markup.includes(`data-design-model="${card.code}"`));assert.ok(markup.includes(`data-layout="${designs[card.code].slug}-supreme"`));assert.equal(archiveSupremeDesign({...card,rarity:card.rarity==='Suprême'?'Editions spéciales':'Suprême'}),undefined);assert.equal(archiveSupremeDesign({...card,universe:'Wrong'}),undefined);}
const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const m of markup.matchAll(/url\(#([^)]+)\)/g))assert.ok(ids.includes(m[1]));
const edition=manifest.find(c=>c.rarity==='Editions spéciales');assert.equal(edition.universe,'Editions spéciales');assert.equal(edition.editionSubjectUniverse,'NBA');assert.deepEqual(edition.albumNames,['Champion Edition']);
console.log('PASS 10 exact native card templates, local assets, scoped CSS, sanitized markup, unique instance SVG IDs, separate Supreme/edition rarity and universe gating.');
