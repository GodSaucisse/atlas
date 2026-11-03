import {HALLOWEEN_EVENT,isHalloweenActive,isOct31Bonus} from './event';
import {RARITIES,type Rarity} from './rarities';
// Integers in 1/1000 of a percent. Each column sums to exactly 100000.
// Model counts are intentionally absent from these editorial-independent rates.
export const BASE_BOOSTER_POLICY={
 version:'2026-10-31-economy-v2',relaisRechargeMinutes:10,relaisCapacity:15,welcomeShards:100,welcomeOnce:true,
 boosters:[
  {id:'classique',name:'Classique',cards:5,priceShards:150,rates:[51700,28000,13000,5000,1850,50,400]},
  {id:'relais',name:'Relais',cards:5,priceShards:0,rates:[51700,28000,13000,5000,1850,50,400]},
  {id:'cible',name:'Thème',cards:5,priceShards:200,rates:[48600,28000,14000,6400,2500,100,400]},
  {id:'evenement',name:'Épique',cards:5,priceShards:400,rates:[41550,28000,17000,9000,3800,250,400]},
  {id:'recomposition',name:'Recomposition',cards:3,priceShards:0,rates:[74555,20000,4000,900,95,50,400]},
  {id:'bienvenue',name:'Découverte',cards:5,priceShards:0,rates:[47500,28000,15000,6500,2550,50,400]},
 ],
} as const;
// Uniform edition chance for every booster, with a doubled event rate.
export const BASE_SPECIAL_EDITION_RATE=400;
export const JAMES_BOND_CODE="FIC-106";
export const JAMES_BOND_RATE=70; // 0.07% per card, a dedicated slice taken from Courante.
// The fifth Epic card has its own distribution. Event multipliers match the
// ordinary edition rate (0.40% -> 0.80%, and 1.50% on October 31).
export function epicSpecialSlotRates(editionRate:number){
 const specialEditionRate=500*editionRate/BASE_SPECIAL_EDITION_RATE;
 return [0,0,0,78500-specialEditionRate,19000,2500,specialEditionRate];
}
export function boosterPolicyForEvent(active:boolean,now=Date.now()){
 const editionRate=isOct31Bonus(now)?1500:active?HALLOWEEN_EVENT.editionRate:BASE_SPECIAL_EDITION_RATE;
 return {...BASE_BOOSTER_POLICY,version:BASE_BOOSTER_POLICY.version+(active?'-halloween':''),event:{...HALLOWEEN_EVENT,active,editionRate},boosters:BASE_BOOSTER_POLICY.boosters.map(b=>{const rate=editionRate;return {...b,standardCards:b.id==='evenement'?4:b.cards,specialSlotRates:b.id==='evenement'?epicSpecialSlotRates(editionRate):null,rates:b.rates.map((value,i)=>i===0?value+b.rates[6]-rate-JAMES_BOND_RATE:i===5?value+JAMES_BOND_RATE:i===6?rate:value)};})};
}
// Getters evaluate at request/render time, so long-lived Workers also stop the event.
export const BOOSTER_POLICY={...BASE_BOOSTER_POLICY,get version(){return boosterPolicyForEvent(isHalloweenActive()).version},get event(){return boosterPolicyForEvent(isHalloweenActive()).event},get boosters(){return boosterPolicyForEvent(isHalloweenActive()).boosters}};
export function percentage(units:number){return (units/1000).toLocaleString('fr-FR',{minimumFractionDigits:units%10?3:units%1000?2:0,maximumFractionDigits:3})+' %';}
export function rateFor(boosterId:string,rarity:Rarity){const booster=BOOSTER_POLICY.boosters.find(b=>b.id===boosterId);if(!booster)throw new Error('Booster inconnu');return booster.rates[RARITIES.indexOf(rarity)];}
