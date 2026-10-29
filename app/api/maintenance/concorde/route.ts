import {env} from 'cloudflare:workers';
import {db,stateFor,mutate,HttpError,errorResponse,protectWrite} from '../../../server';
import image from '../../../content/concorde-image.json';
export const dynamic='force-dynamic';
const actorId='atlas-concorde-enrichment-20261022';
const imageKey='d4d41b38-31c0-45b1-9243-8f871c50c861.jpg';
const category='Avion de ligne supersonique';
const description='Fruit d’une coopération franco-britannique, le Concorde effectue son premier vol en 1969. Mis en service en 1976, cet avion de ligne à aile delta transporte ses passagers à Mach 2 et devient un symbole de l’aviation supersonique.';

// A single-purpose, single-use content operation. No visitor identity is forged.
// Requires an independent runtime secret; it accepts no supplied card/body/SQL.
// The key is revoked immediately after the verified update.
export async function POST(request:Request){try{
  protectWrite(request);
  const configured=env.ATLAS_CONCORDE_UPDATE_KEY;
  const supplied=request.headers.get('X-Atlas-Content-Key');
  if(!configured||!supplied||supplied.length!==configured.length)throw new HttpError(404,'Opération indisponible.');
  let mismatch=0;for(let i=0;i<configured.length;i++)mismatch|=configured.charCodeAt(i)^supplied.charCodeAt(i);
  if(mismatch)throw new HttpError(404,'Opération indisponible.');
  if(await db().prepare('SELECT id FROM audit WHERE actor_id=? LIMIT 1').bind(actorId).first())throw new HttpError(410,'Cette mise à jour a déjà été appliquée.');
  const actor={slot:'owner' as const,email:'',name:'ATLAS · mise à jour demandée par Mathis',userId:actorId,updatedAt:new Date().toISOString()};
  const state=await stateFor(actor);const card=state.cards.find(c=>c.id==='AVI-027'&&c.code==='AVI-027');
  if(!card||card.status==='deleted')throw new HttpError(409,'La carte Concorde est absente ou dans la corbeille.');
  if(card.category||card.description||card.imageKey)throw new HttpError(409,'La fiche a déjà été enrichie ; aucun champ existant n’a été écrasé.');
  if(!env.BUCKET)throw new HttpError(503,'Stockage indisponible.');
  const bytes=Uint8Array.from(atob(image.base64),c=>c.charCodeAt(0));
  await env.BUCKET.put(imageKey,bytes,{httpMetadata:{contentType:image.mime},customMetadata:{source:'https://commons.wikimedia.org/wiki/File:Concorde_British_Airways.jpg',credit:'SDASM Archives / Miles Blaine Collection'}});
  const result=await mutate(actor,{action:'card.save',revision:state.revision,card:{...card,category,description,imageKey,imageCredit:'San Diego Air & Space Museum Archives — Miles Blaine Collection ; via Wikimedia Commons. Aucune restriction de publication connue.',imageSource:'https://commons.wikimedia.org/wiki/File:Concorde_British_Airways.jpg'}});
  return Response.json({updated:result.cards.find(c=>c.id===card.id),revision:result.revision},{headers:{'Cache-Control':'no-store'}});
}catch(e){return errorResponse(e);}}
