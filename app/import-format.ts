import {RARITIES,UNIVERSES,type Card,type Album} from './model';
export const MAX_IMPORT_BYTES=40*1024*1024;
export type EmbeddedIllustration={mimeType:'image/jpeg'|'image/png'|'image/webp'|'image/gif';base64:string;sha256?:string};
export type ImportCard={code:string;name:string;universe:string;category:string;description:string;rarity:string|null;albumIds:string[];imageCredit:string;imageSource:string;imageFit?:"cover"|"contain";illustration?:EmbeddedIllustration};
export function decodeIllustration(image:EmbeddedIllustration){
 if(!image||!['image/jpeg','image/png','image/webp','image/gif'].includes(image.mimeType)||typeof image.base64!=='string'||!image.base64.length||image.base64.length>10666672||(image.base64.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(image.base64)))throw Error('Illustration intégrée invalide ou trop volumineuse.');
 const bytes=Uint8Array.from(atob(image.base64),c=>c.charCodeAt(0));
 const ascii=(a:number,b:number)=>new TextDecoder().decode(bytes.slice(a,b));
 const valid=image.mimeType==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:image.mimeType==='image/png'?bytes[0]===137&&ascii(1,4)==='PNG':image.mimeType==='image/webp'?ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP':ascii(0,3)==='GIF';
 if(bytes.length<12||bytes.length>8000000||!valid)throw Error('Le contenu de l’illustration ne correspond pas à son format.');return bytes;
}
export function parseCardImport(text:string,existing:Pick<Card,'code'>[],albums:Pick<Album,'id'|'universe'|'status'>[]):ImportCard[]{
 if(new TextEncoder().encode(text).length>MAX_IMPORT_BYTES)throw Error('Fichier limité à 40 Mo.');
 let parsed;try{parsed=JSON.parse(text);}catch{throw Error('Le fichier JSON est invalide.');}
 const rows=Array.isArray(parsed)?parsed:parsed?.cards;if(!Array.isArray(rows)||!rows.length||rows.length>100)throw Error('Le fichier doit contenir de 1 à 100 cartes.');
 const codes=new Set(existing.map(c=>c.code.toUpperCase()));
 return rows.map((r:any)=>{
  if(!r||typeof r!=='object')throw Error('Fiche carte invalide.');
  const textField=(k:string,max:number,required=false)=>{const v=r[k]??'';if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw Error(`Champ ${k} invalide pour ${r.code||'une carte'}.`);return v.trim();};
  const code=textField('code',32,true).toUpperCase();if(!/^[A-Z]{2,6}-\d{3,6}$/.test(code))throw Error(`Numéro invalide : ${code}.`);if(codes.has(code))throw Error(`Numéro déjà utilisé : ${code}.`);codes.add(code);
  if(!UNIVERSES.includes(r.universe))throw Error(`Univers invalide : ${code}.`);
  if(r.rarity!==null&&!RARITIES.includes(r.rarity))throw Error(`Rareté invalide : ${code}.`);
  if(r.rarityStatus&&r.rarityStatus!=='pending')throw Error(`Une rareté importée doit rester à valider : ${code}.`);
  const ids=r.albumIds??[];if(!Array.isArray(ids)||ids.some((id:unknown)=>typeof id!=='string'||!albums.some(a=>a.id===id&&a.universe===r.universe&&a.status!=='deleted')))throw Error(`Albums invalides : ${code}.`);
  const imageSource=textField('imageSource',1000);if(imageSource){let u;try{u=new URL(imageSource);}catch{throw Error(`Source d’image invalide : ${code}.`);}if(u.protocol!=='https:')throw Error(`La source doit être en HTTPS : ${code}.`);}
  if(r.imageFit!==undefined&&r.imageFit!=="cover"&&r.imageFit!=="contain")throw Error(`Cadrage invalide : ${code}.`);
  if(r.illustration)decodeIllustration(r.illustration);
  return {code,name:textField('name',140,true),universe:r.universe,category:textField('category',100),description:textField('description',700),rarity:r.rarity,albumIds:[...new Set(ids)] as string[],imageCredit:textField('imageCredit',300),imageSource,...(r.imageFit?{imageFit:r.imageFit as "cover"|"contain"}:{}),...(r.illustration?{illustration:r.illustration}:{} )};
 });
}
