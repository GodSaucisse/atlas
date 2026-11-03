import {db,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Card,type Album} from './model';
import {belongs} from './album-classification';
import {BOOSTER_POLICY} from './config/boosters';
import manifest from './content/oct30-provided-import.json';
export const OCT30_PROVIDED_JOB='provided-joker-ironman-elephant-halloween-20261030-v1';
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const aliases:Record<string,string[]>={'FIC-135':['Le Joker','Joker'],'FIC-130':['Iron Man'],'ANI-101':['Éléphant de savane d’Afrique','Éléphant d’Afrique','Éléphant de savane africain'],'EDS-032':['Le Joker — Halloween','Joker — Halloween','Joker Halloween Edition']};
export function oct30ProvidedChanges(existing:Card[],albums:Album[],actor:string,at:string):Card[]{
 const active=albums.filter(a=>a.status==='active'),special=active.find(a=>a.kind==='general'&&a.universe==='Editions spéciales'),halloween=active.find(a=>a.kind==='specialized'&&a.universe==='Editions spéciales'&&norm(a.name)==='halloween');
 if(!special||!halloween)throw new HttpError(409,'Les albums Editions spéciales et Halloween doivent être disponibles.');
 return manifest.map(item=>{
  const previous=existing.find(c=>c.code===item.code),same=existing.filter(c=>c.status!=='deleted'&&c.universe===item.universe&&aliases[item.code].map(norm).includes(norm(c.name)));
  if(previous&&(previous.universe!==item.universe||!aliases[item.code].map(norm).includes(norm(previous.name))||['deleted','archived'].includes(previous.status)))throw new HttpError(409,'Numéro existant incompatible : '+item.code);
  if(same.some(c=>c.id!==previous?.id))throw new HttpError(409,'Un modèle portant ce nom utilise un autre numéro : '+item.name);
  const edition=item.rarity==='Editions spéciales',main=active.find(a=>a.kind==='general'&&a.universe===item.universe);if(!main)throw new HttpError(409,'Album principal absent : '+item.universe);
  const card:Card={...EMPTY_RARITY,...previous,id:previous?.id||crypto.randomUUID(),code:item.code,name:previous?.name||item.name,universe:item.universe,category:previous?.category||item.category,description:previous?.description||'',learningText:previous?.learningText||'',...(!previous?.description?.trim()&&!previous?.learningText?.trim()?{illustrationOnly:true}:{}),rarity:item.rarity,rarityStatus:'validated',rarityProposal:null,rarityProposedBy:null,rarityProposedAt:null,rarityValidatedBy:actor,rarityValidatedAt:at,imageKey:item.imageKey,imageFit:'cover',imageCredit:'Modèle original fourni par le créateur ATLAS',imageSource:'',albumIds:[],status:'ready',updatedAt:at};
  card.albumIds=edition?[special.id,halloween.id]:[...new Set([...(previous?.albumIds||[]),main.id,...active.filter(a=>a.kind==='specialized'&&belongs(card,a)).map(a=>a.id)])];if(edition)card.editionSubjectUniverse=undefined;
  return card;
 });
}
async function snapshot(){const database=db(),[cr,ar,meta,marker]=await Promise.all([database.prepare('SELECT data FROM cards').all<{data:string}>(),database.prepare('SELECT data FROM albums').all<{data:string}>(),database.prepare("SELECT revision FROM catalog_meta WHERE id='catalog'").first<{revision:number}>(),database.prepare('SELECT data FROM settings WHERE id=?').bind(OCT30_PROVIDED_JOB).first<{data:string}>()]);return {cards:cr.results.map(r=>JSON.parse(r.data) as Card),albums:ar.results.map(r=>JSON.parse(r.data) as Album),revision:meta?.revision,marker};}
export async function applyOct30ProvidedMigration(){
 const state=await snapshot();if(state.marker)return JSON.parse(state.marker.data);if(state.revision===undefined)throw new HttpError(409,'Catalogue indisponible.');
 const actor={userId:'atlas:provided-models-20261030',name:'ATLAS · Modèles originaux fournis par Mathis'},cards=oct30ProvidedChanges(state.cards,state.albums,actor.userId,new Date().toISOString()),summary={count:cards.length,codes:cards.map(c=>c.code)};
 try{await commitCatalog({onceKey:OCT30_PROVIDED_JOB,revision:state.revision,actor,cards,settings:[{id:OCT30_PROVIDED_JOB,data:JSON.stringify(summary)}],before:state.cards.filter(c=>cards.some(n=>n.id===c.id)),after:cards,action:'3 modèles Suprêmes et 1 édition Halloween · modèles originaux fournis',entity:'Joker · Iron Man · Éléphant d’Afrique · Joker Halloween'});return summary;}catch(error){const saved=await db().prepare('SELECT data FROM settings WHERE id=?').bind(OCT30_PROVIDED_JOB).first<{data:string}>();if(!saved)throw error;return JSON.parse(saved.data);}
}
export async function oct30ProvidedStatus(){
 const state=await snapshot(),anomalies:string[]=[];
 if(!state.marker){try{oct30ProvidedChanges(state.cards,state.albums,'preflight',new Date().toISOString())}catch(e){anomalies.push(e instanceof Error?e.message:'Préparation impossible')}}
 else for(const item of manifest){const cards=state.cards.filter(c=>c.code===item.code),c=cards[0];if(cards.length!==1||!c||c.status!=='ready'||c.rarity!==item.rarity||c.rarityStatus!=='validated'||c.rarityProposal||c.imageKey!==item.imageKey||c.universe!==item.universe)anomalies.push('Carte absente ou incompatible : '+item.code);const main=state.albums.find(a=>a.kind==='general'&&a.universe===item.universe&&a.status==='active');if(!c||!main||!c.albumIds.includes(main.id))anomalies.push('Album principal incompatible : '+item.code);if(c?.rarity==='Editions spéciales'){const halloween=state.albums.find(a=>a.kind==='specialized'&&a.universe==='Editions spéciales'&&norm(a.name)==='halloween'&&a.status==='active');if(!halloween||!c.albumIds.includes(halloween.id)||c.albumIds.length!==2)anomalies.push('Album Halloween incompatible');}}
 return {applied:!!state.marker,cards:state.cards.filter(c=>manifest.some(m=>m.code===c.code)).map(c=>({id:c.id,code:c.code,name:c.name,rarity:c.rarity,rarityStatus:c.rarityStatus,status:c.status,imageKey:c.imageKey,albumIds:c.albumIds})),editionRates:Object.fromEntries(BOOSTER_POLICY.boosters.map(b=>[b.id,b.rates[6]/1000])),anomalies};
}
