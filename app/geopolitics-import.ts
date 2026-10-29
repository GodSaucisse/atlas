import {env} from 'cloudflare:workers';
import {db,stateFor,validateCard,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Album,type Admin} from './model';
import {historyImage} from './history-import';
import manifest from './content/geopolitics-import.json';
export const GEOPOLITICS_JOB='geopolitics-100-20261025';
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
async function geopoliticsImage(item:typeof manifest[number]){
 const choices=[item.wikiTitle,...((item as any).imageAlternatives||[])];let last:unknown;
 for(const title of choices){try{return await historyImage(title);}catch(e){last=e;if(String(e).includes('429'))throw e;}}
 throw last;
}
export async function importGeopoliticsCard(actor:Admin & {userId:string},index:number,dryRun=false){
 if(!Number.isInteger(index)||index<1||index>100)throw new HttpError(400,'Carte non prévue.');const item=manifest[index-1],onceKey=`${GEOPOLITICS_JOB}:${item.code}`;
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(onceKey).first())return {code:item.code,alreadyApplied:true};
 let state=await stateFor(actor);
 if(state.cards.some(c=>c.code===item.code||normalize(c.name)===normalize(item.name)))throw new HttpError(409,`Sujet déjà existant : ${item.name}.`);
 if(state.cards.filter(c=>c.universe==='Géopolitique'&&c.status!=='deleted').length>=100)throw new HttpError(409,'Catalogue Géopolitique déjà complet.');
 const image=await geopoliticsImage(item);if(dryRun)return {code:item.code,name:item.name,mime:image.mime,bytes:image.bytes.byteLength,credit:image.credit,source:image.source};
 if(!env.BUCKET)throw new HttpError(503,'Stockage indisponible.');
 state=await stateFor(actor);
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(onceKey).first())return {code:item.code,alreadyApplied:true};
 if(state.cards.some(c=>c.code===item.code||normalize(c.name)===normalize(item.name)))throw new HttpError(409,'Sujet déjà existant.');
 const oldAlbum=state.albums.find(a=>a.universe==='Géopolitique'&&a.kind==='general'&&a.status!=='deleted');
 const album:Album=oldAlbum||{id:'geopolitique',name:'Géopolitique',universe:'Géopolitique',kind:'general',description:'États, organisations, alliances, accords, territoires, renseignement, ressources et crises internationales.',status:'active',updatedAt:new Date().toISOString()};
 if(!oldAlbum&&state.albums.some(a=>a.id===album.id))throw new HttpError(409,'Identifiant d’album déjà utilisé.');
 const imageKey=crypto.randomUUID()+({ 'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif'}[image.mime]!);
 const card=validateCard({...EMPTY_RARITY,code:item.code,name:item.name,universe:'Géopolitique',category:item.category,description:item.description,rarity:null,rarityProposal:item.rarityProposal,imageKey,imageCredit:image.credit,imageSource:image.source,albumIds:[album.id],status:'draft'},undefined,actor,oldAlbum?state.albums:[...state.albums,album]);
 await env.BUCKET.put(imageKey,image.bytes,{httpMetadata:{contentType:image.mime},customMetadata:{source:image.source,credit:image.credit}});
 const stored=await env.BUCKET.head(imageKey);if(!stored||stored.size!==image.bytes.byteLength)throw new HttpError(503,'Image non enregistrée.');
 try{await commitCatalog({revision:state.revision,onceKey,actor,cards:[card],albums:oldAlbum?undefined:[album],settings:[{id:onceKey,data:JSON.stringify({at:new Date().toISOString(),code:item.code,factSource:image.factSource,source:image.source})}],before:{cards:[],albums:[]},after:{cards:[card],albums:oldAlbum?[]:[album]},action:'Catalogue Géopolitique · import demandé par Mathis',entity:item.code+' · '+item.name});}catch(e){await env.BUCKET.delete(imageKey);throw e;}
 return {code:item.code,name:item.name,created:1,imageStored:true,rarityStatus:card.rarityStatus,total:state.cards.filter(c=>c.universe==='Géopolitique'&&c.status!=='deleted').length+1};
}
