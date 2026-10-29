import {RECYCLE} from './player-hub';
import type {TestGame} from './test-game-engine';
// A new model's first copy is new; later copies in the same pack are duplicates.
export function duplicateSlotsForDraw(inventory:{id:string}[],cards:{id:string}[]){
 const seen=new Set(inventory.map(c=>c.id)),slots:number[]=[];
 cards.forEach((card,index)=>{if(seen.has(card.id))slots.push(index);seen.add(card.id)});
 return slots;
}
export function openingDuplicateSlots(game:TestGame,openingId:string){
 const opening=game.lastOpening;if(!opening||opening.id!==openingId)return [];
 if(opening.duplicateSlots)return opening.duplicateSlots;
 // Older openings have no draw snapshot. Keep their recycled slots and infer
 // the others from the copies still held, without treating the first as a duplicate.
 const counts=new Map<string,number>();for(const c of game.inventory)counts.set(c.id,(counts.get(c.id)||0)+1);
 for(const [i,c] of opening.cards.entries())if(!opening.recycledSlots?.includes(i))counts.set(c.id,Math.max(0,(counts.get(c.id)||0)-1));
 const before=[...counts].flatMap(([id,count])=>count>0?[{id}]:[]);
 return [...new Set([...duplicateSlotsForDraw(before,opening.cards),...(opening.recycledSlots||[])])].sort((a,b)=>a-b);
}
export function openingDuplicates(game:TestGame,openingId:string){
 if(!game.lastOpening||game.lastOpening.id!==openingId||game.lastOpening.recycled)return [];
 const counts=new Map<string,number>();for(const c of game.inventory)counts.set(c.id,(counts.get(c.id)||0)+1);
 const opened=new Map<string,{card:TestGame['inventory'][number];count:number}>();for(const card of game.lastOpening.cards){const item=opened.get(card.id);if(item)item.count++;else opened.set(card.id,{card,count:1});}
 return [...opened.values()].map(({card,count})=>({card,count:Math.min(count,Math.max(0,(counts.get(card.id)||0)-1)),shards:RECYCLE[card.rarity||'']||1})).filter(c=>c.count>0);
}
export function recycleOpeningDuplicates(game:TestGame,openingId:string){const items=openingDuplicates(game,openingId);if(!items.length)throw Error('Aucun doublon de cette ouverture à recycler.');let total=0;const slots:number[]=[];for(const item of items){slots.push(...game.lastOpening!.cards.map((c,i)=>c.id===item.card.id?i:-1).filter(i=>i>=0).slice(-item.count));}for(const item of items)for(let i=0;i<item.count;i++){const index=game.inventory.findIndex(c=>c.id===item.card.id);game.inventory.splice(index,1);total+=item.shards;}game.shards+=total;game.lastOpening!.recycled=true;game.lastOpening!.recycledSlots=slots.sort((a,b)=>a-b);return total;}
