import {RARITIES,RARITY_STYLES} from './config/rarities';
import type {Card} from './model';
/** Count owned models once, regardless of the number of duplicate copies. */
export function groupAlbumRarities(cards:Card[],inventory:Pick<Card,'id'>[]){
 const owned=new Set(inventory.map(c=>c.id)),buckets=new Map<string,Card[]>();
 for(const card of new Map(cards.map(c=>[c.id,c])).values()){const rarity=card.rarity||'Sans rareté';const bucket=buckets.get(rarity)||[];bucket.push(card);buckets.set(rarity,bucket);}
 const order:string[]=[...RARITIES].reverse();for(const rarity of buckets.keys())if(!order.includes(rarity))order.push(rarity);
 return order.flatMap(rarity=>{const entries=buckets.get(rarity);if(!entries?.length)return [];return [{rarity,cards:entries,total:entries.length,owned:entries.filter(c=>owned.has(c.id)).length,color:RARITY_STYLES[rarity as keyof typeof RARITY_STYLES]?.hex||'#a7b6d8'}];});
}
