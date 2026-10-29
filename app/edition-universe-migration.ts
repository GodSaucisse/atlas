import {db,commitCatalog,HttpError} from './server';
import {EMPTY_RARITY,type Admin,type Album,type Card} from './model';
import editions from './content/special-edition-import.json';
import nbaModels from './content/nba-supreme-import.json';
export const EDITION_UNIVERSE_JOB='edition-universe-and-nba-supremes-20261027-v1';
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function editionUniverseChanges(cards:Card[],albums:Album[],actor:string,at:string){
 const main:Album={...(albums.find(a=>a.id==='editions-speciales')||{}),id:'editions-speciales',name:'Editions spéciales',universe:'Editions spéciales',kind:'general',description:'Les modèles et variantes en édition spéciale d’ATLAS.',status:'active',updatedAt:at};
 const allAlbums=[...albums.filter(a=>a.id!==main.id),main];
 const output:Card[]=[];
 const assigned=new Set(cards.map(c=>c.code));let next=1;
 const albumIds=(universe:string,names:readonly string[])=>allAlbums.filter(a=>a.status==='active'&&a.kind==='specialized'&&a.universe===universe&&names.some(n=>norm(n)===norm(a.name))).map(a=>a.id);
 for(const card of cards.filter(c=>c.rarity==='Editions spéciales'&&c.status!=='deleted')){
  const source=editions.find(e=>e.code===card.id||e.code===card.code||e.editionCode===card.code);
  const originalUniverse=card.editionSubjectUniverse||(card.universe==='Editions spéciales'?source?.universe:card.universe)||'Editions spéciales';
  let code=source?.editionCode;
  if(!code){while(assigned.has(`EDS-${String(next).padStart(3,'0')}`))next++;code=`EDS-${String(next++).padStart(3,'0')}`;}
  const collision=cards.find(c=>c.code===code&&c.id!==card.id);if(collision)throw new HttpError(409,`Numéro déjà utilisé : ${code}. Aucun déplacement enregistré.`);
  assigned.add(code);
  const previousSpecialized=card.albumIds.filter(id=>allAlbums.some(a=>a.id===id&&a.kind==='specialized'&&a.status!=='deleted'&&(a.universe===originalUniverse||a.universe==='Editions spéciales')));
  output.push({...card,code,universe:'Editions spéciales',editionSubjectUniverse:originalUniverse,albumIds:[...new Set([main.id,...previousSpecialized,...albumIds(originalUniverse,source?.albumNames||[])])],updatedAt:at});
 }
 const nbaMain=allAlbums.find(a=>a.universe==='NBA'&&a.kind==='general'&&a.status==='active');
 const createdAlbums:Album[]=[main];
 const nbaAlbum=nbaMain||{id:'nba',name:'NBA',universe:'NBA',kind:'general' as const,description:'Joueurs et équipes NBA.',status:'active' as const,updatedAt:at};
 if(!nbaMain){if(allAlbums.some(a=>a.id===nbaAlbum.id))throw new HttpError(409,'Identifiant NBA déjà utilisé.');createdAlbums.push(nbaAlbum);}
 for(const item of nbaModels){
  const codeMatch=cards.find(c=>c.code===item.code),nameMatch=cards.find(c=>c.universe==='NBA'&&norm(c.name)===norm(item.name)&&c.status!=='deleted');
  if(codeMatch&&(codeMatch.universe!=='NBA'||norm(codeMatch.name)!==norm(item.name)||codeMatch.status==='deleted'))throw new HttpError(409,`Le numéro ${item.code} ne correspond plus au modèle demandé.`);
  const previous=codeMatch||nameMatch;
  const card:Card=previous?{...previous}:{...EMPTY_RARITY,id:crypto.randomUUID(),code:item.code,name:item.name,universe:'NBA',category:item.category,description:item.description,rarity:'Suprême',imageKey:item.imageKey,imageFit:'cover',imageCredit:'Modèle original fourni par le créateur ATLAS',imageSource:'',albumIds:[],status:'ready',updatedAt:at};
  output.push({...card,rarity:'Suprême',rarityStatus:'validated',rarityProposal:null,rarityProposedBy:null,rarityProposedAt:null,rarityValidatedBy:actor,rarityValidatedAt:at,albumIds:[...new Set([...card.albumIds,nbaAlbum.id,...albumIds('NBA',item.albumNames)])],updatedAt:at});
 }
 return {cards:output,albums:createdAlbums};
}
export async function applyEditionUniverseMigration(admin:Admin&{userId:string}){
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(EDITION_UNIVERSE_JOB).first())return;
 const cr=await db().prepare('SELECT data FROM cards').all<{data:string}>(),ar=await db().prepare('SELECT data FROM albums').all<{data:string}>(),meta=await db().prepare("SELECT revision FROM catalog_meta WHERE id='catalog'").first<{revision:number}>();
 const cards=cr.results.map(r=>JSON.parse(r.data) as Card),albums=ar.results.map(r=>JSON.parse(r.data) as Album);
 const changes=editionUniverseChanges(cards,albums,admin.userId,new Date().toISOString());
 const ids=new Set(changes.cards.map(c=>c.id));
 try{await commitCatalog({onceKey:EDITION_UNIVERSE_JOB,revision:meta!.revision,actor:admin,...changes,settings:[{id:EDITION_UNIVERSE_JOB,data:JSON.stringify({editions:changes.cards.filter(c=>c.universe==='Editions spéciales').length,nba:11})}],before:{cards:cards.filter(c=>ids.has(c.id)),albums:albums.filter(a=>changes.albums.some(v=>v.id===a.id))},after:changes,action:'Univers Editions spéciales et modèles NBA Suprêmes',entity:'Univers et numérotation EDS · templates conservés · 11 modèles NBA'});}catch(error){if(!(await db().prepare('SELECT id FROM settings WHERE id=?').bind(EDITION_UNIVERSE_JOB).first()))throw error;}
}
