import {db,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Admin,type Album,type Card} from './model';
import {belongs} from './album-classification';
import manifest from './content/october-supreme-import.json';
export const OCTOBER_SUPREME_JOB='eighteen-original-supremes-20261028-v1';
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function octoberSupremeChanges(cards:Card[],albums:Album[],actor:string,at:string){
 const createdAlbums:Album[]=[],allAlbums=[...albums];
 for(const universe of [...new Set(manifest.map(c=>c.universe))]){
  if(allAlbums.some(a=>a.universe===universe&&a.kind==='general'&&a.status==='active'))continue;
  const name=universe==='Chrétienté'?'Catholicisme':universe,id=universe==='Chrétienté'?'catholicisme':universe==='Militaire'?'militaire':'personnages-fictifs';
  if(allAlbums.some(a=>a.id===id))throw new HttpError(409,`L’album principal ${name} doit être actif avant cet import.`);
  const album:Album={id,name,universe,kind:'general',status:'active',description:`La collection ${name} d’ATLAS.`,updatedAt:at};allAlbums.push(album);createdAlbums.push(album);
 }
 const output=manifest.map(item=>{
  const codeMatch=cards.find(c=>c.code===item.code),nameMatch=cards.find(c=>c.universe===item.universe&&norm(c.name)===norm(item.name)&&c.status!=='deleted');
  if(codeMatch&&(codeMatch.universe!==item.universe||norm(codeMatch.name)!==norm(item.name)||codeMatch.status==='deleted'))throw new HttpError(409,`Le numéro ${item.code} ne correspond plus au modèle demandé.`);
  if(nameMatch&&nameMatch.code!==item.code)throw new HttpError(409,`Le modèle ${item.name} possède un autre numéro ; aucun doublon créé.`);
  const previous=codeMatch||nameMatch;
  const card:Card={...EMPTY_RARITY,...previous,id:previous?.id||crypto.randomUUID(),code:item.code,name:previous?.name||item.name,universe:item.universe,category:previous?.category||item.category,description:previous?.description||item.description,rarity:'Suprême',rarityStatus:'validated',rarityProposal:null,rarityProposedBy:null,rarityProposedAt:null,rarityValidatedBy:actor,rarityValidatedAt:at,imageKey:item.imageKey,imageFit:'cover',imageCredit:'Création originale fournie par le créateur ATLAS',imageSource:'',albumIds:[],status:'ready',updatedAt:at};
  // Retain valid manual classifications, and apply the existing official classifiers.
  card.albumIds=[...new Set([...(previous?.albumIds||[]).filter(id=>allAlbums.some(a=>a.id===id&&a.status==='active'&&a.universe===card.universe)),...allAlbums.filter(a=>a.status==='active'&&a.universe===card.universe&&(a.kind==='general'||belongs(card,a))).map(a=>a.id)])];
  return card;
 });
 return {cards:output,albums:createdAlbums};
}
export async function applyOctoberSupremeMigration(admin:Admin&{userId:string}){
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(OCTOBER_SUPREME_JOB).first())return;
 const cr=await db().prepare('SELECT data FROM cards').all<{data:string}>(),ar=await db().prepare('SELECT data FROM albums').all<{data:string}>(),meta=await db().prepare("SELECT revision FROM catalog_meta WHERE id='catalog'").first<{revision:number}>();
 const cards=cr.results.map(r=>JSON.parse(r.data) as Card),albums=ar.results.map(r=>JSON.parse(r.data) as Album),changes=octoberSupremeChanges(cards,albums,admin.userId,new Date().toISOString()),ids=new Set(changes.cards.map(c=>c.id));
 try{await commitCatalog({onceKey:OCTOBER_SUPREME_JOB,revision:meta!.revision,actor:admin,...changes,settings:[{id:OCTOBER_SUPREME_JOB,data:JSON.stringify({codes:manifest.map(c=>c.code),sources:manifest.map(c=>({code:c.code,sha256:c.sourceSha256}))})}],before:{cards:cards.filter(c=>ids.has(c.id)),albums:[]},after:changes,action:'18 modèles Suprêmes originaux · import demandé par Mathis',entity:'Militaire · Catholicisme · Personnages fictifs · modèles existants conservés'});}catch(error){if(!(await db().prepare('SELECT id FROM settings WHERE id=?').bind(OCTOBER_SUPREME_JOB).first()))throw error;}
}
