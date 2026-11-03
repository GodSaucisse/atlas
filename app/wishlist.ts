import type {Card} from './model';
import type {TestGame} from './test-game-engine';
/** Wishes belong to model IDs, never copies. Acquired models leave permanently. */
export function normalizeWishlist(game:TestGame){
 const owned=new Set(game.inventory.map(c=>c.id));
 game.wishlist=[...new Set((Array.isArray(game.wishlist)?game.wishlist:[]).filter(id=>typeof id==='string'&&!owned.has(id)))];
 return game.wishlist;
}
export function setWish(game:TestGame,catalog:Card[],id:unknown,wished:unknown){
 if(typeof id!=='string'||typeof wished!=='boolean')throw Error('Souhait invalide.');
 if(!catalog.some(c=>c.id===id&&c.status==='ready'))throw Error('Carte indisponible.');
 const list=normalizeWishlist(game);
 if(wished&&game.inventory.some(c=>c.id===id))throw Error('Vous possédez déjà cette carte.');
 game.wishlist=wished?[...new Set([...list,id])]:list.filter(value=>value!==id);
}
