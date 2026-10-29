import {db,stateFor,commitCatalog,HttpError} from './server';
import content from './content/aviation-albums.json';
export async function assignAviationAlbums(batch:number){
 if(!Number.isInteger(batch)||batch<1||batch>2)throw new HttpError(400,'Lot invalide.');
 const onceKey=`content:aviation-albums-20261022:${batch}`;
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(onceKey).first())throw new HttpError(410,'Ce lot a déjà été appliqué.');
 const actor={slot:'owner' as const,email:'',name:'ATLAS · répartition des albums demandée par Mathis',userId:'atlas-aviation-albums-20261022',updatedAt:new Date().toISOString()};
 const state=await stateFor(actor),before=[],after=[];
 const items=content.slice((batch-1)*50,batch*50);
 for(const item of items){
  const old=state.cards.find(c=>c.code===item.code);
  if(!old||old.status==='deleted'||old.updatedAt!==item.expectedUpdatedAt||old.id!==item.id)throw new HttpError(409,`La description ${item.code} a changé ; lot non appliqué.`);
  if(item.albumIds.some(id=>!state.albums.some(a=>a.id===id&&a.universe===old.universe&&a.status!=='deleted')))throw new HttpError(409,'Album absent.');
  before.push(old);after.push({...old,albumIds:item.albumIds,updatedAt:new Date().toISOString()});
 }
 if(after.length!==50||new Set(after.map(c=>c.id)).size!==50)throw new HttpError(409,'Catalogue incomplet.');
 await commitCatalog({revision:state.revision,onceKey,actor,cards:after,settings:[{id:onceKey,data:JSON.stringify({at:new Date().toISOString(),codes:items.map(i=>i.code)})}],before,after,action:'Répartition des albums · Aviation',entity:`50 cartes · lot ${batch}/2`});
 return {updated:after.map(c=>c.code),revision:(await stateFor(actor)).revision};
}
