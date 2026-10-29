import type {Album} from './model';
export const SPECIAL_EDITION_ALBUM='editions-speciales';
export function isEditionAlbum(a:Pick<Album,'id'|'name'>){return a.id===SPECIAL_EDITION_ALBUM;}
type AlbumCard={universe:string;albumIds:string[];rarity?:string|null};
export function albumContains(c:AlbumCard,a:Album|undefined){if(!a)return false;return a.kind==='general'?c.universe===a.universe:c.albumIds.includes(a.id);}
export function albumAccepts(c:{universe:string;rarity?:string|null;rarityProposal?:string|null;editionSubjectUniverse?:string},a:Album){
 if(isEditionAlbum(a))return c.universe==='Editions spéciales';
 return c.universe===a.universe||(a.kind==='specialized'&&c.universe==='Editions spéciales'&&c.editionSubjectUniverse===a.universe);
}
export function scopedAlbumEntries<T extends AlbumCard>(cards:T[],album:Album|undefined,main?:Album){return cards.filter(c=>albumContains(c,album)&&(!main||albumContains(c,main)));}
export function relatedSpecializedAlbums(albums:Album[],cards:AlbumCard[],mainId:string){const main=albums.find(a=>a.id===mainId);if(!main)return [];return albums.filter(a=>a.kind==='specialized'&&(isEditionAlbum(main)?a.universe==='Editions spéciales'&&scopedAlbumEntries(cards,a,main).length>0:a.universe===main.universe));}
