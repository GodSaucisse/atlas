import {db,initialize,stateFor,commitCatalog,HttpError} from './server';
import {SEEDED,EMPTY_RARITY,type Card} from './model';
import {BOOSTER_POLICY} from './config/boosters';
export const POLICY_ID='official-rarities-2026-10-22';
const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const OTHER=[
 {name:'Jésus-Christ',key:'jesuschrist',universe:'Chrétienté',category:'Catholicisme',rarity:'Suprême'},
 {name:'Marie, mère de Jésus',key:'mariemeredejesus',universe:'Chrétienté',category:'Catholicisme',rarity:'Suprême'},
 {name:'La Bible',key:'labible',universe:'Chrétienté',category:'Catholicisme',rarity:'Suprême'},
 {name:'Tour Eiffel',key:'toureiffel',universe:'Histoire',category:'Monument',rarity:'Légendaire'},
];
export async function applyOfficialPolicy(){
 await initialize();
 const applied=await db().prepare('SELECT data FROM settings WHERE id=?').bind(POLICY_ID).first<{data:string}>();
 if(applied)return {alreadyApplied:true,...JSON.parse(applied.data)};
 const owner=await db().prepare("SELECT user_id,name FROM admins WHERE slot='owner'").first<{user_id:string|null;name:string}>();
 if(!owner?.user_id)throw new HttpError(409,'Le compte principal doit avoir ouvert l’atelier une première fois.');
 const actor={slot:'owner' as const,userId:owner.user_id,email:'',name:`${owner.name} · instruction explicite`,updatedAt:new Date().toISOString()};
 const state=await stateFor(actor);const t=new Date().toISOString();
 const approved=Object.fromEntries(SEEDED.map(([code,,rarity])=>[code,rarity]));const foundOther=new Set<string>();
 const cards=state.cards.map((previous):Card=>{
  let official=previous.universe==='Aviation'?approved[previous.code]:undefined;
  const other=OTHER.find(o=>normalize(previous.name)===o.key&&normalize(previous.universe)===normalize(o.universe)&&normalize(previous.category)===normalize(o.category));
  if(other){official=other.rarity as typeof official;foundOther.add(other.name);}
  return official?{...previous,rarity:official,rarityStatus:'validated',rarityProposal:null,rarityProposedBy:null,rarityProposedAt:null,rarityValidatedBy:owner.user_id,rarityValidatedAt:t,updatedAt:t}:{...previous,...EMPTY_RARITY,rarityProposal:previous.rarityProposal||null,rarityProposedBy:previous.rarityProposedBy||null,rarityProposedAt:previous.rarityProposedAt||null,updatedAt:t};
 });
 const report={appliedAt:t,source:'Instruction explicite du principal · 22/10/2026',approvedIds:cards.filter(c=>c.rarityStatus==='validated').map(c=>c.id),pendingIds:cards.filter(c=>c.rarityStatus==='pending').map(c=>c.id),missingAviationCodes:SEEDED.filter(([code])=>!cards.some(c=>c.code===code&&c.universe==='Aviation')).map(([code])=>code),otherModelsAbsent:OTHER.filter(o=>!foundOther.has(o.name)).map(o=>o.name),aviationModelsPresent:cards.filter(c=>c.universe==='Aviation'&&c.status!=='deleted').length};
 const oldSettings=await db().prepare("SELECT data FROM settings WHERE id='booster-policy'").first<{data:string}>();
 try{await commitCatalog({revision:state.revision,onceKey:POLICY_ID,actor,cards,settings:[{id:POLICY_ID,data:JSON.stringify(report)},{id:'booster-policy',data:JSON.stringify(BOOSTER_POLICY)}],before:{cards:state.cards,boosterPolicy:oldSettings?JSON.parse(oldSettings.data):null},after:{cards,boosterPolicy:BOOSTER_POLICY,report},action:'Application des raretés officielles',entity:`${report.approvedIds.length} décisions validées · barèmes conservés`});}
 catch(e){const existing=await db().prepare('SELECT data FROM settings WHERE id=?').bind(POLICY_ID).first<{data:string}>();if(existing)return {alreadyApplied:true,...JSON.parse(existing.data)};throw e;}
 return {alreadyApplied:false,...report};
}
