import {env} from 'cloudflare:workers';
import {db,stateFor,validateCard,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Card} from './model';
import {decodeIllustration} from './import-format';
import manifest from './content/cheeses-completion.json';
export const CHEESE_COMPLETION_JOB='cheeses-complete-100-20261023';
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
// Fixed editorial selection. Only hash-pinned photo bytes are accepted from the caller.
export async function completeCheeseBatch(payload:any){
 const n=payload?.batchNumber,max=Math.max(...manifest.map(c=>c.batchNumber));
 if(!Number.isInteger(n)||n<1||n>max)throw new HttpError(400,'Lot invalide.');
 const onceKey=`${CHEESE_COMPLETION_JOB}:batch:${n}`;
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(onceKey).first())return {batchNumber:n,alreadyApplied:true};
 const chosen=manifest.filter(c=>c.batchNumber===n);
 if(!Array.isArray(payload.cards)||payload.cards.length!==chosen.length)throw new HttpError(400,'Le lot ne correspond pas à la sélection prévue.');
 const submitted=new Map<string,any>();for(const c of payload.cards){if(!c||typeof c.code!=='string'||submitted.has(c.code))throw new HttpError(400,'Identifiant invalide ou doublon.');submitted.set(c.code,c);}
 if(chosen.some(c=>!submitted.has(c.code)))throw new HttpError(400,'La sélection contient un fromage non prévu.');
 if(!env.BUCKET)throw new HttpError(503,'Stockage indisponible.');
 const actor={slot:'owner' as const,email:'',name:'ATLAS · complément Fromages demandé par Mathis',userId:CHEESE_COMPLETION_JOB,updatedAt:new Date().toISOString()};
 const state=await stateFor(actor);
 const album=state.albums.find(a=>a.universe==='Fromages'&&a.kind==='general'&&a.status!=='deleted');
 if(!album)throw new HttpError(409,'Album général Fromages absent.');
 if(state.cards.filter(c=>c.universe==='Fromages'&&c.status!=='deleted').length+chosen.length>100)throw new HttpError(409,'La limite demandée de 100 fromages serait dépassée.');
 const after:Card[]=[],media=[];
 for(const item of chosen){
  if(state.cards.some(c=>c.code===item.code||(c.universe==='Fromages'&&normalize(c.name)===normalize(item.name))))throw new HttpError(409,`Le fromage ${item.name} existe déjà ; aucun doublon n’a été créé.`);
  const raw=submitted.get(item.code);if(raw.illustration?.mimeType!==item.mimeType)throw new HttpError(400,'Format de photographie inattendu.');
  let bytes:Uint8Array;try{bytes=decodeIllustration({mimeType:item.mimeType as 'image/jpeg',base64:raw.illustration.base64});}catch{throw new HttpError(400,'Photographie intégrée invalide.');}
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(bytes).buffer))].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==item.sha256)throw new HttpError(400,`La photographie ${item.code} ne correspond pas à la sélection.`);
  const card=validateCard({...EMPTY_RARITY,code:item.code,name:item.name,universe:'Fromages',category:item.category,description:item.description,rarity:null,rarityProposal:item.rarityProposal,imageKey:item.imageKey,imageCredit:item.imageCredit,imageSource:item.imageSource,albumIds:[album.id],status:'draft'},undefined,actor,state.albums);
  after.push(card);media.push({item,bytes});
 }
 for(const {item,bytes} of media){await env.BUCKET.put(item.imageKey,bytes,{httpMetadata:{contentType:item.mimeType},customMetadata:{source:item.imageSource,credit:item.imageCredit}});const object=await env.BUCKET.head(item.imageKey);if(!object||object.size!==bytes.length)throw new HttpError(503,'Photographie non enregistrée intégralement.');}
 await commitCatalog({revision:state.revision,onceKey,actor,cards:after,settings:[{id:onceKey,data:JSON.stringify({at:new Date().toISOString(),codes:after.map(c=>c.code),sources:chosen.map(c=>({code:c.code,url:c.factSource}))})}],before:[],after,action:'Catalogue Fromages · complément à 100',entity:`Lot ${n}/${max} · ${after.length} nouvelles cartes`});
 const result=await stateFor(actor),cheeses=result.cards.filter(c=>c.universe==='Fromages'&&c.status!=='deleted');
 return {batchNumber:n,created:after.length,photosStored:media.length,total:cheeses.length,illustrated:cheeses.filter(c=>c.imageKey).length,revision:result.revision};
}
