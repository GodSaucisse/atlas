import {db,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Card,type Album,type Admin} from './model';
import manifest from './content/comics-edition-import.json';
export const COMICS_EDITION_JOB='comics-edition-five-original-models-20261030-v1';
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function comicsEditionChanges(cards:Card[],albums:Album[],actor:string,at:string){
 const main=albums.find(a=>a.id==='editions-speciales'&&a.kind==='general'&&a.universe==='Editions spéciales'&&a.status==='active');
 if(!main)throw new HttpError(409,'L’album principal Editions spéciales doit être disponible.');
 const matches=albums.filter(a=>a.kind==='specialized'&&a.universe==='Editions spéciales'&&a.status!=='deleted'&&norm(a.name)==='comicsedition');
 if(matches.length>1)throw new HttpError(409,'Plusieurs albums Comics Edition existent. Aucun import effectué.');
 const previous=matches[0],album:Album=previous?{...previous,status:'active',updatedAt:at}:{id:crypto.randomUUID(),name:'Comics Edition',universe:'Editions spéciales',kind:'specialized',description:'Les créations originales Comics Edition d’ATLAS.',status:'active',updatedAt:at};
 const additions:Card[]=manifest.map(item=>{
  if(cards.some(c=>c.code===item.code||(c.status!=='deleted'&&c.universe==='Editions spéciales'&&norm(c.name)===norm(item.name))))throw new HttpError(409,`Le modèle ${item.name} existe déjà. Aucun modèle existant n’a été remplacé.`);
  return {...EMPTY_RARITY,id:crypto.randomUUID(),code:item.code,name:item.name,universe:'Editions spéciales',category:item.category,description:'',learningText:'',rarity:'Editions spéciales',rarityStatus:'validated',rarityValidatedBy:actor,rarityValidatedAt:at,imageKey:item.imageKey,imageFit:'cover',imageCredit:'Modèle original fourni par le créateur ATLAS',imageSource:'',albumIds:[main.id,album.id],status:'ready',updatedAt:at} satisfies Card;
 });
 return {cards:additions,albums:!previous||previous.status!=='active'?[album]:[],album};
}
export async function applyComicsEditionMigration(admin?:Admin&{userId:string}){
 const database=db(),existing=await database.prepare('SELECT data FROM settings WHERE id=?').bind(COMICS_EDITION_JOB).first<{data:string}>();if(existing)return JSON.parse(existing.data);
 const [cr,ar,meta]=await Promise.all([database.prepare('SELECT data FROM cards').all<{data:string}>(),database.prepare('SELECT data FROM albums').all<{data:string}>(),database.prepare("SELECT revision FROM catalog_meta WHERE id='catalog'").first<{revision:number}>()]);
 const actor=admin||{userId:'atlas:provided-comics-import',name:'ATLAS · Intégration des modèles Comics fournis'},changes=comicsEditionChanges(cr.results.map(r=>JSON.parse(r.data)),ar.results.map(r=>JSON.parse(r.data)),actor.userId,new Date().toISOString());
 const summary={codes:changes.cards.map(c=>c.code),count:changes.cards.length,albumId:changes.album.id};
 try{await commitCatalog({onceKey:COMICS_EDITION_JOB,revision:meta!.revision,actor,cards:changes.cards,albums:changes.albums,settings:[{id:COMICS_EDITION_JOB,data:JSON.stringify(summary)}],before:null,after:{cards:changes.cards,album:changes.album},action:'5 modèles originaux animés · Comics Edition',entity:'Spider-Man, Wolverine, Hulk, Captain America, Iron Man · Editions spéciales'});return summary;}catch(error){const saved=await database.prepare('SELECT data FROM settings WHERE id=?').bind(COMICS_EDITION_JOB).first<{data:string}>();if(!saved)throw error;return JSON.parse(saved.data);}
}
export async function comicsEditionStatus(){
 const database=db(),marker=await database.prepare('SELECT data FROM settings WHERE id=?').bind(COMICS_EDITION_JOB).first<{data:string}>(),rows=await database.prepare('SELECT data FROM cards WHERE code IN ('+manifest.map(()=>'?').join(',')+')').bind(...manifest.map(c=>c.code)).all<{data:string}>(),ar=await database.prepare('SELECT data FROM albums').all<{data:string}>();
 const cards=rows.results.map(r=>JSON.parse(r.data) as Card),albums=ar.results.map(r=>JSON.parse(r.data) as Album),matches=albums.filter(a=>a.kind==='specialized'&&a.universe==='Editions spéciales'&&a.status==='active'&&norm(a.name)==='comicsedition'),album=matches[0];
 const anomalies:string[]=[];if(!marker)anomalies.push('Import non appliqué');if(matches.length!==1)anomalies.push('Album Comics Edition absent ou dupliqué');
 for(const item of manifest){const c=cards.find(c=>c.code===item.code);if(!c||c.rarity!=='Editions spéciales'||c.universe!=='Editions spéciales'||c.status!=='ready'||c.rarityStatus!=='validated'||c.imageKey!==item.imageKey)anomalies.push('Carte absente ou incompatible : '+item.code);if(!c||!album||!c.albumIds.includes('editions-speciales')||!c.albumIds.includes(album.id)||c.albumIds.length!==2)anomalies.push('Classement incompatible : '+item.code);}
 return {applied:!!marker,album:album?{id:album.id,name:album.name,status:album.status}:null,cards:cards.map(c=>({code:c.code,name:c.name,rarity:c.rarity,status:c.status,imageKey:c.imageKey,albumIds:c.albumIds})),anomalies};
}
