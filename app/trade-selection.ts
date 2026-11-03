import {displayRarity,type Card,type Album} from './model';
import {albumContains} from './album-membership';
const rarityOrder=['Editions spéciales','Suprême','Légendaire','Précieuse','Rare','Inhabituelle','Courante'];
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
export function tradeAlbums(inventory:Card[],albums:Album[]=[]){return albums.filter(a=>a.status==='active'&&inventory.some(c=>albumContains(c,a))).sort((a,b)=>a.universe.localeCompare(b.universe,'fr')||(a.kind===b.kind?a.name.localeCompare(b.name,'fr'):a.kind==='general'?-1:1));}
export function tradeChoices(inventory:Card[],albums:Album[]=[],albumId='all',query=''){
 const album=albums.find(a=>a.id===albumId),rank=(c:Card)=>{const r=rarityOrder.indexOf(displayRarity(c)||'');return r<0?rarityOrder.length:r;};
 return [...new Map(inventory.map(c=>[c.id,c])).values()].filter(c=>(albumId==='all'||(album?albumContains(c,album):c.universe===albumId))&&normalize(c.name).includes(normalize(query.trim()))).sort((a,b)=>rank(a)-rank(b)||a.name.localeCompare(b.name,'fr')||a.code.localeCompare(b.code,'fr'));
}
