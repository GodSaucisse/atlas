const fs=require('fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const {duplicateSlotsForDraw,openingDuplicateSlots,recycleOpeningDuplicates}=require('../app/opening-duplicates.ts');
const c=id=>({id,name:id,rarity:'Rare'});
assert.deepEqual(duplicateSlotsForDraw([],['a','b','a','c','b'].map(c)),[2,4]);
assert.deepEqual(duplicateSlotsForDraw([c('a')],['a','b','a','b','c'].map(c)),[0,2,3]);
assert.deepEqual(duplicateSlotsForDraw([],['a','b','c','d','e'].map(c)),[]);
const openingCards=['a','b','a','b','c'].map(c),slots=duplicateSlotsForDraw([c('a')],openingCards);
const game={inventory:[c('a'),...openingCards],lastOpening:{id:'p',cards:openingCards,duplicateSlots:slots},shards:0};
assert.deepEqual(openingDuplicateSlots(game,'p'),[0,2,3]);
recycleOpeningDuplicates(game,'p');assert.deepEqual(openingDuplicateSlots(game,'p'),[0,2,3]);assert.deepEqual(game.lastOpening.recycledSlots,[0,2,3]);assert.deepEqual(openingDuplicateSlots(JSON.parse(JSON.stringify(game)),'p'),[0,2,3]);assert.deepEqual(openingDuplicateSlots(game,'other'),[]);
// Later gifts, trades and recycling must not relabel the original draw.
game.inventory.push(c('c'));assert.deepEqual(openingDuplicateSlots(game,'p'),[0,2,3]);
const legacy={inventory:['a','a','b','b','c'].map(c),lastOpening:{id:'old',cards:['a','b','a','b','c'].map(c)}};assert.deepEqual(openingDuplicateSlots(legacy,'old'),[2,3]);
console.log('PASS persisted duplicate slots: pre-owned copies, new intra-pack duplicates, no false first-copy badge, older openings, recycling, later inventory changes and reopening.');
