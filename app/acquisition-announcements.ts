import type {Card} from './model';
import type {Hub} from './player-hub';
import type {TestGame} from './test-game-engine';
export const ACQUISITION_PREFIX='atlas-acquisition:';
export type AcquisitionAnnouncement={requestId:string;userId:string;text:string;at:number};
function announcement(userId:string,eventId:string,card:Card,index:number,at:number):AcquisitionAnnouncement[]{
 if(card.rarityStatus!=='validated'||!['Suprême','Editions spéciales'].includes(card.rarity||''))return [];
 const edition=card.rarity==='Editions spéciales';
 return [{requestId:`${ACQUISITION_PREFIX}${edition?'edition':'supreme'}:${eventId}:${userId}:${index}`,userId,text:`a obtenu « ${card.name} », ${edition?'une carte Editions spéciales':'une carte Suprême'} !`,at}];
}
export function openingAnnouncements(userId:string,packId:string,cards:Card[],at:number){return cards.flatMap((card,i)=>announcement(userId,`booster:${packId}`,card,i,at))}
/** Genuine transfers only: expired/cancelled listings and returned offers are excluded. */
export function hubAnnouncements(before:Hub,after:Hub,beforeGames:Map<string,TestGame>,catalog:Card[],at:number){
 const result:AcquisitionAnnouncement[]=[],current=(c:Card)=>catalog.find(m=>m.id===c.id)||catalog.find(m=>m.code===c.code)||c;
 for(const listing of after.listings){if(listing.status!=='sold'||!before.listings.some(l=>l.id===listing.id&&l.status==='open'))continue;const to=listing.buyer||listing.bidder;if(to)result.push(...announcement(to,`market:${listing.id}`,current(listing.card),0,at));}
 for(const offer of after.offers){if(offer.status!=='accepted'||!before.offers.some(o=>o.id===offer.id&&o.status==='open'))continue;
  (offer.cards||[offer.card]).forEach((card,i)=>result.push(...announcement(offer.to,`trade:${offer.id}`,current(card),i,at)));
  (offer.wantedIds??(offer.wanted?[offer.wanted]:[])).forEach((id,i)=>{const card=beforeGames.get(offer.to)?.inventory.find(c=>c.id===id);if(card)result.push(...announcement(offer.from,`trade:${offer.id}`,current(card),i,at));});
 }
 return result;
}
