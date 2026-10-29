import type {Card} from './model';
export const PROFILE_ACCENTS={atlas:['#22cdea','#b64bf0'],ember:['#ffae66','#f6537a'],emerald:['#32d4ab','#448cf3'],gold:['#ffe199','#c58a35'],ice:['#85e5ff','#8090ff']} as const;
export type PublicProfile={nickname:string;bio:string;country:string;avatarKey:string;accent:keyof typeof PROFILE_ACCENTS};
export type PlayerProfile=PublicProfile&{revision:number;updatedAt:string};
export function defaultProfile(name:string):PlayerProfile{return {nickname:name||'Collectionneur',bio:'',country:'',avatarKey:'',accent:'atlas',revision:0,updatedAt:''};}
export function publicProfile(profile:PlayerProfile):PublicProfile{const {nickname,bio,country,avatarKey,accent}=profile;return {nickname,bio,country,avatarKey,accent};}
export function validateProfile(input:any,current:PlayerProfile,at:string):PlayerProfile{
 if(!input||typeof input!=='object'||input.revision!==current.revision)throw Error('Le profil a changé. Rechargez-le avant de réessayer.');
 const text=(v:unknown,max:number,required=false,multiline=false)=>{if(typeof v!=='string'||v.length>max||(multiline?/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/:/[\u0000-\u001f\u007f]/).test(v)||(required&&!v.trim()))throw Error('Un champ du profil est invalide.');return v.trim();};
 const nickname=text(input.nickname,50,true),bio=text(input.bio,300,false,true),country=text(input.country,2),avatarKey=text(input.avatarKey,160),accent=input.accent;
 if(country&&!/^[A-Z]{2}$/.test(country))throw Error('Choisissez un pays valide.');
 if(avatarKey&&!/^[a-f0-9-]{36}\.(png|jpg|webp|gif)$/.test(avatarKey))throw Error('Image de profil invalide.');
 if(!Object.hasOwn(PROFILE_ACCENTS,accent))throw Error('Personnalisation invalide.');
 return {nickname,bio,country,avatarKey,accent,revision:current.revision+1,updatedAt:at};
}
export function collectionProgress(inventory:Pick<Card,'id'>[],total:number){const owned=new Set(inventory.map(c=>c.id)).size;return {owned,total:Math.max(total,owned),percent:total?Math.min(100,owned/total*100):0};}
