import {HALLOWEEN_EVENT,isHalloweenActive} from './event';
import {RARITIES,type Rarity} from './rarities';
// Integers in 1/1000 of a percent. Each column sums to exactly 100000.
// Model counts are intentionally absent from these editorial-independent rates.
export const BASE_BOOSTER_POLICY={
 version:'2026-10-28-rates-v3',relaisRechargeMinutes:10,relaisCapacity:10,welcomeShards:100,welcomeOnce:true,
 boosters:[
  {id:'classique',name:'Classique',cards:5,priceShards:150,rates:[51900,28000,13000,5000,1850,50,200]},
  {id:'relais',name:'Relais',cards:5,priceShards:0,rates:[51900,28000,13000,5000,1850,50,200]},
  {id:'cible',name:'Thème',cards:5,priceShards:200,rates:[48850,28000,14000,6400,2500,50,200]},
  {id:'evenement',name:'Épique',cards:5,priceShards:250,rates:[41950,28000,17000,9000,3800,50,200]},
  {id:'recomposition',name:'Recomposition',cards:3,priceShards:0,rates:[74755,20000,4000,900,95,50,200]},
  {id:'bienvenue',name:'Découverte',cards:5,priceShards:0,rates:[47700,28000,15000,6500,2550,50,200]},
 ],
} as const;
export function boosterPolicyForEvent(active:boolean){const editionRate=active?HALLOWEEN_EVENT.editionRate:200;return {...BASE_BOOSTER_POLICY,version:active?'2026-10-28-halloween-04':BASE_BOOSTER_POLICY.version,event:{...HALLOWEEN_EVENT,active,editionRate},boosters:BASE_BOOSTER_POLICY.boosters.map(b=>({...b,rates:b.rates.map((value,i)=>i===0?value+b.rates[6]-editionRate:i===6?editionRate:value)}))};}
// Getters evaluate at request/render time, so long-lived Workers also stop the event.
export const BOOSTER_POLICY={...BASE_BOOSTER_POLICY,get version(){return boosterPolicyForEvent(isHalloweenActive()).version},get event(){return boosterPolicyForEvent(isHalloweenActive()).event},get boosters(){return boosterPolicyForEvent(isHalloweenActive()).boosters}};
export function percentage(units:number){return (units/1000).toLocaleString('fr-FR',{minimumFractionDigits:units%10?3:units%1000?2:0,maximumFractionDigits:3})+' %';}
export function rateFor(boosterId:string,rarity:Rarity){const booster=BOOSTER_POLICY.boosters.find(b=>b.id===boosterId);if(!booster)throw new Error('Booster inconnu');return booster.rates[RARITIES.indexOf(rarity)];}
