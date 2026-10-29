import {env} from 'cloudflare:workers';
import {db,stateFor,validateCard,commitCatalog,HttpError} from './server';
import content from './content/aviation-enrichment.json';

export const AVIATION_CONTENT_ONCE='content:aviation-enrichment-20261022';
// A fixed editorial operation, explicitly requested by the principal. It accepts
// no caller-supplied card, identity, URL, image or SQL. The independent key is revoked after use.
export async function enrichAviationCatalogue(){
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(AVIATION_CONTENT_ONCE).first())throw new HttpError(410,'Cet enrichissement a déjà été appliqué.');
 const actor={slot:'owner' as const,email:'',name:'ATLAS · enrichissement demandé par Mathis',userId:'atlas-aviation-enrichment-20261022',updatedAt:new Date().toISOString()};
 const state=await stateFor(actor);const concorde=state.cards.find(c=>c.code==='AVI-027');
 if(!concorde)throw new HttpError(409,'La carte Concorde est absente.');
 if(!env.BUCKET)throw new HttpError(503,'Stockage indisponible.');
 const before=[];const after=[];const media=[];
 for(const item of content){
  if(item.code==='AVI-027')throw new HttpError(400,'Le Concorde est exclu de cet enrichissement.');
  const old=state.cards.find(c=>c.code===item.code);
  if(!old||old.name!==item.name||old.status==='deleted')throw new HttpError(409,`La fiche ${item.code} a changé ; aucune carte n’a été modifiée.`);
  if(old.category||old.description||old.imageKey||old.imageCredit||old.imageSource)throw new HttpError(409,`La fiche ${item.code} contient déjà du contenu ; aucun champ existant n’a été écrasé.`);
  before.push(old);
  const card=validateCard({...old,category:item.category,description:item.description,imageKey:item.imageKey,imageCredit:item.imageCredit,imageSource:item.imageSource},old,actor,state.albums);
  const bytes=Uint8Array.from(atob(item.imageBase64),c=>c.charCodeAt(0));
  if(bytes.length<1000||bytes[0]!==255||bytes[1]!==216)throw new HttpError(400,'Photographie invalide.');
  after.push(card);media.push({item,bytes});
 }
 if(before.length!==11||new Set(before.map(c=>c.code)).size!==11)throw new HttpError(400,'Sélection éditoriale invalide.');
 // Upload first. Atomic compare-and-swap below refuses any concurrent catalogue edit.
 for(const {item,bytes} of media)await env.BUCKET.put(item.imageKey,bytes,{httpMetadata:{contentType:item.imageMime},customMetadata:{source:item.imageSource,credit:item.imageCredit}});
 for(const {item,bytes} of media){const object=await env.BUCKET.head(item.imageKey);if(!object||object.size!==bytes.length)throw new HttpError(503,'La photographie n’a pas été enregistrée intégralement.');}
 await commitCatalog({revision:state.revision,onceKey:AVIATION_CONTENT_ONCE,actor,cards:after,settings:[{id:AVIATION_CONTENT_ONCE,data:JSON.stringify({at:new Date().toISOString(),codes:after.map(c=>c.code),sources:content.map(c=>({code:c.code,url:c.factSource}))})}],before,after,action:'Enrichissement éditorial · Aviation',entity:'11 cartes · catégories, descriptions et photographies'});
 const result=await stateFor(actor);
 return {updated:after.map(c=>c.code),revision:result.revision,concordeUnchanged:JSON.stringify(result.cards.find(c=>c.code==='AVI-027'))===JSON.stringify(concorde),complete:result.cards.filter(c=>c.category&&c.description&&c.imageKey).map(c=>c.code)};
}
