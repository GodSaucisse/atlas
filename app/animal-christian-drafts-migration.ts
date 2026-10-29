import {db,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Admin,type Album,type Card} from './model';
import manifest from './content/animal-christian-drafts-20261028.json';
export const ANIMAL_CHRISTIAN_JOB='animals-100-christian-25-drafts-20261028-v1';
export const ANIMAL_GROUPS=['Mammifères','Oiseaux','Reptiles','Amphibiens','Poissons','Invertébrés'];
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function animalDraftAlbums(existing:Album[],at:string):Album[]{
 const proposals=[{id:'animaux',name:'Animaux',universe:'Animaux',kind:'general' as const,description:'La diversité du monde animal : anatomie, milieux de vie, comportements et conservation.'},...ANIMAL_GROUPS.map(name=>({id:`animaux-${norm(name)}`,name,universe:'Animaux',kind:'specialized' as const,description:`Les ${name.toLowerCase()} : espèces, adaptations, écologie et relations avec les humains.`})),{id:'chretiente-textes-sacres',name:'Textes sacrés',universe:'Chrétienté',kind:'specialized' as const,description:'Écritures, théologie et textes de référence du catholicisme.'}];
 return proposals.flatMap(p=>{const old=existing.find(a=>a.universe===p.universe&&a.kind===p.kind&&norm(a.name)===norm(p.name)&&a.status!=='deleted');if(old){if(p.universe==='Animaux'&&old.status!=='draft')throw new HttpError(409,'Un album Animaux existe déjà hors brouillon. Aucun album existant n’a été remplacé.');return [];}if(existing.some(a=>a.id===p.id))throw new HttpError(409,`Identifiant d’album déjà utilisé : ${p.id}.`);return [{...p,status:'draft' as const,updatedAt:at}];});
}
export function animalChristianDraftChanges(existing:Card[],albums:Album[],at:string,items=manifest):Card[]{
 return items.map(item=>{
  if(existing.some(c=>c.code===item.code||c.id===item.id||(c.status!=='deleted'&&c.universe===item.universe&&norm(c.name)===norm(item.name))))throw new HttpError(409,`Le brouillon ${item.code} existe déjà. Aucun modèle existant n’a été remplacé.`);
  const main=albums.find(a=>a.universe===item.universe&&a.kind==='general'&&['active','draft'].includes(a.status));if(!main)throw new HttpError(409,`Album principal absent : ${item.universe}.`);
  const specialized=item.specializedAlbums.map(name=>{const a=albums.find(a=>a.universe===item.universe&&a.kind==='specialized'&&norm(a.name)===norm(name)&&['active','draft'].includes(a.status));if(!a)throw new HttpError(409,`Album spécialisé absent : ${name}.`);return a;});
  if(item.universe==='Animaux'&&(!ANIMAL_GROUPS.includes(item.category)||main.status!=='draft'||specialized.some(a=>a.status!=='draft')))throw new HttpError(409,'Les nouveaux albums Animaux doivent rester en brouillon.');
  return {...EMPTY_RARITY,id:item.id,code:item.code,name:item.name,universe:item.universe,category:item.category,description:item.description,learningText:item.learningText,rarity:null,imageKey:item.imageKey,imageFit:'cover',imageCredit:item.imageCredit,imageSource:item.imageSource,albumIds:[main.id,...specialized.map(a=>a.id)],status:'draft',updatedAt:at};
 });
}
export async function applyAnimalChristianDraftsMigration(admin:Admin&{userId:string}){
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(ANIMAL_CHRISTIAN_JOB).first())return;
 const albumKey=ANIMAL_CHRISTIAN_JOB+':albums';
 if(!(await db().prepare('SELECT id FROM settings WHERE id=?').bind(albumKey).first())){
  const [ar,meta]=await Promise.all([db().prepare('SELECT data FROM albums').all<{data:string}>(),db().prepare("SELECT revision FROM catalog_meta WHERE id='catalog'").first<{revision:number}>()]);const albums=animalDraftAlbums(ar.results.map(r=>JSON.parse(r.data)),new Date().toISOString());
  try{await commitCatalog({onceKey:albumKey,revision:meta!.revision,actor:admin,albums,settings:[{id:albumKey,data:JSON.stringify(albums.map(a=>a.id))}],before:null,after:albums,action:'Nouvel univers Animaux et albums en brouillon',entity:'Album principal · 6 albums spécialisés · Textes sacrés Chrétienté'});}catch(error){if(!(await db().prepare('SELECT id FROM settings WHERE id=?').bind(albumKey).first()))throw error;}
 }
 for(let start=0;start<manifest.length;start+=15){
  const key=`${ANIMAL_CHRISTIAN_JOB}:${start}`;if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(key).first())continue;
  const [cr,ar,meta]=await Promise.all([db().prepare('SELECT data FROM cards').all<{data:string}>(),db().prepare('SELECT data FROM albums').all<{data:string}>(),db().prepare("SELECT revision FROM catalog_meta WHERE id='catalog'").first<{revision:number}>()]);
  const cards=animalChristianDraftChanges(cr.results.map(r=>JSON.parse(r.data)),ar.results.map(r=>JSON.parse(r.data)),new Date().toISOString(),manifest.slice(start,start+15));
  try{await commitCatalog({onceKey:key,revision:meta!.revision,actor:admin,cards,settings:[{id:key,data:JSON.stringify(cards.map(c=>c.code))}],before:null,after:cards,action:'Ajout de brouillons documentés Animaux et Chrétienté',entity:`${cards.length} cartes · illustrations et textes longs sourcés · raretés à valider`});}catch(error){if(!(await db().prepare('SELECT id FROM settings WHERE id=?').bind(key).first()))throw error;}
 }
 await db().prepare('INSERT OR IGNORE INTO settings(id,data) VALUES(?,?)').bind(ANIMAL_CHRISTIAN_JOB,JSON.stringify({animals:100,christian:25})).run();
}
