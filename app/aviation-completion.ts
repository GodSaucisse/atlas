import {env} from 'cloudflare:workers';
import {db,stateFor,validateCard,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Card} from './model';
import {decodeIllustration} from './import-format';
import manifest from './content/aviation-completion.json';
export const COMPLETION_JOB='aviation-complete-100-20261022';
const actor={slot:'owner' as const,email:'',name:'ATLAS · import et raretés délégués par Mathis',userId:COMPLETION_JOB,updatedAt:''};
// Seven fixed, hash-pinned batches. Caller-supplied card text, roles, rarities,
// URLs and album edits are never accepted. Only the preselected photo bytes are consumed.
export async function completeAviationBatch(payload:any){
 const n=payload?.batchNumber;if(!Number.isInteger(n)||n<1||n>7)throw new HttpError(400,'Lot invalide.');
 const onceKey=`${COMPLETION_JOB}:batch:${n}`;
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(onceKey).first())return {batchNumber:n,alreadyApplied:true};
 const chosen=manifest.filter(c=>c.batchNumber===n);
 if(!Array.isArray(payload.cards)||payload.cards.length!==chosen.length)throw new HttpError(400,'Le lot ne correspond pas à la sélection prévue.');
 const submitted=new Map<string,any>();for(const c of payload.cards){if(!c||typeof c.code!=='string'||submitted.has(c.code))throw new HttpError(400,'Identifiant invalide ou doublon.');submitted.set(c.code,c);}
 if(chosen.some(c=>!submitted.has(c.code)))throw new HttpError(400,'La sélection contient un modèle non prévu.');
 if(!env.BUCKET)throw new HttpError(503,'Stockage indisponible.');
 const state=await stateFor(actor);const before:Card[]=[];const after:Card[]=[];const media:{key:string;bytes:Uint8Array;mime:string;source:string;credit:string}[]=[];
 for(const item of chosen){
  const raw=submitted.get(item.code);if(raw.illustration?.mimeType!==item.mimeType)throw new HttpError(400,'Format de photographie inattendu.');
  let bytes:Uint8Array;try{bytes=decodeIllustration({mimeType:item.mimeType as 'image/jpeg',base64:raw.illustration.base64});}catch{throw new HttpError(400,'Photographie intégrée invalide.');}
  const digest=await crypto.subtle.digest('SHA-256',new Uint8Array(bytes).buffer);const hash=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==item.sha256)throw new HttpError(400,`La photographie ${item.code} ne correspond pas au fichier préparé.`);
  const old=state.cards.find(c=>c.code===item.code);if(old?.status==='deleted')throw new HttpError(409,`La carte ${item.code} est dans la corbeille ; elle n’a pas été recréée.`);
  if(old&&old.universe!=='Aviation')throw new HttpError(409,'Un numéro est utilisé dans un autre univers.');
  const existingMedia=old?.imageKey?await env.BUCKET.head(old.imageKey):null;
  const imageKey=existingMedia?old!.imageKey:item.imageKey;
  const base=old||{...EMPTY_RARITY,id:'',code:item.code,name:item.name,universe:'Aviation',category:'',description:'',rarity:null,imageKey:'',imageCredit:'',imageSource:'',albumIds:item.albumIds,status:'draft' as const,updatedAt:''};
  const proposal=base.rarityStatus==='validated'?base.rarityProposal:(base.rarityProposal||base.rarity||item.rarityProposal);
  const card=validateCard({...base,category:base.category||item.category,description:base.description||item.description,imageKey,imageCredit:existingMedia?(base.imageCredit||item.imageCredit):item.imageCredit,imageSource:existingMedia?(base.imageSource||item.imageSource):item.imageSource,rarityProposal:proposal},old,actor,state.albums);
  if(old)before.push(old);after.push(card);
  if(!existingMedia)media.push({key:item.imageKey,bytes,mime:item.mimeType,source:item.imageSource,credit:item.imageCredit});
 }
 for(const image of media){await env.BUCKET.put(image.key,image.bytes,{httpMetadata:{contentType:image.mime},customMetadata:{source:image.source,credit:image.credit}});const check=await env.BUCKET.head(image.key);if(!check||check.size!==image.bytes.length)throw new HttpError(503,'L’illustration n’a pas été enregistrée intégralement.');}
 await commitCatalog({revision:state.revision,onceKey,actor,cards:after,settings:[{id:onceKey,data:JSON.stringify({at:new Date().toISOString(),codes:after.map(c=>c.code)})}],before,after,action:'Catalogue Aviation · import et complétion',entity:`Lot ${n}/7 · ${after.length} cartes · illustrations et raretés`});
 const result=await stateFor(actor);const aviation=result.cards.filter(c=>c.universe==='Aviation'&&c.status!=='deleted');
 return {batchNumber:n,created:after.length-before.length,updated:before.length,photosStored:media.length,total:aviation.length,illustrated:aviation.filter(c=>c.imageKey).length,withRarity:aviation.filter(c=>c.rarity||c.rarityProposal).length,revision:result.revision};
}
