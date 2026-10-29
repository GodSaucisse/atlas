import {db,stateFor,commitCatalog,HttpError} from './server';
import content from './content/aviation-service-span.json';
export async function correctMilitaryServiceDates(batch:number){
 if(!Number.isInteger(batch)||batch<1||batch>1)throw new HttpError(400,'Lot invalide.');
 const onceKey=`content:aviation-service-span-20261023:${batch}`;
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(onceKey).first())throw new HttpError(410,'Ce lot a déjà été appliqué.');
 const actor={slot:'owner' as const,email:'',name:'ATLAS · correction des dates de service demandée par Mathis',userId:'atlas-aviation-service-span-20261023',updatedAt:new Date().toISOString()};
 const state=await stateFor(actor),before=[],after=[];
 const items=content.slice((batch-1)*50,batch*50);
 for(const item of items){
  const old=state.cards.find(c=>c.code===item.code);
  if(!old||old.status==='deleted'||old.description!==item.expectedDescription)throw new HttpError(409,`La description ${item.code} a changé ; lot non appliqué.`);
  const description=item.description;
  if(description.length>700)throw new HttpError(400,'Description trop longue.');
  before.push(old);after.push({...old,description,updatedAt:new Date().toISOString()});
 }
 if(after.length!==content.length||new Set(after.map(c=>c.id)).size!==content.length)throw new HttpError(409,'Catalogue incomplet.');
 await commitCatalog({revision:state.revision,onceKey,actor,cards:after,settings:[{id:onceKey,data:JSON.stringify({at:new Date().toISOString(),criterion:content[0].criterion,sources:items.map(i=>({code:i.code,urls:i.sources}))})}],before,after,action:'Dates de service · Aviation',entity:`${after.length} descriptions militaires`});
 return {updated:after.map(c=>c.code),revision:(await stateFor(actor)).revision};
}
