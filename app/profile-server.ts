import {env} from 'cloudflare:workers';
import {db,HttpError} from './server';
import {catalogAsset} from './catalog-assets';
import {defaultProfile,validateProfile,type PlayerProfile} from './player-profile';
export async function profileFor(id:string,name:string){const row=await db().prepare('SELECT data FROM settings WHERE id=?').bind('player-profile-v1:'+id).first<{data:string}>();return {...defaultProfile(name),...(row?JSON.parse(row.data):{})} as PlayerProfile;}
export async function savePlayerProfile(id:string,name:string,input:unknown){
 const key='player-profile-v1:'+id,row=await db().prepare('SELECT data FROM settings WHERE id=?').bind(key).first<{data:string}>(),current={...defaultProfile(name),...(row?JSON.parse(row.data):{})} as PlayerProfile;
 let profile:PlayerProfile;try{profile=validateProfile(input,current,new Date().toISOString());}catch(error){throw new HttpError((input as any)?.revision!==current.revision?409:400,(error as Error).message);}
 if(profile.avatarKey&&!catalogAsset(profile.avatarKey)&&!(await env.BUCKET?.head(profile.avatarKey)))throw new HttpError(400,'L’image choisie n’est plus disponible.');
 const staff=await db().prepare('SELECT id,nickname AS name FROM atlas_accounts').all<{id:string;name:string}>(),profiles=await db().prepare("SELECT id,data FROM settings WHERE id LIKE 'player-profile-v1:%'").all<{id:string;data:string}>();
 const lower=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
 for(const person of staff.results){if(person.id===id)continue;const record=profiles.results.find(p=>p.id==='player-profile-v1:'+person.id),other=record?JSON.parse(record.data).nickname:person.name;if(lower(other)===lower(profile.nickname))throw new HttpError(409,'Ce pseudo est déjà utilisé.');}
 const result=row?await db().prepare('UPDATE settings SET data=? WHERE id=? AND data=?').bind(JSON.stringify(profile),key,row.data).run():await db().prepare('INSERT OR IGNORE INTO settings(id,data) VALUES(?,?)').bind(key,JSON.stringify(profile)).run();
 if(!result.meta.changes)throw new HttpError(409,'Le profil a changé pendant l’enregistrement. Réessayez.');return profile;
}
