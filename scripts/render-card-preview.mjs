// Render the actual SVG card component, without a browser or a second visual template.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const wr=createRequire(require.resolve('wrangler/package.json'));
const mf=createRequire(wr.resolve('miniflare'));
const sharp=mf('sharp');
const temp=path.resolve('.sites-runtime/card-preview');await fs.mkdir(temp,{recursive:true});
for(const [source,dest] of [['app/config/rarities.ts','config/rarities.mjs'],['app/config/card-interaction.ts','config/card-interaction.mjs'],['app/components/card-visual.tsx','card-visual.mjs'],['app/components/finish-studio.tsx','finish-studio.mjs'],['app/config/boosters.ts','config/boosters.mjs'],['app/model.ts','model.mjs'],['app/components/card-face.tsx','card-face.mjs'],['app/components/rarity-badge.tsx','rarity-badge.mjs'],['app/components/booster-rules.tsx','booster-rules.mjs'],['app/components/rarity-manager.tsx','rarity-manager.mjs']]){
 let text=(await fs.readFile(source,'utf8')).replaceAll("from '../model'","from './model'").replaceAll("from '../config/","from './config/");
 text=text.replace(/from (['"])(\.[^'"]+)\1/g,(match,q,ref)=>`from ${q}${ref.endsWith('.mjs')?ref:ref+'.mjs'}${q}`);
 const target=path.join(temp,dest);await fs.mkdir(path.dirname(target),{recursive:true});
 await fs.writeFile(target,ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText);
}
const {default:CardFace}=await import(path.join(temp,'card-face.mjs'));
const card={...JSON.parse(await fs.readFile(path.join(temp,'concorde.json'),'utf8')),rarityStatus:'validated'};
const photo=JSON.parse(await fs.readFile('app/content/concorde-image.json','utf8'));
const imageHref=`data:${photo.mime};base64,${photo.base64}`;
await fs.mkdir('outputs',{recursive:true});
const svg=renderToStaticMarkup(React.createElement(CardFace,{card,imageHref}));
await fs.writeFile('outputs/concorde-design.svg',svg);
await sharp(Buffer.from(svg),{density:144}).png().toFile('outputs/concorde-design.png');
const rarities=['Courante','Inhabituelle','Rare','Précieuse','Légendaire','Suprême'];
const previews=await Promise.all(rarities.map(async(rarity,i)=>({input:await sharp(Buffer.from(renderToStaticMarkup(React.createElement(CardFace,{card:{...card,rarity},imageHref})))).resize(240,336).png().toBuffer(),left:24+i*260,top:24})));
await sharp({create:{width:1588,height:384,channels:4,background:'#e7ece5'}}).composite(previews).png().toFile('outputs/rarity-designs.png');
console.log('Rendered actual component: outputs/concorde-design.png and outputs/rarity-designs.png');

const {default:Manager}=await import(path.join(temp,'rarity-manager.mjs'));
const {BOOSTER_POLICY}=await import(path.join(temp,'config/boosters.mjs'));
const {EMPTY_RARITY,SEEDED,UNIVERSES}=await import(path.join(temp,'model.mjs'));
const cards=SEEDED.map(([code,name,rarity])=>({...EMPTY_RARITY,...card,id:code,code,name,rarity,rarityStatus:'validated',imageKey:code===card.code?card.imageKey:''}));
for(const role of ['owner','editor']){
 const state={cards,albums:[],admins:[],logs:[],revision:1,motion:'system',boosterPolicy:BOOSTER_POLICY,user:{id:'qa',name:'QA',email:'qa@atlas.test',role}};
 const html=renderToStaticMarkup(React.createElement(Manager,{state,busy:false,onSave:async()=>true,onOpen:()=>{},onHistory:()=>{},onRefresh:()=>{},onDirty:()=>{}}));
 await fs.writeFile(`outputs/rarity-manager-${role}.html`,html);
 const buttons=[...html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)].map(m=>m[1].replace(/<[^>]*>/g,''));
 if(role==='owner'&&!buttons.some(t=>t.startsWith('Valider')))throw new Error('Principal missing validation controls');
 if(role==='editor'&&buttons.some(t=>t.startsWith('Valider')))throw new Error('Editor exposed validation control');
 const choices=[...html.matchAll(/<select[^>]*aria-label="Rareté proposée pour[^>]*>([\s\S]*?)<\/select>/g)];
 if(choices.length!==12||choices.some(c=>[...c[1].matchAll(/<option/g)].length!==7))throw new Error('Rarity selectors must contain six choices plus the unset placeholder');
 console.log(`Verified ${role} management markup: ${choices.length} six-rarity selectors, correct role controls`);
}

// Production components, frozen catalogue fixture: the finish studio must remain read-only.
const {default:Studio}=await import(path.join(temp,'finish-studio.mjs'));
const frozenCard=Object.freeze({...card,albumIds:Object.freeze([...card.albumIds])});
const before=JSON.stringify(frozenCard);
const studio=renderToStaticMarkup(React.createElement(Studio,{cards:Object.freeze([frozenCard])}));
await fs.writeFile('outputs/finish-studio.html',studio);
if([...studio.matchAll(/class="atlas-card /g)].length!==6)throw Error('Studio must render the six finishes');
for(const label of ['Fixe','Animé','Au survol','Mobile','Grand format'])if(!studio.includes(label))throw Error(`Missing preview mode ${label}`);
if(studio.includes('<form')||before!==JSON.stringify(frozenCard))throw Error('Studio must not mutate catalogue data');
const ids=[...studio.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);if(new Set(ids).size!==ids.length)throw Error('Duplicate SVG IDs across the six live cards');
const {cardLightPosition}=await import(path.join(temp,'config/card-interaction.mjs'));
for(const [x,y,w,h,rx,ry] of [[180,252,360,504,0,0],[0,0,360,504,5,-7],[360,504,360,504,-5,7],[-99,900,360,504,-5,-7]]){const p=cardLightPosition(x,y,w,h);if(p.rotateX!==rx||p.rotateY!==ry)throw Error('Incorrect pointer geometry');}
console.log('Verified finish studio: six independent SVGs, five preview modes, frozen catalogue unchanged, bounded pointer geometry');
