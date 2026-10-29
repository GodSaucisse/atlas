import {db,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Admin,type Album,type Card} from './model';
import manifest from './content/research-drafts-20261028.json';
export const RESEARCH_DRAFTS_JOB='research-drafts-150-20261028-v1';
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function researchDraftChanges(existing:Card[],albums:Album[],at:string,items=manifest):Card[]{
 return items.map(item=>{
  if(existing.some(c=>c.code===item.code||c.id===item.id||(c.status!=='deleted'&&c.universe===item.universe&&norm(c.name)===norm(item.name))))throw new HttpError(409,`Le brouillon ${item.code} existe déjà. Aucun modèle existant n’a été remplacé.`);
  const main=albums.find(a=>a.universe===item.universe&&a.kind==='general'&&a.status==='active');if(!main)throw new HttpError(409,`Album principal absent : ${item.universe}.`);
  const specialized=albums.filter(a=>a.universe===item.universe&&a.kind==='specialized'&&a.status==='active'&&item.specializedAlbums.includes(a.name));
  return {...EMPTY_RARITY,id:item.id,code:item.code,name:item.name,universe:item.universe,category:item.category,description:item.description,learningText:item.learningText,rarity:null,imageKey:item.imageKey,imageFit:'cover',imageCredit:item.imageCredit,imageSource:item.imageSource,albumIds:[main.id,...specialized.map(a=>a.id)],status:'draft',updatedAt:at};
 });
}
export async function applyResearchDraftsMigration(admin:Admin&{userId:string}){
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(RESEARCH_DRAFTS_JOB).first())return;
 for(let start=0;start<manifest.length;start+=15){
  const key=`${RESEARCH_DRAFTS_JOB}:${start}`;
  if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(key).first())continue;
  const [cr,ar,meta]=await Promise.all([db().prepare('SELECT data FROM cards').all<{data:string}>(),db().prepare('SELECT data FROM albums').all<{data:string}>(),db().prepare("SELECT revision FROM catalog_meta WHERE id='catalog'").first<{revision:number}>()]);
  const cards=researchDraftChanges(cr.results.map(r=>JSON.parse(r.data)),ar.results.map(r=>JSON.parse(r.data)),new Date().toISOString(),manifest.slice(start,start+15));
  try{await commitCatalog({onceKey:key,revision:meta!.revision,actor:admin,cards,settings:[{id:key,data:JSON.stringify(cards.map(c=>c.code))}],before:null,after:cards,action:'Ajout de brouillons documentés Histoire et NBA',entity:`${cards.length} cartes · textes longs et illustrations sourcées · raretés à valider`});}catch(error){if(!(await db().prepare('SELECT id FROM settings WHERE id=?').bind(key).first()))throw error;}
 }
 await db().prepare('INSERT OR IGNORE INTO settings(id,data) VALUES(?,?)').bind(RESEARCH_DRAFTS_JOB,JSON.stringify({count:manifest.length,history:100,nba:50})).run();
}
