import {ACQUISITION_PREFIX,type AcquisitionAnnouncement} from './acquisition-announcements';
import {db,HttpError} from './server';
export const GLOBAL_CHAT_REVISION='global-chat-revision-v1';
export type GlobalMessage={id:number;playerId:string;name:string;text:string;at:number;kind:'message'|'acquisition';rarity:'Suprême'|'Editions spéciales'|null};
let schema:Promise<unknown>|undefined;
export async function ensureGlobalChat(){if(!schema)schema=db().batch([
 db().prepare('CREATE TABLE IF NOT EXISTS atlas_global_messages(id INTEGER PRIMARY KEY AUTOINCREMENT,request_id TEXT NOT NULL UNIQUE,user_id TEXT NOT NULL,text TEXT NOT NULL,created_at INTEGER NOT NULL)'),
 db().prepare('CREATE INDEX IF NOT EXISTS atlas_global_messages_user_time ON atlas_global_messages(user_id,created_at)'),
]);try{await schema}catch(e){schema=undefined;throw e}}
export function validateGlobalMessage(input:unknown){const value=input as {text?:unknown;requestId?:unknown};if(typeof value?.text!=='string'||!value.text.trim()||value.text.length>1000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value.text))throw new HttpError(400,'Écrivez un message de 1 à 1 000 caractères.');if(typeof value.requestId!=='string'||!value.requestId.trim()||value.requestId.length>80||value.requestId.startsWith(ACQUISITION_PREFIX))throw new HttpError(400,'Requête invalide.');return {text:value.text.trim(),requestId:value.requestId}}
export async function globalMessages():Promise<GlobalMessage[]>{await ensureGlobalChat();const rows=await db().prepare("SELECT m.id,m.user_id AS playerId,COALESCE(json_extract(p.data,'$.nickname'),a.nickname) AS name,m.text,m.created_at AS at,CASE WHEN m.request_id LIKE 'atlas-acquisition:%' THEN 'acquisition' ELSE 'message' END AS kind,CASE WHEN m.request_id LIKE 'atlas-acquisition:supreme:%' THEN 'Suprême' WHEN m.request_id LIKE 'atlas-acquisition:edition:%' THEN 'Editions spéciales' ELSE NULL END AS rarity FROM atlas_global_messages m JOIN atlas_accounts a ON a.id=m.user_id LEFT JOIN settings p ON p.id='player-profile-v1:'||a.id ORDER BY m.id DESC LIMIT 100").all<GlobalMessage>();return rows.results.reverse()}
export async function sendGlobalMessage(userId:string,input:unknown,now=Date.now()){const {text,requestId}=validateGlobalMessage(input);await ensureGlobalChat();const result=await db().batch([
 db().prepare(`INSERT OR IGNORE INTO atlas_global_messages(request_id,user_id,text,created_at) SELECT ?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM atlas_global_messages WHERE user_id=? AND request_id NOT LIKE 'atlas-acquisition:%' AND created_at>?)`).bind(requestId,userId,text,now,userId,now-1000),
 db().prepare("INSERT INTO settings(id,data) VALUES(?,CAST((SELECT COALESCE(MAX(id),0) FROM atlas_global_messages) AS TEXT)) ON CONFLICT(id) DO UPDATE SET data=excluded.data").bind(GLOBAL_CHAT_REVISION),
]);if(!result[0].meta.changes){const existing=await db().prepare('SELECT id FROM atlas_global_messages WHERE request_id=? AND user_id=?').bind(requestId,userId).first();if(!existing)throw new HttpError(429,'Patientez une seconde avant le prochain message.');}}

/** Add these statements to the same guarded D1 batch as the acquisition itself. */
export function acquisitionStatements(events:AcquisitionAnnouncement[],gate:{sql:string;args:unknown[]}){
 if(!events.length)return [];
 return [...events.map(e=>db().prepare(`INSERT OR IGNORE INTO atlas_global_messages(request_id,user_id,text,created_at) SELECT ?,?,?,? WHERE ${gate.sql}`).bind(e.requestId,e.userId,e.text,e.at,...gate.args)),db().prepare(`INSERT INTO settings(id,data) SELECT ?,CAST((SELECT COALESCE(MAX(id),0) FROM atlas_global_messages) AS TEXT) WHERE ${gate.sql} ON CONFLICT(id) DO UPDATE SET data=excluded.data`).bind(GLOBAL_CHAT_REVISION,...gate.args)];
}
