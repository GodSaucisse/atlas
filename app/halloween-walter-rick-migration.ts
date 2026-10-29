import {db,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Card,type Album,type Admin} from './model';
import manifest from './content/halloween-walter-rick-import.json';
export const HALLOWEEN_WALTER_RICK_JOB='halloween-walter-rick-20261029-v1';
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function halloweenWalterRickChanges(cards:Card[],albums:Album[],actor:string,at:string):Card[]{
 const main=albums.find(a=>a.id==='editions-speciales'&&a.universe==='Editions spéciales'&&a.kind==='general'&&a.status==='active'),halloween=albums.find(a=>a.universe==='Editions spéciales'&&a.kind==='specialized'&&norm(a.name)==='halloween'&&a.status==='active');
 if(!main||!halloween)throw new HttpError(409,'Les albums Editions spéciales et Halloween doivent être disponibles.');
 return manifest.map(item=>{if(cards.some(c=>c.code===item.code||(c.universe==='Editions spéciales'&&c.status!=='deleted'&&norm(c.name)===norm(item.name))))throw new HttpError(409,`Le modèle ${item.code} existe déjà. Aucun modèle existant n’a été remplacé.`);
  return {...EMPTY_RARITY,id:crypto.randomUUID(),code:item.code,name:item.name,universe:'Editions spéciales',category:item.category,description:'',learningText:'',rarity:'Editions spéciales',rarityStatus:'validated',rarityValidatedBy:actor,rarityValidatedAt:at,imageKey:item.imageKey,imageFit:'cover',imageCredit:'Création originale fournie par le créateur ATLAS',imageSource:'',albumIds:[main.id,halloween.id],status:'ready',updatedAt:at} satisfies Card;
 });
}
export async function applyHalloweenWalterRickMigration(admin:Admin&{userId:string}){
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(HALLOWEEN_WALTER_RICK_JOB).first())return;
 const [cr,ar,meta]=await Promise.all([db().prepare('SELECT data FROM cards').all<{data:string}>(),db().prepare('SELECT data FROM albums').all<{data:string}>(),db().prepare("SELECT revision FROM catalog_meta WHERE id='catalog'").first<{revision:number}>()]);
 const cards=halloweenWalterRickChanges(cr.results.map(r=>JSON.parse(r.data)),ar.results.map(r=>JSON.parse(r.data)),admin.userId,new Date().toISOString());
 try{await commitCatalog({onceKey:HALLOWEEN_WALTER_RICK_JOB,revision:meta!.revision,actor:admin,cards,settings:[{id:HALLOWEEN_WALTER_RICK_JOB,data:JSON.stringify(cards.map(c=>c.code))}],before:null,after:cards,action:'Import Walter White et Rick Grimes · Halloween',entity:'2 Editions spéciales · albums exclusifs · sans description'});}catch(error){if(!(await db().prepare('SELECT id FROM settings WHERE id=?').bind(HALLOWEEN_WALTER_RICK_JOB).first()))throw error;}
}
