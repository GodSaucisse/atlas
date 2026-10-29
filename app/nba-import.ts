import {env} from 'cloudflare:workers';
import {db,stateFor,validateCard,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Album,type Admin} from './model';
import {historyImage} from './history-import';
import manifest from './content/nba-import.json';
export const NBA_JOB='nba-100-20261026';
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
async function nbaImage(item:typeof manifest[number]){
 const choices=[item.wikiTitle,...((item as any).imageAlternatives||[])];let last:unknown;
 for(const title of choices){try{return await historyImage('intitle:"'+title+'" basketball -signature -logo -statue -grave -map',true,(item as {imageFile?:string}).imageFile,title);}catch(e){last=e;if(String(e).includes('429'))throw e;}}
 throw last;
}
export async function importNbaCard(actor:Admin & {userId:string},index:number,dryRun=false,repairImages=false){
 if(!Number.isInteger(index)||index<1||index>100)throw new HttpError(400,'Carte non prévue.');const item=manifest[index-1],onceKey=`${NBA_JOB}:${item.code}${repairImages?":portrait-v2":""}`;
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(onceKey).first())return {code:item.code,alreadyApplied:true};
 let state=await stateFor(actor);
 const existing=state.cards.find(c=>c.code===item.code&&c.universe==='NBA'&&normalize(c.name)===normalize(item.name)&&c.status!=='deleted');
 if(repairImages){
  if(!(item as {imageFile?:string}).imageFile||!existing)throw new HttpError(400,'Correction non prévue.');
  const image=(item as {imageFile?:string}).imageFile?await nbaImage(item):null;if(dryRun)return {code:item.code,source:image?.source||existing.imageSource,credit:image?.credit||existing.imageCredit};
  if(!env.BUCKET)throw new HttpError(503,'Stockage indisponible.');
  state=await stateFor(actor);const old=state.cards.find(c=>c.id===existing.id);if(!old)throw new HttpError(409,'Carte modifiée.');
  const imageKey=image?crypto.randomUUID()+({'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif'}[image.mime]!):old.imageKey;
  const card={...old,imageKey,imageCredit:image?.credit||old.imageCredit,imageSource:image?.source||old.imageSource,imageFit:old.imageFit,updatedAt:new Date().toISOString()};
  if(image)await env.BUCKET.put(imageKey,image.bytes,{httpMetadata:{contentType:image.mime},customMetadata:{source:image.source,credit:image.credit}});
  if(image&&(await env.BUCKET.head(imageKey))?.size!==image.bytes.byteLength)throw new HttpError(503,'Image non enregistrée.');
  try{await commitCatalog({revision:state.revision,onceKey,actor,cards:[card],settings:[{id:onceKey,data:JSON.stringify({at:new Date().toISOString(),code:item.code,source:card.imageSource})}],before:{cards:[old]},after:{cards:[card]},action:'Catalogue NBA · portrait précis',entity:item.code+' · '+item.name});}catch(e){if(image)await env.BUCKET.delete(imageKey);throw e;}
  return {code:item.code,updated:1,imageStored:true};
 }

 if(state.cards.some(c=>c.code===item.code||normalize(c.name)===normalize(item.name)))throw new HttpError(409,`Sujet déjà existant : ${item.name}.`);
 if(state.cards.filter(c=>c.universe==='NBA'&&c.status!=='deleted').length>=100)throw new HttpError(409,'Catalogue NBA déjà complet.');
 const image=await nbaImage(item);if(dryRun)return {code:item.code,name:item.name,mime:image.mime,bytes:image.bytes.byteLength,credit:image.credit,source:image.source};
 if(!env.BUCKET)throw new HttpError(503,'Stockage indisponible.');
 state=await stateFor(actor);
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(onceKey).first())return {code:item.code,alreadyApplied:true};
 if(state.cards.some(c=>c.code===item.code||normalize(c.name)===normalize(item.name)))throw new HttpError(409,'Sujet déjà existant.');
 const oldAlbum=state.albums.find(a=>a.universe==='NBA'&&a.kind==='general'&&a.status!=='deleted');
 const album:Album=oldAlbum||{id:'nba',name:'NBA',universe:'NBA',kind:'general',description:'100 joueurs : 50 en NBA au 26 octobre 2026 et 50 anciens joueurs NBA, retraités ou actifs dans d’autres ligues.',status:'active',updatedAt:new Date().toISOString()};
 if(!oldAlbum&&state.albums.some(a=>a.id===album.id))throw new HttpError(409,'Identifiant d’album déjà utilisé.');
 const imageKey=crypto.randomUUID()+({ 'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif'}[image.mime]!);
 const card=validateCard({...EMPTY_RARITY,code:item.code,name:item.name,universe:'NBA',category:item.category,description:item.description,rarity:null,rarityProposal:item.rarityProposal,imageKey,imageCredit:image.credit,imageSource:image.source,albumIds:[album.id],status:'draft'},undefined,actor,oldAlbum?state.albums:[...state.albums,album]);
 await env.BUCKET.put(imageKey,image.bytes,{httpMetadata:{contentType:image.mime},customMetadata:{source:image.source,credit:image.credit}});
 const stored=await env.BUCKET.head(imageKey);if(!stored||stored.size!==image.bytes.byteLength)throw new HttpError(503,'Image non enregistrée.');
 try{await commitCatalog({revision:state.revision,onceKey,actor,cards:[card],albums:oldAlbum?undefined:[album],settings:[{id:onceKey,data:JSON.stringify({at:new Date().toISOString(),code:item.code,factSource:image.factSource,source:image.source})}],before:{cards:[],albums:[]},after:{cards:[card],albums:oldAlbum?[]:[album]},action:'Catalogue NBA · import demandé par Mathis',entity:item.code+' · '+item.name});}catch(e){await env.BUCKET.delete(imageKey);throw e;}
 return {code:item.code,name:item.name,created:1,imageStored:true,rarityStatus:card.rarityStatus,total:state.cards.filter(c=>c.universe==='NBA'&&c.status!=='deleted').length+1};
}
