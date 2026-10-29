import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
await import('./progression.mjs');
const {remainingSupremeChanges:changes}=await import(path.resolve('.sites-runtime/progression-tests/remaining-supreme-migration.mjs'));
const manifest=JSON.parse(await fs.readFile('app/content/remaining-supreme-import.json','utf8'));
const album=(id,universe,kind='general',name=id)=>({id,universe,kind,name,status:'active',description:'',updatedAt:'old'});
const albums=[album('editions-speciales','Editions spéciales'),album('halloween','Editions spéciales','specialized','Halloween'),album('fighter','Aviation','specialized','Avions de chasse'),album('military','Militaire'),album('nba','NBA'),album('cath','Chrétienté'),album('fic','Personnages fictifs')];
const cards=manifest.filter(c=>c.rarity==='Suprême').map(c=>({...c,id:'stable-'+c.code,description:'KEEP TEXT',learningText:'KEEP HISTORY',status:'ready',albumIds:[]}));
cards.push({id:'old-edition',code:'EDS-008',name:'Mirage',rarity:'Editions spéciales',universe:'Editions spéciales',editionSubjectUniverse:'Aviation',status:'ready',albumIds:['editions-speciales','fighter'],imageKey:'KEEP TEMPLATE'});
const result=changes(cards,albums,'qa','now');
for(const item of manifest.filter(c=>c.rarity==='Suprême')){const c=result.cards.find(c=>c.code===item.code);assert.equal(c.id,'stable-'+item.code);assert.equal(c.description,'KEEP TEXT');assert.equal(c.learningText,'KEEP HISTORY');assert.equal(c.rarity,'Suprême');assert.equal(c.universe,item.universe);assert.equal(c.imageKey,item.imageKey);if(item.code==='CAT-007')assert.equal(c.name,'Saint Paul de Tarse');}
const towns=result.cards.find(c=>c.code==='EDS-027');assert.equal(towns.rarity,'Editions spéciales');assert.equal(towns.universe,'Editions spéciales');assert.deepEqual(towns.albumIds,['editions-speciales','editions-speciales-champion']);
const mirage=result.cards.find(c=>c.code==='EDS-008');assert.equal(mirage.imageKey,'KEEP TEMPLATE');assert.deepEqual(mirage.albumIds,['editions-speciales','halloween']);assert.equal(mirage.editionSubjectUniverse,undefined);
assert.throws(()=>changes([{...cards[0],name:'collision'},...cards.slice(1)],albums,'qa','now'),e=>e.status===409);
const again=changes([...cards.filter(c=>!result.cards.some(n=>n.id===c.id)),...result.cards],[...albums,...result.albums],'qa','again');assert.equal(again.cards.filter(c=>c.code==='EDS-027').length,1);assert.equal(again.cards.find(c=>c.code==='EDS-027').id,towns.id);
console.log('PASS nine existing stable Supreme identities/text, exact assets, one distinct Champion Edition, exclusive edition albums, old Halloween membership repaired, collision protection and repeat safety.');

const preexisting=album('existing-champion','Editions spéciales','specialized','Champion'),duplicate=album('editions-speciales-champion','Editions spéciales','specialized','Champion Edition');
const merged=changes([...cards,towns],[...albums,preexisting,duplicate],'qa','now');assert.deepEqual(merged.cards.find(c=>c.code==='EDS-027').albumIds,['editions-speciales','existing-champion']);assert.equal(merged.albums.find(a=>a.id===duplicate.id).status,'deleted');assert.equal(merged.albums.find(a=>a.id===preexisting.id).name,'Champion');
