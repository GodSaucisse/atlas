import {displayRarity} from '../model';
import type {Listing} from '../player-hub';
export type MarketFilters={query:string;rarity:string;category:string;price:string;sort:string};
export type MarketScope='open'|'mine'|'bids';
export const normalizeMarket=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').trim();
export function withinPrice(price:number,range:string){const bounds:Record<string,[number,number]>={low:[0,100],medium:[101,500],high:[501,2000],premium:[2001,10000],exceptional:[10001,Infinity]};const pair=bounds[range];return !pair||price>=pair[0]&&price<=pair[1]}
export function selectMarketListings(listings:Listing[],me:string,kind:Listing['kind'],scope:MarketScope,filters:MarketFilters,now:number){
 const query=normalizeMarket(filters.query);
 return listings.filter(l=>l.kind===kind&&(scope==='mine'?l.seller===me:scope==='bids'?(l.bidder===me||l.buyer===me||l.watchers?.includes(me)):l.status==='open'&&(!l.end||l.end>now)))
 .filter(l=>(filters.rarity==='all'||displayRarity(l.card)===filters.rarity)&&(filters.category==='all'||(l.card.category||l.card.universe)===filters.category)&&withinPrice(l.price,filters.price)&&(!query||normalizeMarket(`${l.card.name} ${l.card.code} ${l.card.category} ${l.card.universe}`).includes(query)))
 .sort((a,b)=>filters.sort==='price-up'?a.price-b.price:filters.sort==='price-down'?b.price-a.price:filters.sort==='name'?a.card.name.localeCompare(b.card.name,'fr'):(a.end||Infinity)-(b.end||Infinity)||a.card.name.localeCompare(b.card.name,'fr'));
}
export function marketCountdown(end:number,now:number){const seconds=Math.max(0,Math.ceil((end-now)/1000));return `${String(Math.floor(seconds/3600)).padStart(2,'0')}:${String(Math.floor(seconds%3600/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`}
