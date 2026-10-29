import {db,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Admin,type Album,type Card} from './model';
import {belongs} from './album-classification';
import manifest from './content/saint-pierre-import.json';
export const SAINT_PIERRE_JOB='saint-pierre-native-supreme-20261028-v1';
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function saintPierreChanges(cards:Card[],albums:Album[],actor:string,at:string){
 const item=manifest[0],previous=cards.find(c=>c.code===item.code),sameName=cards.find(c=>c.universe===item.universe&&norm(c.name)===norm(item.name)&&c.status!=='deleted');
 if(previous&&(previous.universe!==item.universe||norm(previous.name)!==norm(item.name)||previous.status==='deleted'))throw new HttpError(409,'Le numéro CAT-006 ne correspond plus à Saint Pierre. Aucun modèle remplacé.');
 if(sameName&&sameName.code!==item.code)throw new HttpError(409,'Saint Pierre possède un autre numéro. Aucun doublon créé.');
 if(!albums.some(a=>a.kind==='general'&&a.universe===item.universe&&a.status==='active'))throw new HttpError(409,'L’album principal Catholicisme doit être actif.');
 const card:Card={...EMPTY_RARITY,...previous,id:previous?.id||crypto.randomUUID(),code:item.code,name:previous?.name||item.name,universe:item.universe,category:previous?.category||item.category,description:previous?.description||item.description,rarity:'Suprême',rarityStatus:'validated',rarityProposal:null,rarityProposedBy:null,rarityProposedAt:null,rarityValidatedBy:actor,rarityValidatedAt:at,imageKey:item.imageKey,imageFit:'cover',imageCredit:'Création originale fournie par le créateur ATLAS',imageSource:'',albumIds:[],status:'ready',updatedAt:at};
 card.albumIds=[...new Set([...(previous?.albumIds||[]),...albums.filter(a=>a.status==='active'&&a.universe===item.universe&&(a.kind==='general'||belongs(card,a))).map(a=>a.id)])];
 return {cards:[card],albums:[] as Album[]};
}
export async function applySaintPierreMigration(admin:Admin&{userId:string}){
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(SAINT_PIERRE_JOB).first())return;
 const cr=await db().prepare('SELECT data FROM cards').all<{data:string}>(),ar=await db().prepare('SELECT data FROM albums').all<{data:string}>(),meta=await db().prepare("SELECT revision FROM catalog_meta WHERE id='catalog'").first<{revision:number}>();
 const cards=cr.results.map(r=>JSON.parse(r.data) as Card),albums=ar.results.map(r=>JSON.parse(r.data) as Album),changes=saintPierreChanges(cards,albums,admin.userId,new Date().toISOString()),id=changes.cards[0].id;
 try{await commitCatalog({onceKey:SAINT_PIERRE_JOB,revision:meta!.revision,actor:admin,...changes,settings:[{id:SAINT_PIERRE_JOB,data:JSON.stringify({code:manifest[0].code,sourceSha256:manifest[0].sourceSha256})}],before:{cards:cards.filter(c=>c.id===id)},after:changes,action:'Saint Pierre Suprême · modèle original importé',entity:'CAT-006 · modèle, textes et albums conservés'});}catch(error){if(!(await db().prepare('SELECT id FROM settings WHERE id=?').bind(SAINT_PIERRE_JOB).first()))throw error;}
}
