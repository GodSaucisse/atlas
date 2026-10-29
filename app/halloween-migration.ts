import {db,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Admin,type Album,type Card} from './model';
import manifest from './content/halloween-import.json';
export const HALLOWEEN_JOB='halloween-five-models-20261028-v1';
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/edition/g,'').replace(/[^a-z0-9]/g,'');
export function halloweenChanges(cards:Card[],albums:Album[],actor:string,at:string){
 const principal=albums.find(a=>a.id==='editions-speciales');if(!principal)throw new HttpError(409,'L’album principal Editions spéciales est absent.');
 const existingAlbum=albums.find(a=>a.status!=='deleted'&&norm(a.name)==='halloween');
 if(existingAlbum&&(existingAlbum.universe!=='Editions spéciales'||existingAlbum.kind!=='specialized'))throw new HttpError(409,'Un album Halloween existe dans un autre classement.');
 const album:Album={...(existingAlbum||{}),id:existingAlbum?.id||'editions-speciales-halloween',name:'Halloween',universe:'Editions spéciales',kind:'specialized',description:'Les créations originales Halloween Edition d’ATLAS.',status:'active',updatedAt:at};
 if(!existingAlbum&&albums.some(a=>a.id===album.id))throw new HttpError(409,'Identifiant d’album Halloween déjà utilisé.');
 const changed=manifest.map(item=>{
  const codeMatch=cards.find(c=>c.code===item.code),subject=cards.find(c=>c.universe==='Editions spéciales'&&c.status!=='deleted'&&norm(c.name)===norm(item.name));
  if(codeMatch&&norm(codeMatch.name)!==norm(item.name))throw new HttpError(409,`Numéro déjà utilisé : ${item.code}.`);
  const previous=codeMatch||subject;
  return {...EMPTY_RARITY,...(previous||{}),id:previous?.id||crypto.randomUUID(),code:item.code,name:previous?.name||item.name,universe:'Editions spéciales',editionSubjectUniverse:undefined,category:item.category,description:previous?.description||item.description,rarity:'Editions spéciales',rarityStatus:'validated' as const,rarityProposal:null,rarityProposedBy:null,rarityProposedAt:null,rarityValidatedBy:actor,rarityValidatedAt:at,imageKey:item.imageKey,imageFit:'cover' as const,imageCredit:'Création originale fournie par le créateur ATLAS',imageSource:'',albumIds:[principal.id,album.id],status:'ready' as const,updatedAt:at} satisfies Card;
 });
 return {cards:changed,albums:[album]};
}
export async function applyHalloweenMigration(admin:Admin&{userId:string}){
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(HALLOWEEN_JOB).first())return;
 const cr=await db().prepare('SELECT data FROM cards').all<{data:string}>(),ar=await db().prepare('SELECT data FROM albums').all<{data:string}>(),meta=await db().prepare("SELECT revision FROM catalog_meta WHERE id='catalog'").first<{revision:number}>();
 const cards=cr.results.map(r=>JSON.parse(r.data) as Card),albums=ar.results.map(r=>JSON.parse(r.data) as Album),changes=halloweenChanges(cards,albums,admin.userId,new Date().toISOString());
 const ids=new Set(changes.cards.map(c=>c.id));
 try{await commitCatalog({onceKey:HALLOWEEN_JOB,revision:meta!.revision,actor:admin,...changes,settings:[{id:HALLOWEEN_JOB,data:'true'}],before:{cards:cards.filter(c=>ids.has(c.id)),albums:albums.filter(a=>changes.albums.some(v=>v.id===a.id))},after:changes,action:'Import Halloween Edition · classement exclusif',entity:'5 modèles · univers Editions spéciales · albums Editions spéciales et Halloween'});}catch(error){if(!(await db().prepare('SELECT id FROM settings WHERE id=?').bind(HALLOWEEN_JOB).first()))throw error;}
}
