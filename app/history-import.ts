import {env} from 'cloudflare:workers';
import jpeg from 'jpeg-js';
import {decode as decodePng,convertIndexedToRgb} from 'fast-png';
import {db,stateFor,validateCard,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Card,type Album,type Admin} from './model';
import manifest from './content/history-import.json';
export const HISTORY_JOB='history-100-20261024';
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
async function json(url:string){const res=await fetch(url,{headers:{'User-Agent':'ATLAS-private-catalog/1.0 (educational collection)','Accept':'application/json'}});if(!res.ok)throw new HttpError(502,`Source documentaire indisponible (${res.status}).`);return res.json() as Promise<any>;}
export async function historyImage(title:string,commonsOnly=false,commonsFile?:string,subject?:string){
 const page=commonsOnly?{}:await json(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
 const src=page.originalimage?.source||page.thumbnail?.source;
 const clean=(s:string)=>s.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
 let item:any;
 if(commonsFile){
  const info=await json(`https://commons.wikimedia.org/w/api.php?action=query&format=json&redirects=1&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=600&titles=${encodeURIComponent('File:'+commonsFile)}`);
  item=(Object.values(info.query?.pages||{}) as any[])[0]?.imageinfo?.[0];
  if(!item)throw new HttpError(422,`Illustration exacte indisponible : ${commonsFile}.`);
 }
 if(!item&&src?.startsWith('https://upload.wikimedia.org/wikipedia/commons/')){
  const imagePath=new URL(src).pathname;const file=decodeURIComponent(imagePath.includes('/thumb/')?imagePath.split('/').at(-2)!:imagePath.split('/').pop()!);
  const info=await json(`https://commons.wikimedia.org/w/api.php?action=query&format=json&redirects=1&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=320&titles=${encodeURIComponent('File:'+file)}`);
  item=(Object.values(info.query?.pages||{}) as any[])[0]?.imageinfo?.[0];
 }
 if(!item){
  const info=await json(`https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch=${encodeURIComponent(title+' filetype:bitmap')}&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=320`);
  item=(Object.values(info.query?.pages||{}) as any[]).sort((a,b)=>(a.index||0)-(b.index||0)).filter(p=>!subject||subject.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).every(word=>String(p.title||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'').includes(word))).map(p=>p.imageinfo?.[0]).find(i=>i&&/CC BY|CC0|Public domain|PD|PDM/i.test(clean(i.extmetadata?.LicenseShortName?.value||'')));
 }
 const m=item?.extmetadata;const licence=clean(m?.LicenseShortName?.value||'');
 if(!/CC BY|CC0|Public domain|PD|PDM/i.test(licence))throw new HttpError(422,`Licence à vérifier : ${title} (${licence}).`);
 const imageUrl=item.thumburl||item.url;
 if(!imageUrl||!['upload.wikimedia.org','thumb.wikimedia.org','commons.wikimedia.org'].includes(new URL(imageUrl,'https://commons.wikimedia.org').hostname))throw new HttpError(422,`Hôte de photographie refusé : ${imageUrl}.`);
 const candidates=[imageUrl,item.url].filter(Boolean).map(s=>{const u=new URL(s,'https://commons.wikimedia.org');u.search='';return u.href;});
 let bytes:ArrayBuffer|undefined,mime:string|undefined;const failures:string[]=[];
 for(const candidate of [...new Set(candidates)]){
  const response=await fetch(candidate,{headers:{'User-Agent':'ATLAS-private-catalog/1.0 (educational collection)','Accept':'image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8'}});
  if(!response.ok){failures.push(`${response.status}: ${(await response.text()).slice(0,140)}`);continue;}
  const type=response.headers.get('content-type')?.split(';')[0];if(type!=='image/jpeg'&&type!=='image/png'&&type!=='image/webp'&&type!=='image/gif'){failures.push(`Format ${type}`);continue;}
  const body=await response.arrayBuffer();if(body.byteLength<1000||body.byteLength>10000000){failures.push(`Taille ${body.byteLength}`);continue;}
  if(body.byteLength>450000&&(type==='image/jpeg'||type==='image/png')){
   try{const decoded=type==='image/jpeg'?{...jpeg.decode(new Uint8Array(body),{useTArray:true,maxResolutionInMP:8,maxMemoryUsageInMB:72}),channels:4,depth:8}:decodePng(new Uint8Array(body));
    const palette='palette' in decoded?decoded.palette:undefined;const channels=palette?.[0].length||decoded.channels;const data=palette?convertIndexedToRgb(decoded as any):decoded.data;
    if(decoded.width*decoded.height>8000000)throw new Error('Image trop grande');
    const scale=Math.min(1,800/Math.max(decoded.width,decoded.height)),width=Math.max(1,Math.round(decoded.width*scale)),height=Math.max(1,Math.round(decoded.height*scale));const pixels=new Uint8Array(width*height*4);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){const from=(Math.floor(y/scale)*decoded.width+Math.floor(x/scale))*channels,to=(y*width+x)*4;const factor=decoded.depth===16?257:1;for(let c=0;c<3;c++)pixels[to+c]=Number(data[from+(channels<3?0:c)])/factor;pixels[to+3]=channels===2||channels===4?Number(data[from+channels-1])/factor:255;}
    const result=jpeg.encode({data:pixels,width,height},82).data;bytes=new Uint8Array(result).buffer;mime='image/jpeg';break;
   }catch(error){failures.push('Optimisation : '+String(error).slice(0,160));continue;}
  }
  if(body.byteLength>2000000){failures.push(`Taille ${body.byteLength}`);continue;}
  bytes=body;mime=type;break;
 }
 if(!bytes||!mime)throw new HttpError(502,`Illustration ${title} : ${failures.join('; ')}`);
 return {bytes,mime,credit:(clean(m?.Artist?.value||m?.Credit?.value||'Wikimedia Commons')+' · '+licence+' · Wikimedia Commons').slice(0,300),source:item.descriptionurl||'https://commons.wikimedia.org/',factSource:(commonsOnly?item.descriptionurl:page.content_urls?.desktop?.page)||`https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`};
}
export async function importHistoryCard(index:number,dryRun=false){
 if(!Number.isInteger(index)||index<1||index>100)throw new HttpError(400,'Carte non prévue.');const item=manifest[index-1],onceKey=`${HISTORY_JOB}:${item.code}`;
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(onceKey).first())return {code:item.code,alreadyApplied:true};
 const owner=await db().prepare('SELECT slot,email,user_id AS userId,name,updated_at AS updatedAt FROM admins WHERE slot=?').bind('owner').first<Admin>();if(!owner?.userId)throw new HttpError(403,'Administrateur principal non identifié.');
 const actor={...owner,userId:owner.userId};let state=await stateFor(actor);
 if(state.cards.some(c=>c.code===item.code||normalize(c.name)===normalize(item.name)))throw new HttpError(409,`Sujet déjà existant : ${item.name}.`);
 if(state.cards.filter(c=>c.universe==='Histoire'&&c.status!=='deleted').length>=100)throw new HttpError(409,'Catalogue Histoire déjà complet.');
 const image=await historyImage(item.wikiTitle);if(dryRun)return {code:item.code,name:item.name,mime:image.mime,bytes:image.bytes.byteLength,credit:image.credit,source:image.source};
 if(!env.BUCKET)throw new HttpError(503,'Stockage indisponible.');
 state=await stateFor(actor);
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(onceKey).first())return {code:item.code,alreadyApplied:true};
 if(state.cards.some(c=>c.code===item.code||normalize(c.name)===normalize(item.name)))throw new HttpError(409,'Sujet déjà existant.');
 const oldAlbum=state.albums.find(a=>a.universe==='Histoire'&&a.kind==='general'&&a.status!=='deleted');
 const album:Album=oldAlbum||{id:'histoire',name:'Histoire',universe:'Histoire',kind:'general',description:'Personnes, entités, bâtiments et événements, de l’Antiquité à l’époque contemporaine.',status:'active',updatedAt:new Date().toISOString()};
 if(!oldAlbum&&state.albums.some(a=>a.id===album.id))throw new HttpError(409,'Identifiant d’album déjà utilisé.');
 const imageKey=crypto.randomUUID()+({ 'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif'}[image.mime]!);
 const card=validateCard({...EMPTY_RARITY,code:item.code,name:item.name,universe:'Histoire',category:item.category,description:item.description,rarity:null,rarityProposal:item.rarityProposal,imageKey,imageCredit:image.credit,imageSource:image.source,albumIds:[album.id],status:'draft'},undefined,actor,oldAlbum?state.albums:[...state.albums,album]);
 // Only this rarity was previously explicitly validated by Mathis.
 if(item.name==='Tour Eiffel')Object.assign(card,{rarity:'Légendaire',rarityProposal:null,rarityStatus:'validated',rarityProposedBy:null,rarityProposedAt:null,rarityValidatedBy:actor.userId,rarityValidatedAt:new Date().toISOString()});
 await env.BUCKET.put(imageKey,image.bytes,{httpMetadata:{contentType:image.mime},customMetadata:{source:image.source,credit:image.credit}});
 const stored=await env.BUCKET.head(imageKey);if(!stored||stored.size!==image.bytes.byteLength)throw new HttpError(503,'Image non enregistrée.');
 try{await commitCatalog({revision:state.revision,onceKey,actor,cards:[card],albums:oldAlbum?undefined:[album],settings:[{id:onceKey,data:JSON.stringify({at:new Date().toISOString(),code:item.code,factSource:image.factSource,source:image.source})}],before:{cards:[],albums:[]},after:{cards:[card],albums:oldAlbum?[]:[album]},action:'Catalogue Histoire · import demandé par Mathis',entity:item.code+' · '+item.name});}catch(e){await env.BUCKET.delete(imageKey);throw e;}
 return {code:item.code,name:item.name,created:1,imageStored:true,rarityStatus:card.rarityStatus,total:state.cards.filter(c=>c.universe==='Histoire'&&c.status!=='deleted').length+1};
}
