import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {createHash} from 'node:crypto';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const out=path.resolve('.sites-runtime/card-redesign');await fs.mkdir(out,{recursive:true});
for(const name of ['components/napoleon-card','components/mossad-card','components/louis-card','components/cesar-card','components/france-card','components/cia-card','components/chine-card','components/charlemagne-card','components/nectaire-card','components/roquefort-card','components/everest-card','components/marie-card','components/reef-card','components/comte-card','components/camembert-card','components/spitfire-card','components/blackbird-card','components/stuka-card','components/rafale-card','components/concorde-card','components/b747-card','components/a380-card','components/template-card-back','components/legendary-card-face','components/uncommon-card-face','components/common-card-face','components/card-summary','components/precious-card-face','components/rare-card-face','components/card-face','components/card-layout','model','config/rarities','import-format']){
 let s=await fs.readFile('app/'+name+'.tsx','utf8').catch(()=>fs.readFile('app/'+name+'.ts','utf8'));
 s=s.replace("import design from '../content/everest-design.json';",`const design=${await fs.readFile('app/content/everest-design.json','utf8')};`);
 s=s.replace("import recent from '../content/recent-card-mini-descriptions.json';",`const recent=${await fs.readFile('app/content/recent-card-mini-descriptions.json','utf8')};`);
 s=s.replace("import history from '../content/history-mini-descriptions.json';",`const history=${await fs.readFile('app/content/history-mini-descriptions.json','utf8')};`);
 s=s.replace("import geopolitics from '../content/geopolitics-mini-descriptions.json';",`const geopolitics=${await fs.readFile('app/content/geopolitics-mini-descriptions.json','utf8')};`);
 s=s.replace("import military from '../content/military-mini-descriptions.json';",`const military=${await fs.readFile('app/content/military-mini-descriptions.json','utf8')};`);
 s=s.replace("import fiction from '../content/fiction-mini-descriptions.json';",`const fiction=${await fs.readFile('app/content/fiction-mini-descriptions.json','utf8')};`);
 s=s.replace("import nba from '../content/nba-mini-descriptions.json';",`const nba=${await fs.readFile('app/content/nba-mini-descriptions.json','utf8')};`);
 s=s.replace("import catholic from '../content/catholic-mini-descriptions.json';",`const catholic=${await fs.readFile('app/content/catholic-mini-descriptions.json','utf8')};`);
 s=s.replace(/from (['"])(\.[^'"]+)\1/g,(m,q,ref)=>`from ${q}${ref+'.mjs'}${q}`);
 const dest=path.join(out,name+'.mjs');await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText);
}
const {default:CardFace}=await import(path.join(out,'components/card-face.mjs'));
const {cardTitle,cardDescription,CARD_FONT,BACK_TEXT_AREA}=await import(path.join(out,'components/card-layout.mjs'));
const {RARITIES}=await import(path.join(out,'config/rarities.mjs'));
const base={id:'qa',code:'AVI-999',name:'Concorde',universe:'Aviation',category:'Avion de ligne supersonique',description:'Avion de ligne supersonique franco-britannique, le Concorde reliait les continents à plus de deux fois la vitesse du son.',rarityStatus:'validated',rarityProposal:null,imageKey:'image.jpg',imageCredit:'Auteur · CC BY-SA 4.0 · Wikimedia Commons'};
const require=createRequire(import.meta.url),wr=createRequire(require.resolve('wrangler/package.json')),mr=createRequire(wr.resolve('miniflare')),sharp=mr('sharp');
const photo='data:image/jpeg;base64,'+(await fs.readFile('.sites-runtime/concorde.jpg')).toString('base64');
const template='data:image/png;base64,'+(await fs.readFile('public/templates/rare-v1.png')).toString('base64');
assert.equal(createHash('sha256').update(await fs.readFile('public/templates/rare-v1.png')).digest('hex'),'46ce0d4a07aee390b6c1a4df6eec42c8026d939452398ea19515bf489330be36');
const {rareCardTitle,RARE_PHOTO}=await import(path.join(out,'components/rare-card-face.mjs'));assert.deepEqual(RARE_PHOTO,{x:30,y:61,width:570,height:674});for(const s of ['Titre très long '.repeat(10),'W'.repeat(140)])assert.ok(rareCardTitle(s).lines.length<=2);const {cardSummary}=await import(path.join(out,'components/card-summary.mjs'));const checkSummary=c=>{const s=cardSummary(c),n=s.split(/\s+/).length;assert.ok(n>=5&&n<=8,JSON.stringify({name:c.name,category:c.category,s,n}));};
assert.equal(createHash('sha256').update(await fs.readFile('public/templates/precious-v1.png')).digest('hex'),'591047eac934c7120d5a4fcc5d67d9cac578e061bc6a9828814fb84f355257d0');
const preciousTemplate='data:image/png;base64,'+(await fs.readFile('public/templates/precious-v1.png')).toString('base64');
const commonTemplate='data:image/png;base64,'+(await fs.readFile('public/templates/common-v1.png')).toString('base64');
assert.equal(createHash('sha256').update(await fs.readFile('public/templates/common-v1.png')).digest('hex'),'69aef3a570cd6765a3510fb537139f4d4ab97e97f3fcb1693308b5bc4fc378a9');
const uncommonTemplate='data:image/png;base64,'+(await fs.readFile('public/templates/uncommon-v1.png')).toString('base64');
assert.equal(createHash('sha256').update(await fs.readFile('public/templates/uncommon-v1.png')).digest('hex'),'f9d011dbd54502a3fa7df78ab8626f8c76d1facd876c1b3be3eea70818031195');
const legendaryTemplate='data:image/png;base64,'+(await fs.readFile('public/templates/legendary-v1.png')).toString('base64');
assert.equal(createHash('sha256').update(await fs.readFile('public/templates/legendary-v1.png')).digest('hex'),'e2ebef18b2d6b933f84ccb3d971ffd511c45d46d227ed90499d11c3b3074db21');
const composites=[];
for(const [i,rarity]of RARITIES.entries())for(const [j,side]of ['front','back'].entries()){
 const card={...base,rarity},before=JSON.stringify(card);const svg=renderToStaticMarkup(React.createElement(CardFace,{card,imageHref:photo,side}));assert.equal(JSON.stringify(card),before);assert.ok(svg.includes('SF Pro'));assert.ok(svg.includes('ATLAS'));assert.ok(svg.includes(side==='front'&&rarity==='Courante'?'COMMUNE':side==='front'&&rarity==='Inhabituelle'?'INHABITUEL':rarity.toLocaleUpperCase('fr')));
 if(side==='back'&&rarity!=='Suprême')assert.ok(svg.includes('data-back-recto-artwork'));
 if(side==='back'&&['Légendaire','Inhabituelle','Courante','Rare','Précieuse'].includes(rarity))assert.ok(svg.includes('0 0 360 555.4285714285714'));
 if(side==='front'){checkSummary(card);assert.ok(svg.includes('data-card-summary'));}
 if(side==='front'&&rarity==='Légendaire'){assert.ok(svg.includes('data-layout="legendary-template"'));assert.ok(svg.includes('xMidYMid slice'));assert.ok(svg.includes('data-original-template'));}else if(side==='front'&&rarity==='Inhabituelle'){assert.ok(svg.includes('data-layout="uncommon-template"'));assert.ok(svg.includes('xMidYMid slice'));assert.ok(svg.includes('data-original-template'));}else if(side==='front'&&rarity==='Courante'){assert.ok(svg.includes('data-layout="common-template"'));assert.ok(svg.includes('xMidYMid slice'));assert.ok(svg.includes('data-original-template'));}else if(side==='front'&&rarity==='Précieuse'){assert.ok(svg.includes('data-layout="precious-template"'));assert.ok(svg.includes('xMidYMid slice'));assert.ok(svg.includes('data-original-template'));}else if(side==='front'&&rarity==='Rare'){assert.ok(svg.includes('data-layout="rare-template"'));assert.ok(svg.includes('viewBox="0 0 630 972"'));assert.ok(svg.includes('xMidYMid slice'));assert.ok(svg.includes('data-original-template'));}else if(side==='front'){
  assert.ok(!svg.includes('data-card-description'));assert.ok(svg.includes('font-weight="750"'));
  assert.ok(svg.includes(`data-photo-format="${['Légendaire','Suprême'].includes(rarity)?'vertical':'landscape'}"`));
  assert.equal(svg.includes('data-name-panel'),rarity!=='Suprême');const name=svg.match(/<text data-card-name[^>]*>(.*?)<\/text>/s)?.[1];assert.ok(name);assert.ok((name.match(/<tspan/g)||[]).length<=2);
 }else{assert.ok(svg.includes('data-card-description'));assert.ok(svg.includes(base.description));assert.ok(!svg.includes('data-main-photo'));assert.ok(!svg.includes(base.imageCredit));assert.ok(svg.includes('data-back-text-area'));assert.ok(Math.abs(BACK_TEXT_AREA.width*BACK_TEXT_AREA.height/(360*504)-.8)<.005);}
 composites.push({input:await sharp(Buffer.from(svg.replaceAll('href="/templates/legendary-v1.png"','href="'+legendaryTemplate+'"').replaceAll('href="/templates/uncommon-v1.png"','href="'+uncommonTemplate+'"').replaceAll('href="/templates/common-v1.png"','href="'+commonTemplate+'"').replaceAll('href="/templates/rare-v1.png"','href="'+template+'"').replaceAll('href="/templates/precious-v1.png"','href="'+preciousTemplate+'"'))).resize({width:240}).png().toBuffer(),left:i*250,top:j*390});
}
for(const s of ['Saint Zacharie, père de Jean-Baptiste','Cathédrale de Saint-Jacques-de-Compostelle','W'.repeat(140),'Un titre très long '.repeat(7)])assert.ok(cardTitle(s).lines.length<=2);
for(const s of ['W'.repeat(700),'Texte complet lisible et conservé. '.repeat(20).slice(0,700)]){const d=cardDescription(s);assert.ok((d.lines.length-1)*d.size*1.48<=BACK_TEXT_AREA.textHeight);assert.equal(d.lines.join('').replaceAll(' ',''),s.replaceAll(' ',''));}
assert.ok(CARD_FONT.includes('-apple-system'));
const {parseCardImport}=await import(path.join(out,'import-format.mjs'));const imported={...base,code:'AVI-999',rarity:null,rarityStatus:'pending',albumIds:[],imageFit:'contain'};assert.equal(parseCardImport(JSON.stringify([imported]),[],[])[0].imageFit,'contain');assert.throws(()=>parseCardImport(JSON.stringify([{...imported,imageFit:'stretch'}]),[],[]),/Cadrage/);
const whole=renderToStaticMarkup(React.createElement(CardFace,{card:{...base,rarity:'Suprême',imageFit:'contain'},imageHref:photo}));assert.ok(whole.includes('xMidYMid meet'));

await sharp({create:{width:1500,height:761,channels:4,background:'#edf0e9'}}).composite(composites).png().toFile(path.join(out,'six-rarities-recto-verso.png'));
// Check real catalogue names and descriptions against the shared text layout.
let count=0;for(const file of ['history-import','catholic-import','geography-import','cheeses-completion','cheeses-initial','aviation-completion']){
 const data=JSON.parse(await fs.readFile('app/content/'+file+'.json','utf8'));const cards=Array.isArray(data)?data:data.cards||[];
 for(const c of cards){if(!c.name)continue;checkSummary({...c,universe:c.universe|| (file==='history-import'?'Histoire':file.startsWith('cheeses')?'Fromages':'Aviation')});assert.ok(cardTitle(c.name).lines.length<=2);const d=cardDescription(c.description||'');assert.ok((d.lines.length-1)*d.size*1.48<=BACK_TEXT_AREA.textHeight);count++;}
}
const {SEEDED}=await import(path.join(out,'model.mjs'));for(const [,name]of SEEDED){checkSummary({name,category:'',universe:'Aviation'});assert.ok(cardTitle(name).lines.length<=2);count++;}
console.log(`PASS six rectos, six versos, bold two-line titles, full descriptions, San Francisco stack, immutable records, ${count} catalogue models, long-text bounds.`);
