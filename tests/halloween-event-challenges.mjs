import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
await import('./progression.mjs');
const root=path.resolve('.sites-runtime/progression-tests');
const P=await import(path.join(root,'progression.mjs')),E=await import(path.join(root,'test-game-engine.mjs')),B=await import(path.join(root,'config/boosters.mjs'));
const card=(id,rarity,universe='Aviation',albumIds=[])=>({id,code:id,name:id,rarity,universe,albumIds,status:'ready',category:'Catégorie '+id});
const ordinary=['Courante','Inhabituelle','Rare','Précieuse','Légendaire','Suprême'].map((r,i)=>card('ordinary-'+i,r));
const halloween=card('halloween','Editions spéciales','Editions spéciales',['event-album']),other=card('other-edition','Editions spéciales','Editions spéciales',['other-album']);
const albums=[{id:'event-album',name:'Halloween',status:'active',kind:'specialized',universe:'Editions spéciales'}],catalog=[...ordinary,halloween,other];
for(const [index,policy] of B.BOOSTER_POLICY.boosters.entries()){
 assert.equal(policy.rates.reduce((s,v)=>s+v),100000);assert.equal(policy.rates[6],1000);assert.equal(policy.rates[0],B.BASE_BOOSTER_POLICY.boosters[index].rates[0]-1000);assert.deepEqual(policy.rates.slice(1,6),B.BASE_BOOSTER_POLICY.boosters[index].rates.slice(1,6));
 let lower=0;for(let i=0;i<7;i++){for(const roll of [lower,lower+policy.rates[i]-1]){const results=E.drawCards(catalog,policy.id,max=>max===100000?roll:0,{albums,theme:'Aviation'});assert.equal(results.length,policy.cards);assert.ok(results.every(c=>c.rarity===(i===6?'Editions spéciales':ordinary[i].rarity)));if(i===6)assert.ok(results.every(c=>c.id==='halloween'));else assert.ok(results.every(c=>c.universe==='Aviation'));}lower+=policy.rates[i];}
 const ended=E.drawCards(catalog,policy.id,max=>max===100000?99999:0,{albums,eventActive:false});assert.ok(ended.every(c=>c.rarity==='Suprême'));
 assert.throws(()=>E.drawCards([...ordinary,other],policy.id,()=>0,{albums}),/Ouverture suspendue/);
}
let selected=0;for(let roll=0;roll<100000;roll++)if(E.drawCards(catalog,'relais',max=>max===100000?roll:0,{albums})[0].id==='halloween')selected++;assert.equal(selected,1000);
console.log('PASS all 6 packs: exact 1% Halloween by exhaustive integer roll, every rarity boundary, normalized rates, other rarities unchanged, themed event bypass, non-Halloween exclusions, missing-pool fail closed and event-off restoration.');
const now=Date.parse('2026-11-01T12:00:00Z'),blank=()=>({revision:0,shards:0,packs:[],inventory:[],lastRecharge:now,lastOpening:null,lastRequest:''});
const large=Array.from({length:200},(_,i)=>card('model-'+i,ordinary[i%6].rarity,'Univers '+i%8));
const dailyMetrics=new Set(),weeklyMetrics=new Set();for(let i=0;i<70;i++){const g=blank();P.ensureProgression(g,large,now+i*86400000);for(const c of g.progression.daily.items)dailyMetrics.add(c.metric);for(const c of g.progression.weekly.items)weeklyMetrics.add(c.metric);assert.equal(g.progression.daily.items.length,3);assert.equal(g.progression.weekly.items.length,3);assert.equal(g.progression.weekly.items.reduce((s,c)=>s+c.xp,0),225);for(const c of g.progression.weekly.items){if(c.metric==='packs')assert.ok(c.target>=35);if(c.metric==='cards')assert.ok(c.target>=200);if(c.metric==='active_days')assert.ok(c.target>=5&&c.perGroup>=15);}}
assert.ok(dailyMetrics.size>=6);assert.ok(weeklyMetrics.size>=6);const late=blank();P.ensureProgression(late,large,Date.parse('2026-11-01T12:00:00Z'));assert.ok(late.progression.weekly.items.every(c=>c.metric!=='active_days'));const monday=blank();P.ensureProgression(monday,large,Date.parse('2026-11-02T12:00:00Z'));

