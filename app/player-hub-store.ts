import {db} from './server';
import {emptyHub,type Hub} from './player-hub';
import {newPlayerGame} from './player-starter';

export const PLAYER_HUB_KEY='atlas-player-hub-v1';
const LEGACY_HUB_KEY='player-hub-v1';
/** Retain account-owned activity without importing the old ChatGPT test identities. */
export function accountHub(source:Hub,accountIds:Set<string>):Hub{
 const member=(id:string|undefined)=>!!id&&accountIds.has(id);
 return {...emptyHub(),revision:(source.revision||0)+1,
  listings:source.listings.filter(l=>member(l.seller)&&(!l.bidder||member(l.bidder))&&(!l.buyer||member(l.buyer))).map(l=>({...l,watchers:l.watchers?.filter(member),remindedUsers:l.remindedUsers?.filter(member)})),
  offers:source.offers.filter(o=>member(o.from)&&member(o.to)),
  friends:source.friends.filter(f=>member(f.from)&&member(f.to)),
  messages:(source.messages||[]).filter(m=>member(m.from)&&member(m.to)),
  notifications:(source.notifications||[]).filter(n=>member(n.user)),
  favorites:Object.fromEntries(Object.entries(source.favorites||{}).filter(([id])=>member(id)).map(([id,friends])=>[id,friends.filter(member)])),
  requests:[...source.requests],
 };
}
export async function ensureAccountHub(){
 // An account can interact before its first visit to the booster screen. Never overwrite a saved game.
 const missing=await db().prepare("SELECT a.id FROM atlas_accounts a LEFT JOIN settings s ON s.id='test-game-v1:'||a.id WHERE s.id IS NULL").all<{id:string}>();
 if(missing.results.length)await db().batch(missing.results.map(a=>db().prepare('INSERT OR IGNORE INTO settings(id,data) VALUES (?,?)').bind('test-game-v1:'+a.id,JSON.stringify(newPlayerGame()))));
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(PLAYER_HUB_KEY).first())return;
 const [legacy,accounts]=await Promise.all([
  db().prepare('SELECT data FROM settings WHERE id=?').bind(LEGACY_HUB_KEY).first<{data:string}>(),
  db().prepare('SELECT id FROM atlas_accounts').all<{id:string}>(),
 ]);
 const hub=legacy?accountHub(JSON.parse(legacy.data) as Hub,new Set(accounts.results.map(a=>a.id))):emptyHub();
 await db().prepare('INSERT OR IGNORE INTO settings(id,data) VALUES (?,?)').bind(PLAYER_HUB_KEY,JSON.stringify(hub)).run();
}
