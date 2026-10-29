import {flushPush} from '../../push-server';
import {PLAYER_HUB_KEY} from '../../player-hub-store';
import {authorizePlayer,db,errorResponse} from '../../server';
import {periodBounds} from '../../progression';
import {BOOSTER_POLICY} from '../../config/boosters';
export const dynamic='force-dynamic';
/** Small revision-only response: no inventories, messages, catalog bodies. Presence is updated at most once per minute. */
export async function GET(request:Request){try{const actor=await authorizePlayer(request);try{await flushPush()}catch{}const now=Date.now(),results=await db().batch([
 db().prepare("SELECT json_extract(data,'$.token') AS token FROM settings WHERE id=?").bind(PLAYER_HUB_KEY),
 db().prepare("SELECT id,json_extract(data,'$.revision') AS revision,json_extract(data,'$.lastRecharge') AS lastRecharge FROM settings WHERE id='test-game-v1:'||? OR id IN (SELECT 'test-game-v1:'||id FROM atlas_accounts) OR id IN (SELECT 'player-profile-v1:'||id FROM atlas_accounts) ORDER BY id").bind(actor.userId),
 db().prepare("SELECT revision FROM catalog_meta WHERE id='catalog'"),
 db().prepare("SELECT id,data FROM settings WHERE id LIKE 'player-presence:%' ORDER BY id"),
 db().prepare("SELECT COALESCE(SUM(CASE WHEN json_extract(value,'$.end')<=? THEN 1 ELSE 0 END),0) AS expired,COALESCE(SUM(CASE WHEN json_extract(value,'$.end')>? AND json_extract(value,'$.end')<=? THEN 1 ELSE 0 END),0) AS reminders FROM settings,json_each(settings.data,'$.listings') WHERE settings.id=? AND json_extract(value,'$.status')='open' AND (json_extract(value,'$.kind')='auction' OR (json_extract(value,'$.kind')='sale' AND json_extract(value,'$.end')>0))").bind(now,now,now+120000,PLAYER_HUB_KEY),
 db().prepare("SELECT COUNT(*) AS expired FROM settings,json_each(settings.data,'$.offers') WHERE settings.id=? AND json_extract(value,'$.status')='open' AND json_extract(value,'$.end')<=?").bind(PLAYER_HUB_KEY,now),
 db().prepare("SELECT data FROM settings WHERE id='global-chat-revision-v1'")
]);const revisions=results[1].results as {id:string;revision:number;lastRecharge?:number}[],catalog=String((results[2].results[0] as any)?.revision||0),own=revisions.find(r=>r.id==='test-game-v1:'+actor.userId),game=own?.revision??-1,refill=own?.lastRecharge?Math.max(0,Math.floor((now-own.lastRecharge)/600000)):0;
const presence=results[3].results as {id:string;data:string}[],presenceKey='player-presence:'+actor.userId,last=Number(presence.find(r=>r.id===presenceKey)?.data||0);if(now-last>=60000){await db().prepare('INSERT INTO settings(id,data) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').bind(presenceKey,String(now)).run();const row=presence.find(r=>r.id===presenceKey);if(row)row.data=String(now);else presence.push({id:presenceKey,data:String(now)});presence.sort((a,b)=>a.id.localeCompare(b.id));}
return Response.json({chat:`${(results[6].results[0] as {data?:string})?.data||'0'}:${JSON.stringify(revisions.filter(r=>r.id.startsWith('player-profile-v1:')))}`,game:`${game}:${catalog}:${BOOSTER_POLICY.version}:${refill}:${Math.floor(now/86400000)}`,hub:JSON.stringify([(results[0].results[0] as any)?.token||'',revisions,catalog,results[3].results,periodBounds(now).id,results[4].results,results[5].results])},{headers:{'Cache-Control':'no-store'}});}catch(error){return errorResponse(error);}}