let g=blank();P.ensureProgression(g,large,now);const pr=g.progression;pr.daily.items=[];pr.weekly.items=[
 {id:'qa-pack',metric:'packs',target:6,label:'Packs',xp:30,shards:0,progress:0,difficulty:'Test'},
 {id:'qa-model',metric:'models',target:10,label:'Models',xp:30,shards:0,progress:0,difficulty:'Test'},
 {id:'qa-rare',metric:'rarity_cards',minimumXP:15,target:25,label:'Rare',xp:30,shards:0,progress:0,difficulty:'Test'},
 {id:'qa-focus',metric:'universe_cards',universe:'Univers 0',target:20,label:'Focus',xp:30,shards:0,progress:0,difficulty:'Test'},
 {id:'qa-cover',metric:'universe_collection',perGroup:15,target:3,label:'Coverage',xp:30,shards:0,progress:0,difficulty:'Test'},
 {id:'qa-days',metric:'active_days',perGroup:25,target:6,label:'Days',xp:30,shards:0,progress:0,difficulty:'Test'},
 {id:'qa-category',metric:'categories',target:10,label:'Categories',xp:30,shards:0,progress:0,difficulty:'Test'}];
const start=pr.weekly.startsAt;for(let day=0;day<6;day++)for(let i=0;i<25;i++)pr.events.push({id:`qa-${day}-${i}`,instanceId:`qa-${day}-${i}`,at:start+day*86400000+3600000,source:'booster',xp:15,label:'Test',rarity:'Rare',modelId:'model-'+i%10,category:'Catégorie '+i%10,universe:'Univers '+i%3,packId:`pack-${day}-${Math.floor(i/5)}`});
P.settleChallenges(g,large,now);assert.ok(pr.weekly.items.every(c=>c.progress===c.target&&c.rewardedAt));assert.equal(pr.xp,210);P.settleChallenges(g,large,now);assert.equal(pr.xp,210);assert.equal(pr.events.filter(e=>e.source==='weekly').length,7);
g=blank();P.ensureProgression(g,large,now);g.progression.daily.items=[];g.progression.weekly.items=[{id:'one-day',metric:'active_days',perGroup:25,target:6,label:'Days',xp:70,shards:0,progress:0,difficulty:'Test'}];g.progression.events=pr.events.filter(e=>e.source==='booster').map(e=>({...e,at:start+3600000}));P.settleChallenges(g,large,now);assert.equal(g.progression.weekly.items[0].progress,1);assert.equal(g.progression.xp,0);
console.log('PASS harder daily/weekly rotation: 6+ goal types, genuine multi-day requirements, distinct models, rarity/target-universe/coverage/category accounting and once-only rewards.');
g=blank();P.ensureProgression(g,large,now);const old=g.progression.weekly.items[0];old.label='Ancien défi terminé';old.progress=old.target;old.rewardedAt=now-1;P.grantXP(g,{id:'challenge:'+old.id,at:now-1,source:'weekly',xp:30,label:old.label});g.progression.weekly.schemaVersion=undefined;const xp=g.progression.xp;P.ensureProgression(g,large,now);P.settleChallenges(g,large,now);assert.equal(g.progression.weekly.items[0].label,'Ancien défi terminé');assert.equal(g.progression.xp,xp);P.ensureProgression(g,large,now);assert.equal(g.progression.xp,xp);
const source=await fs.readFile('app/test/test-game.tsx','utf8');assert.ok(!source.includes('booster-xp-summary'));assert.ok(!source.includes('XP · cartes du booster'));assert.ok(source.includes('setEnlarged'));assert.ok(source.includes('HALLOWEEN_EVENT.active'));
console.log('PASS completed legacy goals/rewards retained, idempotent upgrade; XP recap removed while enlargement and event notice remain.');
