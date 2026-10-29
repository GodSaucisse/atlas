import {db,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Admin,type Album,type Card} from './model';
import manifest from './content/animals-fiction-images-20261029.json';
export const ANIMALS_FICTION_IMAGES_JOB='animals-50-fiction-50-images-20261029-v1';
const normalized=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function imageDraftChanges(existing:Card[],albums:Album[],at:string,items=manifest):Card[]{
 return items.map(item=>{
  const id=`animals-fiction-20261029-${item.code}`;
  if(existing.some(c=>c.code===item.code||c.id===id||(c.universe===item.universe&&normalized(c.name)===normalized(item.name))))throw new HttpError(409,`Le modèle ${item.code} existe déjà. Aucun modèle existant n’a été remplacé.`);
  if(!item.imageKey||!item.staticPath||!item.imageCredit||!item.imageSource)throw new HttpError(409,`Illustration incomplète : ${item.code}.`);
  const memberships=albums.filter(a=>item.albumIds.includes(a.id));
  if(memberships.length!==item.albumIds.length||!memberships.some(a=>a.kind==='general')||memberships.some(a=>a.universe!==item.universe||!['active','draft'].includes(a.status)))throw new HttpError(409,`Classement d’album invalide : ${item.code}.`);
  return {...EMPTY_RARITY,id,code:item.code,name:item.name,universe:item.universe,category:item.category,description:'',learningText:'',rarity:null,imageKey:item.imageKey,imageFit:item.imageFit==='contain'?'contain':'cover',imageCredit:item.imageCredit,imageSource:item.imageSource,albumIds:item.albumIds,status:'draft',updatedAt:at};
 });
}
export async function applyAnimalsFictionImagesMigration(admin:Admin&{userId:string}){
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(ANIMALS_FICTION_IMAGES_JOB).first())return;
 // Small, atomic chunks fit the storage batch limits and resume without rewriting edits.
 for(let start=0;start<manifest.length;start+=10){
  const key=`${ANIMALS_FICTION_IMAGES_JOB}:${start}`;
  if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(key).first())continue;
  const [cr,ar,meta]=await Promise.all([db().prepare('SELECT data FROM cards').all<{data:string}>(),db().prepare('SELECT data FROM albums').all<{data:string}>(),db().prepare("SELECT revision FROM catalog_meta WHERE id='catalog'").first<{revision:number}>()]);
  const cards=imageDraftChanges(cr.results.map(r=>JSON.parse(r.data)),ar.results.map(r=>JSON.parse(r.data)),new Date().toISOString(),manifest.slice(start,start+10));
  try{await commitCatalog({onceKey:key,revision:meta!.revision,actor:admin,cards,settings:[{id:key,data:JSON.stringify(cards.map(c=>c.code))}],before:null,after:cards,action:'Ajout de cartes illustrées en brouillon',entity:`${cards.length} cartes Animaux / Personnages fictifs · descriptions à compléter`});}catch(error){if(!(await db().prepare('SELECT id FROM settings WHERE id=?').bind(key).first()))throw error;}
 }
 await db().prepare('INSERT OR IGNORE INTO settings(id,data) VALUES(?,?)').bind(ANIMALS_FICTION_IMAGES_JOB,JSON.stringify({animals:50,fiction:50})).run();
}
