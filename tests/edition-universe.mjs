import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
await import('./special-editions.mjs');
await import('./special-editions-catalog.mjs');
const root=path.resolve('.sites-runtime/special-edition-catalog');
const {editionUniverseChanges}=await import(path.join(root,'edition-universe-migration.mjs'));
const {albumAccepts,albumContains,scopedAlbumEntries,relatedSpecializedAlbums}=await import(path.join(root,'album-membership.mjs'));
const editions=JSON.parse(await fs.readFile('app/content/special-edition-import.json','utf8'));
const models=JSON.parse(await fs.readFile('app/content/nba-supreme-import.json','utf8'));
const designs=JSON.parse(await fs.readFile('app/content/nba-supreme-designs.json','utf8'));
const specialDesigns=JSON.parse(await fs.readFile('app/content/special-edition-designs.json','utf8'));
const {archiveSupremeDesign}=await import(path.resolve('.sites-runtime/archive-supreme-tests/components/archive-supreme-card.mjs'));
const {default:CardVisual}=await import(path.resolve('.sites-runtime/archive-supreme-tests/components/card-visual.mjs'));
const albums=[{id:'editions-speciales',universe:'Editions spéciales',name:'Editions spéciales',kind:'general',status:'active'},...['NBA','Histoire','Aviation','Chrétienté'].map(universe=>({id:universe,name:universe,universe,kind:'general',status:'active'})),...['Meneurs','Arrières','Ailiers','Ailiers forts','Pivots','Joueurs actuels NBA','Anciens joueurs NBA','Équipes NBA'].map((name,i)=>({id:'nba-sub-'+i,name,universe:'NBA',kind:'specialized',status:'active'})),{id:'antique',name:'Antiquité',universe:'Histoire',kind:'specialized',status:'active'}];
const originalEditions=editions.map(item=>({...item,id:item.code,rarity:'Editions spéciales',rarityStatus:'validated',learningText:'Texte existant à conserver '+item.code,status:'ready',albumIds:['editions-speciales',item.universe]}));
const originalNBA=models.map((item,i)=>({...item,id:'stable-nba-'+i,universe:'NBA',rarity:'Légendaire',rarityStatus:'validated',learningText:'Texte personnalisé '+i,description:'Description personnalisée '+i,imageKey:'unchanged-image-'+i,albumIds:['NBA'],status:'ready'}));
const records=[...originalEditions,...originalNBA];const frozen=JSON.stringify(records);
const change=editionUniverseChanges(records,albums,'owner','2026-10-27T20:00:00Z');assert.equal(JSON.stringify(records),frozen);
assert.equal(change.cards.length,32);assert.equal(new Set(change.cards.map(c=>c.code)).size,32);assert.equal(new Set(change.cards.map(c=>c.id)).size,32);
for(const old of originalEditions){
 const c=change.cards.find(c=>c.id===old.id);assert.ok(c);assert.equal(c.universe,'Editions spéciales');assert.equal(c.code,old.editionCode);assert.equal(c.rarity,old.rarity);assert.equal(c.name,old.name);assert.equal(c.imageKey,old.imageKey);assert.equal(c.learningText,old.learningText);assert.equal(c.description,old.description);assert.equal(c.editionSubjectUniverse,old.universe);assert.ok(c.albumIds.includes('editions-speciales'));assert.ok(!c.albumIds.includes(old.universe));assert.ok(archiveSupremeDesign(c));
}
for(const old of originalNBA){
 const c=change.cards.find(c=>c.id===old.id);assert.ok(c);assert.equal(c.rarity,'Suprême');assert.equal(c.universe,'NBA');assert.equal(c.imageKey,old.imageKey);assert.equal(c.learningText,old.learningText);assert.equal(c.description,old.description);assert.equal(c.code,old.code);assert.equal(c.rarityStatus,'validated');assert.ok(!c.albumIds.includes('editions-speciales'));
 const design=archiveSupremeDesign(c);assert.ok(design);assert.equal(design.html,specialDesigns[editions.find(e=>e.code===old.sourceEditionId).editionCode].html);assert.equal(design.sourceHash,specialDesigns[editions.find(e=>e.code===old.sourceEditionId).editionCode].sourceHash);
 assert.equal(archiveSupremeDesign({...c,rarity:'Editions spéciales'}),undefined);
 const markup=renderToStaticMarkup(React.createElement(CardVisual,{card:c}));assert.ok(markup.includes('viewBox="0 0 630 972"'));assert.ok(markup.includes(`data-design-model="${c.code}"`));
}
assert.equal(Object.keys(designs).length,11);for(const excluded of ['NBA-003','CAT-006','ESP-011','EDS-011'])assert.equal(designs[excluded],undefined);
const pivots=albums.find(a=>a.name==='Pivots'),special=albums[0],nba=albums.find(a=>a.id==='NBA');
assert.equal(relatedSpecializedAlbums(albums,change.cards,special.id).some(a=>a.id===pivots.id),false);
const edPivot=scopedAlbumEntries(change.cards,pivots,special),nbaPivot=scopedAlbumEntries(change.cards,pivots,nba);
assert.ok(edPivot.length);assert.ok(nbaPivot.length);assert.ok(edPivot.every(c=>c.universe==='Editions spéciales'));assert.ok(nbaPivot.every(c=>c.universe==='NBA'));
assert.equal(scopedAlbumEntries(change.cards,special).length,21);assert.equal(scopedAlbumEntries(change.cards,nba).length,11);
assert.ok(albumAccepts(edPivot[0],pivots));assert.equal(albumAccepts(edPivot[0],nba),false);assert.equal(albumAccepts(nbaPivot[0],special),false);
const conflict=[...records,{...originalNBA[0],id:'collision',code:'EDS-001'}];assert.throws(()=>editionUniverseChanges(conflict,albums,'owner','now'),e=>e.status===409);assert.equal(JSON.stringify(records),frozen);
const repeated=renderToStaticMarkup(React.createElement('div',null,...change.cards.map(c=>React.createElement(CardVisual,{card:c,key:c.id}))));const ids=[...repeated.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const ref of repeated.matchAll(/url\(#([^)]+)\)/g))assert.ok(ids.includes(ref[1]));
console.log('PASS edition universe migration: 21 unchanged designs and stable owned IDs; 11 exact NBA Supremes, no extra models; correct scoped specialized albums; collision protection; unique SVG IDs across both editions and ordinary Supremes.');
