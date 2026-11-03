import type {Card} from '../model';
export type WheelKind='eclats'|'destin';
export type Segment={kind:'none'|'shards'|'relay'|'card'|'chest';amount?:number;label:string};
const empty=():Segment=>({kind:'none',label:'Aucun gain'});
const shards=(amount:number):Segment=>({kind:'shards',amount,label:`${amount} Éclats`});
export const WHEEL_RULES:Record<WheelKind,{name:string;price:number;segments:Segment[]}>= {
 eclats:{name:'Roue des Éclats',price:30,segments:[empty(),shards(10),empty(),shards(20),empty(),shards(30),empty(),shards(50),empty(),shards(100),{kind:'relay',amount:3,label:'3 boosters Relais'},{kind:'card',label:'1 carte surprise'}]},
 destin:{name:'Roue du Destin',price:100,segments:[empty(),empty(),shards(10),empty(),empty(),shards(25),empty(),empty(),shards(50),empty(),empty(),shards(75),empty(),empty(),shards(100),empty(),empty(),shards(300),shards(500),{kind:'chest',label:'Coffre du Destin'}]}
};
export const SPIN_DURATION=6600;
export const SPIN_THROTTLE=1500;
export type WheelReward={kind:'none';label:string}|{kind:'shards';amount:number;label:string}|{kind:'relay';count:3;label:string}|{kind:'card';card:Card;label:string}|{kind:'chest';outcome:'epic1'|'epic3'|'themes5';count:number;themes:string[];label:string};
export type WheelSpin={id:string;requestId:string;wheel:WheelKind;at:number;price:number;segment:number;reward:WheelReward;claimedAt:number|null;theme:string|null};
export type WheelSnapshot={userId:string;balance:number;revision:number;history:WheelSpin[];pending:WheelSpin[];pendingCount:number;cursor:string|null;request?:WheelSpin|null};
export function surpriseRarity(roll:number){return roll<80?'Rare':'Précieuse';}
export function chestOutcome(roll:number){return roll<70?'epic1':roll<95?'epic3':'themes5';}
/** Segment zero starts at twelve o'clock. Positive CSS rotation is clockwise. */
export function landingRotation(previous:number,segment:number,count:number){return Math.floor(previous/360)*360+6*360+(360-(segment+.5)*360/count);}
export function pointedSegment(rotation:number,count:number){return Math.floor((((-rotation%360)+360)%360)/(360/count))%count;}
export function rewardText(spin:WheelSpin){return spin.reward.kind==='chest'&&spin.reward.outcome==='themes5'?spin.claimedAt?`5 boosters thématiques · ${spin.theme}`:'Coffre · 5 boosters thématiques à choisir':spin.reward.label;}
