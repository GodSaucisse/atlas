import {env} from 'cloudflare:workers';
import {db,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Card,type Album} from './model';
import {belongs} from './album-classification';
import manifest from './content/illustration-cards-20261030.json';
export const ILLUSTRATION_CARDS_JOB='illustration-only-25-french-cheeses-50-geography-24-unarmed-military-20261030-v1';
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function illustrationCardChanges(existing:Card[],albums:Album[],at:string):Card[]{
 const active=albums.filter(a=>a.status==='active');
 return manifest.map(item=>{
  if(existing.some(c=>c.code===item.code||c.id===item.id||(c.status!=='deleted'&&c.universe===item.universe&&norm(c.name)===norm(item.name))))throw new HttpError(409,`La carte ${item.name} existe déjà. Aucun modèle remplacé.`);
  const main=active.find(a=>a.kind==='general'&&a.universe===item.universe);if(!main)throw new HttpError(409,`Album principal absent : ${item.universe}.`);
  const card:Card={...EMPTY_RARITY,id:item.id,code:item.code,name:item.name,universe:item.universe,category:item.category,description:'',learningText:'',illustrationOnly:true,rarity:null,imageKey:item.imageKey,imageFit:'contain',imageCredit:item.imageCredit,imageSource:item.imageSource,albumIds:[main.id],status:'draft',updatedAt:at};
  card.albumIds=[...new Set([...card.albumIds,...active.filter(a=>a.kind==='specialized'&&belongs(card,a)).map(a=>a.id)])];
  return card;
 });
}
async function snapshot(){const database=db();const [cr,ar,meta,marker]=await Promise.all([database.prepare('SELECT data FROM cards').all<{data:string}>(),database.prepare('SELECT data FROM albums').all<{data:string}>(),database.prepare("SELECT revision FROM catalog_meta WHERE id='catalog'").first<{revision:number}>(),database.prepare('SELECT data FROM settings WHERE id=?').bind(ILLUSTRATION_CARDS_JOB).first<{data:string}>()]);return {cards:cr.results.map(r=>JSON.parse(r.data) as Card),albums:ar.results.map(r=>JSON.parse(r.data) as Album),revision:meta?.revision,marker};}
export async function applyIllustrationCardsMigration(){
 const state=await snapshot();if(state.marker)return JSON.parse(state.marker.data);
 if(state.revision===undefined)throw new HttpError(409,'Catalogue indisponible.');
 await requireIllustrationImages();
 const cards=illustrationCardChanges(state.cards,state.albums,new Date().toISOString()),summary={count:cards.length,counts:{Fromages:25,'Géographie':50,Militaire:24},codes:cards.map(c=>c.code)};
 try{await commitCatalog({onceKey:ILLUSTRATION_CARDS_JOB,revision:state.revision,actor:{userId:'atlas:illustration-cards-request',name:'ATLAS · Ajout demandé par Mathis'},cards,settings:[{id:ILLUSTRATION_CARDS_JOB,data:JSON.stringify(summary)}],before:null,after:cards,action:'99 cartes illustrées sans description · raretés à valider',entity:'25 fromages français · 50 lieux géographiques · 24 équipements militaires sans armes'});return summary;}catch(error){const saved=await db().prepare('SELECT data FROM settings WHERE id=?').bind(ILLUSTRATION_CARDS_JOB).first<{data:string}>();if(!saved)throw error;return JSON.parse(saved.data);}
}
export async function illustrationCardsStatus(){
 const state=await snapshot(),cards=state.cards.filter(c=>manifest.some(m=>m.id===c.id)),anomalies:string[]=[];
 if(state.marker){
  for(const m of manifest){const c=cards.find(c=>c.id===m.id),main=state.albums.find(a=>a.universe===m.universe&&a.kind==='general'&&a.status==='active');
   if(!c||c.code!==m.code||c.name!==m.name||c.universe!==m.universe||c.status!=='draft'||c.rarity!==null||c.rarityStatus!=='pending'||!c.illustrationOnly||c.description!==''||c.learningText!==''||c.imageKey!==m.imageKey||!main||!c.albumIds.includes(main.id))anomalies.push('Carte absente ou incompatible : '+m.code);
   if(state.cards.some(o=>o.id!==m.id&&(o.code===m.code||(o.status!=='deleted'&&o.universe===m.universe&&norm(o.name)===norm(m.name)))))anomalies.push('Doublon : '+m.code);
  }
 }else{try{illustrationCardChanges(state.cards,state.albums,new Date().toISOString())}catch(e){anomalies.push(e instanceof Error?e.message:'Préparation impossible')}}
 if(state.marker){try{await requireIllustrationImages()}catch(e){anomalies.push(e instanceof Error?e.message:'Illustrations indisponibles')}}
 return {applied:!!state.marker,count:cards.length,counts:Object.fromEntries(['Fromages','Géographie','Militaire'].map(u=>[u,cards.filter(c=>c.universe===u).length])),anomalies};
}

export function illustrationImage(key:string){const item=manifest.find(m=>m.imageKey===key);if(!item)throw new HttpError(404,'Illustration inconnue.');return item;}
export async function verifyIllustrationBytes(key:string,bytes:ArrayBuffer,items:Pick<typeof manifest[number],'imageKey'|'sha256'|'byteLength'>[]=manifest){
 const item=items.find(m=>m.imageKey===key);if(!item)throw new HttpError(404,'Illustration inconnue.');
 if(bytes.byteLength!==item.byteLength)throw new HttpError(400,'Taille d’illustration incompatible.');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');if(hash!==item.sha256)throw new HttpError(400,'Illustration incompatible.');return item;
}
async function requireIllustrationImages(){
 if(!env.BUCKET)throw new HttpError(503,'Stockage média indisponible.');
 for(let start=0;start<manifest.length;start+=8){const batch=manifest.slice(start,start+8),heads=await Promise.all(batch.map(m=>env.BUCKET!.head(m.imageKey)));for(let i=0;i<batch.length;i++)if(!heads[i]||heads[i]!.size!==batch[i].byteLength||heads[i]!.customMetadata?.sha256!==batch[i].sha256)throw new HttpError(409,'Illustration manquante : '+batch[i].code);}
}
