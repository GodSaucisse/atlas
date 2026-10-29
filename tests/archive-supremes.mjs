import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const out=path.resolve('.sites-runtime/archive-supreme-tests'),seen=new Set();
async function compile(name){
 if(seen.has(name))return;seen.add(name);
 const file=await fs.access('app/'+name+'.tsx').then(()=>name+'.tsx').catch(()=>name+'.ts');
 let source=await fs.readFile('app/'+file,'utf8');
 for(const m of [...source.matchAll(/import (\w+) from ['"]([^'"]+\.json)['"];?/g)])source=source.replace(m[0],`const ${m[1]}=${await fs.readFile(path.resolve('app',path.dirname(name),m[2]),'utf8')};`);
 for(const m of [...source.matchAll(/from ['"]([^'"]+)['"]/g)])if(m[1].startsWith('.'))await compile(path.posix.normalize(path.posix.join(path.posix.dirname(name),m[1])));
 source=source.replace(/from (['"])(\.[^'"]+)\1/g,(m,q,ref)=>`from ${q}${ref}.mjs${q}`);
 const dest=path.join(out,name+'.mjs');await fs.mkdir(path.dirname(dest),{recursive:true});
 await fs.writeFile(dest,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText);
}
await compile('components/card-visual');
const {default:CardVisual}=await import(path.join(out,'components/card-visual.mjs'));
const {default:CardFace}=await import(path.join(out,'components/card-face.mjs'));
const {archiveSupremeDesign}=await import(path.join(out,'components/archive-supreme-card.mjs'));
const designs=JSON.parse(await fs.readFile('app/content/archive-supreme-designs.json','utf8'));
assert.equal(Object.keys(designs).length,12);
for(const [code,design] of Object.entries(designs)){
 const card={id:code,code,name:design.slug,universe:design.universe,category:'Catégorie',description:'Une description conservée pour apprendre.',rarity:'Suprême',rarityStatus:'validated',rarityProposal:null,imageKey:'original.jpg',imageCredit:'Crédit original',albumIds:[],status:'ready'};
 const before=JSON.stringify(card);
 assert.ok(archiveSupremeDesign(card));
 for(const patch of [{code:'OTHER'},{universe:'Plats'},{rarity:'Rare'}])assert.equal(archiveSupremeDesign({...card,...patch}),undefined);
 const front=renderToStaticMarkup(React.createElement(CardVisual,{card}));
 const back=renderToStaticMarkup(React.createElement(CardFace,{card,side:'back'}));
 assert.ok(front.includes(`data-layout="${design.slug}-supreme"`));assert.ok(front.includes(`data-design-model="${code}"`));
 assert.ok(front.includes(`/designs/${design.slug}/`));assert.ok(front.includes('viewBox="0 0 630 972"'));assert.ok(front.includes('foreignObject'));assert.ok(back.includes('data-card-description="true"'));assert.ok(back.includes(card.description));
 assert.equal(JSON.stringify(card),before);assert.ok(!/<script|<iframe|\bon\w+=/i.test(front));
}
const css=await fs.readFile('app/components/archive-supreme-card.css','utf8');
const markup=Object.values(designs).map(d=>d.html).join('\n');
for(const ref of new Set((css+markup).match(/\/designs\/[^\s"')<>]+/g)))await fs.access('public'+ref);
assert.ok(css.includes('prefers-reduced-motion'));assert.ok(css.includes('data-motion="off"'));assert.ok(css.includes('var(--supreme-pointer-x'));
assert.ok(!css.includes('./assets/'));
const repeated=renderToStaticMarkup(React.createElement('div',null,...[0,1].flatMap(copy=>Object.entries(designs).map(([code,d])=>React.createElement(CardFace,{key:copy+code,card:{id:code,code,name:d.slug,universe:d.universe,rarity:'Suprême',rarityStatus:'validated',category:'Catégorie',description:'Description'}})))));
const ids=[...repeated.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'SVG definitions must be unique for every instance');for(const ref of repeated.matchAll(/url\(#([^)]+)\)/g))assert.ok(ids.includes(ref[1]),'SVG reference must resolve locally');
assert.ok(css.includes('box-sizing:content-box'));assert.ok(css.includes('line-height:normal'));
console.log('PASS 12 original Suprême designs, correct model/universe/rarity gating, immutable records, preserved backs, sanitized markup, image references and accessibility controls.');
