import {env} from 'cloudflare:workers';
import {db,stateFor,validateCard,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Album,type Card} from './model';
import content from './content/cheeses-initial.json';
export const CHEESES_ONCE='content:cheeses-initial-20261023';
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export async function importInitialCheeses(){
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(CHEESES_ONCE).first())throw new HttpError(410,'Ce catalogue a déjà été importé.');
 if(!env.BUCKET)throw new HttpError(503,'Stockage indisponible.');
 const t=new Date().toISOString(),actor={slot:'owner' as const,email:'',name:'ATLAS · import Fromages demandé par Mathis',userId:'atlas-cheeses-initial-20261023',updatedAt:t};
 const state=await stateFor(actor);
 const existing=state.albums.find(a=>a.universe==='Fromages'&&a.kind==='general'&&a.status!=='deleted');
 const album:Album=existing||{id:'fromages',name:'Fromages',universe:'Fromages',kind:'general',description:'Le catalogue général des fromages du monde.',status:'active',updatedAt:t};
 if(!existing&&state.albums.some(a=>a.id===album.id))throw new HttpError(409,'Identifiant d’album déjà utilisé.');
 const albums=existing?state.albums:[...state.albums,album];const after:Card[]=[],media=[];
 for(const item of content){
  if(state.cards.some(c=>c.code===item.code||(c.universe==='Fromages'&&normalize(c.name)===normalize(item.name))))throw new HttpError(409,`Le fromage ${item.name} existe déjà ; aucun doublon n’a été créé.`);
  const card=validateCard({...EMPTY_RARITY,code:item.code,name:item.name,universe:'Fromages',category:item.category,description:item.description,rarity:null,rarityProposal:item.rarityProposal,imageKey:item.imageKey,imageCredit:item.imageCredit,imageSource:item.imageSource,albumIds:[album.id],status:'draft'},undefined,actor,albums);
  const bytes=Uint8Array.from(atob(item.imageBase64),c=>c.charCodeAt(0));
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes.buffer))].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(bytes.length<1000||bytes[0]!==255||bytes[1]!==216||hash!==item.sha256)throw new HttpError(400,'Photographie invalide.');
  after.push(card);media.push({item,bytes});
 }
 if(after.length!==9)throw new HttpError(409,'Sélection incomplète.');
 for(const {item,bytes} of media){await env.BUCKET.put(item.imageKey,bytes,{httpMetadata:{contentType:item.imageMime},customMetadata:{source:item.imageSource,credit:item.imageCredit}});const stored=await env.BUCKET.head(item.imageKey);if(!stored||stored.size!==bytes.length)throw new HttpError(503,'Photographie non enregistrée intégralement.');}
 await commitCatalog({revision:state.revision,onceKey:CHEESES_ONCE,actor,cards:after,albums:existing?[]:[album],settings:[{id:CHEESES_ONCE,data:JSON.stringify({at:t,codes:after.map(c=>c.code),sources:content.map(c=>({code:c.code,url:c.factSource}))})}],before:{cards:[],album:existing||null},after:{cards:after,album},action:'Catalogue Fromages · import initial',entity:'9 cartes · catégories, descriptions, photographies et propositions de rareté'});
 return {created:after.length,album:album.id,photosStored:media.length,rarityStatus:'pending',revision:(await stateFor(actor)).revision};
}
