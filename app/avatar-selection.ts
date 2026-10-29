import {displayRarity,type Card} from './model';
export const AVATAR_RARITY_ORDER=['Editions spéciales','Suprême','Légendaire','Précieuse','Rare','Inhabituelle','Courante'];
export function avatarCards(inventory:Card[]){const rank=(c:Card)=>{const i=AVATAR_RARITY_ORDER.indexOf(displayRarity(c)||'');return i<0?99:i};return [...new Map(inventory.filter(c=>c.imageKey).map(c=>[c.id,c])).values()].sort((a,b)=>rank(a)-rank(b)||a.name.localeCompare(b.name,'fr',{sensitivity:'base'}))}
