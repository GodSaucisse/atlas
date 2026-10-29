import {db,HttpError} from './server';
import type {TestGame} from './test-game-engine';
export const STARTER_GRANT_VERSION=2;
export function newPlayerGame(now=Date.now()):TestGame{return {starterGrantVersion:STARTER_GRANT_VERSION,revision:0,shards:100,packs:[{id:crypto.randomUUID(),type:'bienvenue'},...Array.from({length:10},()=>({id:crypto.randomUUID(),type:'relais'}))],inventory:[],lastRecharge:now,lastOpening:null,lastRequest:''};}
export function correctStarterGrant(game:TestGame,now=Date.now()){
 if(game.starterGrantVersion===STARTER_GRANT_VERSION)return false;
 game.shards=Math.max(0,game.shards-1400);
 const missing=Math.max(0,10-game.packs.filter(p=>p.type==='relais').length);
 for(let i=0;i<missing;i++)game.packs.push({id:crypto.randomUUID(),type:'relais'});
 if(missing)game.lastRecharge=now;
 game.starterGrantVersion=STARTER_GRANT_VERSION;game.revision++;return true;
}
/** Only ATLAS player UUIDs; legacy ChatGPT test games are excluded. */
export async function applyPlayerStarterMigration(){
 for(let attempt=0;attempt<5;attempt++){
 const rows=await db().prepare("SELECT s.id,s.data FROM settings s JOIN atlas_accounts a ON s.id='test-game-v1:'||a.id WHERE COALESCE(json_extract(s.data,'$.starterGrantVersion'),0)<>?").bind(STARTER_GRANT_VERSION).all<{id:string;data:string}>();
 if(!rows.results.length)return;
 for(const row of rows.results){const game=JSON.parse(row.data) as TestGame;correctStarterGrant(game);await db().prepare('UPDATE settings SET data=? WHERE id=? AND data=?').bind(JSON.stringify(game),row.id,row.data).run();}
 }
 throw new HttpError(409,'La dotation de départ est en cours de mise à jour. Réessayez.');
}
