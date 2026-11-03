import {db,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Card,type Album,type Admin} from './model';
import {belongs} from './album-classification';
import {cardSummary} from './components/card-summary';
import manifest from './content/fauna-history-import.json';
export const FAUNA_HISTORY_JOB='fauna-history-original-designs-20261029-v1';
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const placeholder=(s:string)=>norm(s)==='elementremarquablepresentedanslescollectionsatlas';
export function faunaHistoryChanges(cards:Card[],albums:Album[],actor:string,at:string){
 const active=albums.filter(a=>a.status==='active'),principal=active.find(a=>a.id==='editions-speciales'&&a.kind==='general'&&a.universe==='Editions spéciales'),halloween=active.find(a=>a.universe==='Editions spéciales'&&a.kind==='specialized'&&norm(a.name)==='halloween');
 if(!principal||!halloween)throw new HttpError(409,'Les albums Editions spéciales et Halloween doivent être disponibles.');
 const changed:Card[]=manifest.map(item=>{
  const previous=cards.find(c=>c.code===item.code),same=cards.find(c=>c.status!=='deleted'&&c.universe===item.universe&&norm(c.name)===norm(item.name));
  if(previous&&(previous.status==='deleted'||previous.universe!==item.universe||norm(previous.name)!==norm(item.name)))throw new HttpError(409,`Numéro incompatible : ${item.code}.`);
  if(same&&same.code!==item.code)throw new HttpError(409,`Le modèle ${item.name} utilise déjà un autre numéro.`);
  const edition=item.rarity==='Editions spéciales';
  if(!edition&&!active.some(a=>a.kind==='general'&&a.universe===item.universe))throw new HttpError(409,`Album principal absent : ${item.universe}.`);
  const card:Card={...EMPTY_RARITY,...previous,id:previous?.id||crypto.randomUUID(),code:item.code,name:previous?.name||item.name,universe:item.universe,category:previous?.category||item.category,description:previous?.description&&!placeholder(previous.description)?previous.description:item.description,rarity:item.rarity,rarityStatus:'validated',rarityProposal:null,rarityProposedBy:null,rarityProposedAt:null,rarityValidatedBy:actor,rarityValidatedAt:at,imageKey:item.imageKey,imageFit:'cover',imageCredit:'Modèle original fourni par le créateur ATLAS',imageSource:'',albumIds:[],status:'ready',updatedAt:at};
  card.albumIds=edition?[principal.id,halloween.id]:[...new Set([...(previous?.albumIds||[]).filter(id=>active.some(a=>a.id===id&&a.universe===card.universe)),...active.filter(a=>a.universe===card.universe&&(a.kind==='general'||belongs(card,a))).map(a=>a.id)])];
  if(edition)card.editionSubjectUniverse=undefined;
  return card;
 });
 for(const c of cards)if(c.status!=='deleted'&&placeholder(c.description)&&!changed.some(v=>v.id===c.id))changed.push({...c,description:cardSummary(c),updatedAt:at});
 return changed;
}
export async function applyFaunaHistoryMigration(admin?:Admin&{userId:string}){
 const database=db(),key=FAUNA_HISTORY_JOB;
 const previous=await database.prepare('SELECT data FROM settings WHERE id=?').bind(key).first<{data:string}>();if(previous)return JSON.parse(previous.data);
 const [cr,ar,meta]=await Promise.all([database.prepare('SELECT data FROM cards').all<{data:string}>(),database.prepare('SELECT data FROM albums').all<{data:string}>(),database.prepare("SELECT revision FROM catalog_meta WHERE id='catalog'").first<{revision:number}>()]);
 const actor=admin||{slot:'owner' as const,email:'',userId:'atlas:provided-design-import',name:'ATLAS · Intégration des modèles fournis',updatedAt:new Date().toISOString()},cards=cr.results.map(r=>JSON.parse(r.data) as Card),albums=ar.results.map(r=>JSON.parse(r.data) as Album),changes=faunaHistoryChanges(cards,albums,actor.userId,new Date().toISOString()),ids=new Set(changes.map(c=>c.id)),summary={supreme:8,halloween:2,codes:manifest.map(c=>c.code),changed:changes.length};
 try{await commitCatalog({onceKey:key,revision:meta!.revision,actor,cards:changes,settings:[{id:key,data:JSON.stringify(summary)}],before:cards.filter(c=>ids.has(c.id)),after:changes,action:'8 modèles Suprêmes et 2 éditions Halloween fournis · légendes corrigées',entity:'Modèles originaux animés · Lion, Orque, Gorille, Newton, Louis IX, Pygargue, Tortue, Crocodile'});return summary;}catch(error){const saved=await database.prepare('SELECT data FROM settings WHERE id=?').bind(key).first<{data:string}>();if(!saved)throw error;return JSON.parse(saved.data);}
}
export async function faunaHistoryStatus(){
 const database=db(),row=await database.prepare('SELECT data FROM settings WHERE id=?').bind(FAUNA_HISTORY_JOB).first<{data:string}>(),rows=await database.prepare('SELECT data FROM cards WHERE code IN ('+manifest.map(()=>'?').join(',')+')').bind(...manifest.map(c=>c.code)).all<{data:string}>();
 const cards=rows.results.map(r=>JSON.parse(r.data) as Card);return {applied:!!row,summary:row?JSON.parse(row.data):null,cards:cards.map(c=>({code:c.code,name:c.name,rarity:c.rarity,rarityStatus:c.rarityStatus,status:c.status,albumIds:c.albumIds,imageKey:c.imageKey})),anomalies:manifest.flatMap(m=>{const c=cards.find(c=>c.code===m.code);return !c||c.rarity!==m.rarity||c.status!=='ready'||c.imageKey!==m.imageKey?[m.code]:[]})};
}
