import {env} from 'cloudflare:workers';
import {db,stateFor,commitCatalog,HttpError} from './server';
import {missing,RARITIES} from './model';
import content from './content/aviation-ready.json';
// Fixed, requested principal approval of the current catalogue; no arbitrary caller input.
export async function validateAndReadyCatalogue(batch:number){
 if(!Number.isInteger(batch)||batch<1||batch>2)throw new HttpError(400,'Lot invalide.');
 const onceKey=`content:aviation-ready-20261023:${batch}`;
 if(await db().prepare('SELECT id FROM settings WHERE id=?').bind(onceKey).first())throw new HttpError(410,'Ce lot a déjà été appliqué.');
 const t=new Date().toISOString();
 const actor={slot:'owner' as const,email:'',name:'ATLAS · validation globale demandée par Mathis',userId:'atlas-principal-approved-ready-20261023',updatedAt:t};
 const state=await stateFor(actor),before=[],after=[];
 for(const item of content.slice((batch-1)*50,batch*50)){
  const old=state.cards.find(c=>c.id===item.id&&c.code===item.code);
  if(!old||old.status==='deleted'||old.status==='archived'||old.updatedAt!==item.expectedUpdatedAt||old.rarity!==item.expectedRarity||old.rarityProposal!==item.expectedProposal)throw new HttpError(409,`La carte ${item.code} a changé ; lot non appliqué.`);
  const rarity=old.rarityProposal||old.rarity;
  if(!rarity||!RARITIES.some(value=>value===rarity))throw new HttpError(400,`Rareté absente pour ${item.code}.`);
  const newlyValidated=old.rarityStatus!=='validated'||!!old.rarityProposal;
  const c={...old,rarity,rarityStatus:'validated' as const,rarityProposal:null,rarityProposedBy:null,rarityProposedAt:null,rarityValidatedBy:newlyValidated?actor.userId:old.rarityValidatedBy,rarityValidatedAt:newlyValidated?t:old.rarityValidatedAt,status:'ready' as const,updatedAt:t};
  if(missing(c).length)throw new HttpError(400,`Fiche incomplète : ${item.code}.`);
  before.push(old);after.push(c);
 }
 if(after.length!==50)throw new HttpError(409,'Catalogue incomplet.');
 const photos=await Promise.all(after.map(c=>env.BUCKET?.head(c.imageKey)));
 if(photos.some(p=>!p||p.size===0))throw new HttpError(409,'Une illustration est absente.');
 await commitCatalog({revision:state.revision,onceKey,actor,cards:after,settings:[{id:onceKey,data:JSON.stringify({at:t,codes:after.map(c=>c.code),instruction:'Valide toutes les cartes et mets les comme prêtes.'})}],before,after,action:'Validation globale et passage à Prête',entity:`50 cartes · lot ${batch}/2`});
 return {updated:after.map(c=>c.code),revision:(await stateFor(actor)).revision};
}
