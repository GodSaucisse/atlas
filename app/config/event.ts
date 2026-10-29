// Paris is UTC+1 on both dates (after the October daylight-saving transition).
export const HALLOWEEN_STARTS_AT=Date.parse('2026-10-28T00:00:00+01:00');
export const HALLOWEEN_ENDS_AT=Date.parse('2026-11-06T23:30:00+01:00');
export function isHalloweenActive(now=Date.now()){return now>=HALLOWEEN_STARTS_AT&&now<HALLOWEEN_ENDS_AT;}
export const HALLOWEEN_EVENT={id:'halloween-2026',name:'Halloween',get active(){return isHalloweenActive()},startsAt:HALLOWEEN_STARTS_AT,endsAt:HALLOWEEN_ENDS_AT,timeZone:'Europe/Paris',editionRate:400,editionAlbumName:'Halloween'} as const;
export const BASE_CARD_BACK='/boosters/atlas-card-back.png';
export const HALLOWEEN_CARD_BACK='/boosters/halloween-card-back.png';
export function cardBackForTime(now=Date.now()){return isHalloweenActive(now)?HALLOWEEN_CARD_BACK:BASE_CARD_BACK;}

/** Album membership, rather than the card name, identifies Halloween editions. */
export function isHalloweenEdition(card:{rarity:string|null;universe:string;albumIds:string[]},albums:{id:string;name:string;kind:string;universe:string}[]){return card.rarity==='Editions spéciales'&&card.universe==='Editions spéciales'&&albums.some(a=>a.kind==='specialized'&&a.name==='Halloween'&&a.universe==='Editions spéciales'&&card.albumIds.includes(a.id));}
