import {db,HttpError} from './server';
import {newPlayerGame} from './player-starter';
import {ensureProgression,awardLogin,LEVEL_XP,LOGIN_REWARDS,CHALLENGE_VERSION} from './progression';
import {RECYCLE} from './player-hub';
import {BASE_BOOSTER_POLICY} from './config/boosters';
import {RULES} from './lottery/engine';
import type {TestGame} from './test-game-engine';
export const ECONOMY_VERSION='2026-10-31-v2-levels-reverted';
// Same compare-and-swap key as purchases, wheels, trades and lottery awards.
export async function visitEconomy(database:any,userId:string,now=Date.now()){
 const key='test-game-v1:'+userId;
 await database.prepare('INSERT OR IGNORE INTO settings(id,data) VALUES(?,?)').bind(key,JSON.stringify(newPlayerGame(now))).run();
 for(let retry=0;retry<8;retry++){
  const row=await database.prepare('SELECT data FROM settings WHERE id=?').bind(key).first();const game=JSON.parse(row.data) as TestGame;
  if(game.progression?.levelRollback?.version===1&&!(game.progression.levelRollback.remaining>0&&game.shards>0)&&game.progression.login?.lastDate&&game.progression.login.lastDate>=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(now))return false;
  ensureProgression(game,[],now);awardLogin(game,now);game.revision++;
  const result=await database.prepare('UPDATE settings SET data=? WHERE id=? AND data=?').bind(JSON.stringify(game),key,row.data).run();if(result.meta.changes)return true;
 }
 throw new HttpError(409,'Attribution de connexion en cours. Réessayez.');
}
export async function migrateEconomyPlayers(database:any,now=Date.now()){
 const rows=(await database.prepare("SELECT a.id FROM atlas_accounts a JOIN settings s ON s.id='test-game-v1:'||a.id").all()).results;let migrated=0;
 for(const {id} of rows){for(let retry=0;retry<8;retry++){
  const key='test-game-v1:'+id,row=await database.prepare('SELECT data FROM settings WHERE id=?').bind(key).first(),game=JSON.parse(row.data) as TestGame;
  if(game.progression?.levelRollback?.version===1&&!(game.progression.levelRollback.remaining>0&&game.shards>0))break;
  ensureProgression(game,[],now);game.revision++;
  const result=await database.prepare('UPDATE settings SET data=? WHERE id=? AND data=?').bind(JSON.stringify(game),key,row.data).run();if(result.meta.changes){migrated++;break;}if(retry===7)throw new HttpError(409,'Migration concurrente ; relancez le contrôle.');
 }}return {migrated};
}
export async function economyStatus(database:any){
 const rows=(await database.prepare("SELECT a.id,s.data FROM atlas_accounts a JOIN settings s ON s.id='test-game-v1:'||a.id ORDER BY a.id").all()).results;
 return {version:ECONOMY_VERSION,challengeVersion:CHALLENGE_VERSION,levelThresholds:[1,5,10,20,30,40,50].map(level=>({level,xp:LEVEL_XP[level-1]})),recycling:RECYCLE,login:LOGIN_REWARDS,epicPrice:BASE_BOOSTER_POLICY.boosters.find(b=>b.id==='evenement')!.priceShards,lottery:RULES,players:rows.map((r:any)=>{const g=JSON.parse(r.data) as TestGame,p=g.progression;return {id:r.id,migrated:p?.economyVersion===2,xp:p?.xp||0,level:p?.level||1,shards:g.shards,migration:p?.economyMigration,levelRollback:p?.levelRollback,inventory:g.inventory.map(c=>c.id),packs:g.packs.map(p=>({id:p.id,type:p.type,theme:p.theme,source:p.source})),daily:p?.daily.items.map(c=>({id:c.id,shards:c.shards})),weekly:p?.weekly.items.map(c=>({id:c.id,shards:c.shards,rewardChoice:c.rewardChoice})),levels:p?.levelRewards.length||0};})};
}
