import {db,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Card,type Album,type Admin} from './model';
import manifest from './content/champion-jaylen-import.json';
export const CHAMPION_JAYLEN_JOB='champion-jaylen-brown-2024-v1';
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function championJaylenChanges(cards:Card[],albums:Album[],actor:string,at:string):Card[]{
 const main=albums.find(a=>a.id==='editions-speciales'&&a.kind==='general'&&a.universe==='Editions spéciales'&&a.status==='active');
 const champion=albums.find(a=>a.kind==='specialized'&&a.universe==='Editions spéciales'&&a.status==='active'&&['champion','championedition'].includes(norm(a.name)));
 if(!main||!champion)throw new HttpError(409,'Les albums Editions spéciales et Champion doivent être disponibles.');
 return manifest.map(item=>{
  if(cards.some(c=>c.code===item.code||(c.status!=='deleted'&&c.universe==='Editions spéciales'&&norm(c.name)===norm(item.name))))throw new HttpError(409,'Cette édition de Jaylen Brown existe déjà. Aucun modèle existant n’a été remplacé.');
  return {...EMPTY_RARITY,id:crypto.randomUUID(),code:item.code,name:item.name,universe:'Editions spéciales',category:item.category,description:'',learningText:'',rarity:'Editions spéciales',rarityStatus:'validated',rarityValidatedBy:actor,rarityValidatedAt:at,imageKey:item.imageKey,imageFit:'cover',imageCredit:'Modèle original fourni par le créateur ATLAS',imageSource:'',albumIds:[main.id,champion.id],status:'ready',updatedAt:at} satisfies Card;
 });
}
export async function applyChampionJaylenMigration(admin?:Admin&{userId:string}){
 const database=db(),existing=await database.prepare('SELECT data FROM settings WHERE id=?').bind(CHAMPION_JAYLEN_JOB).first<{data:string}>();if(existing)return JSON.parse(existing.data);
 const [cr,ar,meta]=await Promise.all([database.prepare('SELECT data FROM cards').all<{data:string}>(),database.prepare('SELECT data FROM albums').all<{data:string}>(),database.prepare("SELECT revision FROM catalog_meta WHERE id='catalog'").first<{revision:number}>()]);
 const actor=admin||{userId:'atlas:provided-champion-import',name:'ATLAS · Intégration du modèle Champion fourni'},cards=championJaylenChanges(cr.results.map(r=>JSON.parse(r.data)),ar.results.map(r=>JSON.parse(r.data)),actor.userId,new Date().toISOString());
 const summary={codes:cards.map(c=>c.code),count:cards.length};
 try{await commitCatalog({onceKey:CHAMPION_JAYLEN_JOB,revision:meta!.revision,actor,cards,settings:[{id:CHAMPION_JAYLEN_JOB,data:JSON.stringify(summary)}],before:null,after:cards,action:'Jaylen Brown · Champion Edition · modèle original animé',entity:'1 édition spéciale · album Champion'});return summary;}catch(error){const saved=await database.prepare('SELECT data FROM settings WHERE id=?').bind(CHAMPION_JAYLEN_JOB).first<{data:string}>();if(!saved)throw error;return JSON.parse(saved.data);}
}
export async function championJaylenStatus(){
 const database=db(),marker=await database.prepare('SELECT data FROM settings WHERE id=?').bind(CHAMPION_JAYLEN_JOB).first<{data:string}>(),row=await database.prepare('SELECT data FROM cards WHERE code=?').bind(manifest[0].code).first<{data:string}>();
 const card=row?JSON.parse(row.data) as Card:null,rows=await database.prepare('SELECT data FROM albums').all<{data:string}>(),albums=rows.results.map(r=>JSON.parse(r.data) as Album),champion=albums.find(a=>a.universe==='Editions spéciales'&&a.kind==='specialized'&&['champion','championedition'].includes(norm(a.name)));
 const anomalies:string[]=[];if(!marker)anomalies.push('Import non appliqué');if(!card||card.rarity!=='Editions spéciales'||card.universe!=='Editions spéciales'||card.status!=='ready'||card.rarityStatus!=='validated'||card.imageKey!==manifest[0].imageKey)anomalies.push('Carte absente ou incompatible');if(!card||!champion||!card.albumIds.includes(champion.id)||!card.albumIds.includes('editions-speciales')||card.albumIds.length!==2)anomalies.push('Classement incompatible');
 return {applied:!!marker,card:card?{code:card.code,name:card.name,rarity:card.rarity,status:card.status,imageKey:card.imageKey,albumIds:card.albumIds}:null,album:champion?{id:champion.id,name:champion.name}:null,anomalies};
}
