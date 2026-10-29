import {db,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Admin,type Album,type Card} from './model';
import {belongs} from './album-classification';
import manifest from './content/remaining-supreme-import.json';
export const REMAINING_SUPREME_JOB='remaining-nine-supremes-champion-edition-20261028-v2';
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function remainingSupremeChanges(cards:Card[],albums:Album[],actor:string,at:string){
 const principal=albums.find(a=>a.id==='editions-speciales'&&a.status==='active');if(!principal)throw new HttpError(409,'Album Editions spéciales absent.');
 const oldChampion=albums.find(a=>norm(a.name)==='champion'&&a.status!=='deleted')||albums.find(a=>norm(a.name)==='championedition'&&a.status!=='deleted');
 if(oldChampion&&(oldChampion.universe!=='Editions spéciales'||oldChampion.kind!=='specialized'))throw new HttpError(409,'Champion Edition possède un classement incompatible.');
 const champion:Album={...oldChampion,id:oldChampion?.id||'editions-speciales-champion',name:oldChampion?.name||'Champion',universe:'Editions spéciales',kind:'specialized',status:'active',description:'Les cartes Champion Edition d’ATLAS.',updatedAt:at};
 if(!oldChampion&&albums.some(a=>a.id===champion.id))throw new HttpError(409,'Identifiant Champion Edition déjà utilisé.');
 const duplicates=albums.filter(a=>a.id!==champion.id&&a.universe==='Editions spéciales'&&a.kind==='specialized'&&norm(a.name)==='championedition'&&a.status==='active').map(a=>({...a,status:'deleted' as const,updatedAt:at}));
 const allAlbums=[...albums.filter(a=>a.id!==champion.id&&!duplicates.some(d=>d.id===a.id)),champion,...duplicates];
 const changed:Card[]=manifest.map(item=>{
  const isEdition=item.rarity==='Editions spéciales',previous=cards.find(c=>c.code===item.code),same=cards.find(c=>c.status!=='deleted'&&c.universe===item.universe&&norm(c.name)===norm(item.name));
  if(previous&&(previous.status==='deleted'||previous.universe!==item.universe||norm(previous.name)!==norm(item.name)))throw new HttpError(409,`Numéro incompatible : ${item.code}.`);
  if(same&&same.code!==item.code)throw new HttpError(409,`Le modèle ${item.name} existe avec un autre numéro.`);
  if(!isEdition&&!allAlbums.some(a=>a.status==='active'&&a.kind==='general'&&a.universe===item.universe))throw new HttpError(409,`Album principal absent : ${item.universe}.`);
  const c:Card={...EMPTY_RARITY,...previous,id:previous?.id||crypto.randomUUID(),code:item.code,name:previous?.name||item.name,universe:item.universe,category:previous?.category||item.category,description:previous?.description||item.description,rarity:isEdition?'Editions spéciales':'Suprême',rarityStatus:'validated',rarityProposal:null,rarityProposedBy:null,rarityProposedAt:null,rarityValidatedBy:actor,rarityValidatedAt:at,imageKey:item.imageKey,imageFit:'cover',imageCredit:'Création originale fournie par le créateur ATLAS',imageSource:'',albumIds:[],status:'ready',updatedAt:at};
  c.albumIds=isEdition?[principal.id,champion.id]:[...new Set([...(previous?.albumIds||[]).filter(id=>allAlbums.some(a=>a.id===id&&a.status==='active'&&a.universe===c.universe)),...allAlbums.filter(a=>a.status==='active'&&a.universe===c.universe&&(a.kind==='general'||belongs(c,a))).map(a=>a.id)])];
  if(isEdition)c.editionSubjectUniverse=undefined;
  return c;
 });
 // Edition membership follows the edition printed on the template, never its subject.
 const halloween=albums.find(a=>a.universe==='Editions spéciales'&&a.kind==='specialized'&&norm(a.name)==='halloween'&&a.status==='active');
 const halloweenCodes=new Set(['EDS-002','EDS-003','EDS-004','EDS-005','EDS-006','EDS-007','EDS-008']);
 for(const old of cards.filter(c=>c.universe==='Editions spéciales'&&c.status!=='deleted')){
  if(changed.some(c=>c.id===old.id))continue;
  const editionAlbums=old.albumIds.filter(id=>allAlbums.some(a=>a.id===id&&a.kind==='specialized'&&a.universe==='Editions spéciales'&&a.status==='active'));
  if(halloweenCodes.has(old.code)){if(!halloween)throw new HttpError(409,'Album Halloween absent.');editionAlbums.push(halloween.id);}
  const albumIds=[...new Set([principal.id,...editionAlbums])];
  if(JSON.stringify(albumIds)!==JSON.stringify(old.albumIds)||old.editionSubjectUniverse)changed.push({...old,rarity:'Editions spéciales',editionSubjectUniverse:undefined,albumIds,updatedAt:at});
 }
 return {cards:changed,albums:[champion,...duplicates]};
}
export async function applyRemainingSupremeMigration(admin:Admin&{userId:string}){
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(REMAINING_SUPREME_JOB).first())return;
 const cr=await db().prepare('SELECT data FROM cards').all<{data:string}>(),ar=await db().prepare('SELECT data FROM albums').all<{data:string}>(),meta=await db().prepare("SELECT revision FROM catalog_meta WHERE id='catalog'").first<{revision:number}>();
 const cards=cr.results.map(r=>JSON.parse(r.data) as Card),albums=ar.results.map(r=>JSON.parse(r.data) as Album),changes=remainingSupremeChanges(cards,albums,admin.userId,new Date().toISOString()),ids=new Set(changes.cards.map(c=>c.id));
 try{await commitCatalog({onceKey:REMAINING_SUPREME_JOB,revision:meta!.revision,actor:admin,...changes,settings:[{id:REMAINING_SUPREME_JOB,data:JSON.stringify({codes:manifest.map(c=>c.code)})}],before:{cards:cards.filter(c=>ids.has(c.id)),albums:albums.filter(a=>changes.albums.some(v=>v.id===a.id))},after:changes,action:'9 modèles Suprêmes et Champion Edition · classement corrigé',entity:'Templates originaux · Editions spéciales distinctes des Suprêmes'});}catch(error){if(!(await db().prepare('SELECT id FROM settings WHERE id=?').bind(REMAINING_SUPREME_JOB).first()))throw error;}
}
