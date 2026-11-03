import {normalizeWishlist} from './wishlist';
import type {Album,Card} from './model';
import type {TestGame} from './test-game-engine';
import {albumContains} from './album-membership';
export const CARD_XP:Record<string,number>={Courante:5,Inhabituelle:8,Rare:15,Précieuse:25,Légendaire:50,Suprême:100,'Editions spéciales':100};
export const LEGACY_LEVEL_XP=Array.from({length:50},(_,i)=>i).reduce<number[]>((a,i)=>{a.push(i===0?0:a[i-1]+50+10*(i-1)+Math.floor((i-1)**2/5));return a;},[]);
export const XP_CURVE_VERSION=4;
export const LEVEL_XP=Array.from({length:50},(_,i)=>i).reduce<number[]>((a,i)=>{a.push(i===0?0:a[i-1]+250+60*(i-1)+6*(i-1)**2);return a;},[]);
// Restore the pre-V2 level curve; cumulative XP is never removed.
export function rebalanceProgression(p:Progression,now:number){if(p.xpCurveVersion===XP_CURVE_VERSION)return false;p.xpRebalance={at:now,previousXP:p.xp};p.level=levelFor(p.xp);p.xpCurveVersion=XP_CURVE_VERSION;return true;}

export function levelFor(xp:number){let level=1;while(level<50&&xp>=LEVEL_XP[level])level++;return level;}
export function rankFor(level:number){return level===50?"Légende d’ATLAS":level>=40?'Érudit':level>=30?'Conservateur':level>=20?'Archiviste':level>=10?'Cartographe':level>=5?'Explorateur':'Novice';}
export const BONUS:Record<number,{shards?:number;pack?:boolean;cosmetic:string}>={5:{shards:30,cosmetic:'Badge Explorateur'},10:{pack:true,cosmetic:'Cadre Cartographe'},20:{shards:50,cosmetic:'Cadre Archiviste'},25:{pack:true,cosmetic:''},30:{shards:75,cosmetic:'Cadre animé Conservateur'},40:{pack:true,cosmetic:'Titre Érudit'},50:{shards:150,pack:true,cosmetic:'Cadre exclusif animé Légende'}};
export function levelReward(level:number){const b=BONUS[level];return `35 Éclats${b?.shards?` + ${b.shards} Éclats`:''}${b?.pack?' + booster Ciblé':''}${b?.cosmetic?` + ${b.cosmetic}`:''}`;}
export type XPEvent={id:string;at:number;source:string;xp:number;shards?:number;classicPacks?:number;label:string;packId?:string;packType?:string;instanceId?:string;modelId?:string;rarity?:string;reason?:string;actor?:string;universe?:string;category?:string;isNew?:boolean};
export type Challenge={id:string;label:string;metric:'packs'|'cards'|'discoveries'|'universes'|'models'|'rarity_cards'|'universe_cards'|'universe_collection'|'active_days'|'categories'|'recycles'|'duplicate_recycles'|'daily_days';target:number;xp:number;shards:number;classicPacks?:number;progress:number;rewardedAt?:number;difficulty:string;name?:string;rewardChoice?:boolean;choice?:'shards'|'epic';completedAt?:number;universes?:string[];universe?:string;minimumXP?:number;perGroup?:number};
export type ChallengePeriod={id:string;startsAt:number;endsAt:number;items:Challenge[];schemaVersion?:number};
export type Progression={version:1;levelRollback?:{version:1;at:number;fromLevel:number;toLevel:number;total:number;debited:number;remaining:number;removedRewards:Progression['levelRewards'];compensation:number};economyVersion?:number;economyMigration?:{at:number;compensatedLevels:number[];compensation:number;previousXP:number};challengeHistory?:ChallengePeriod[];dailyCompletion?:Record<string,string[]>;login?:{lastDate:string;day:number;cycle:number;history:{id:string;date:string;day:number;cycle:number;at:number;shards:number;packIds:string[]}[]};xpCurveVersion?:number;xpRebalance?:{at:number;previousXP:number};startedAt:number;xp:number;level:number;events:XPEvent[];levelRewards:{level:number;at:number;shards:number;shardsPending?:boolean;shardsClaimedAt?:number;packId?:string;cosmetic?:string}[];albumRewards:{id:string;version:string;at:number;xp:number}[];discovered:string[];stats:{packs:number;cards:number;supremes:number;trades:number};achievements:Record<string,number>;featured:string[];frame:string;title:string;daily:ChallengePeriod;weekly:ChallengePeriod};
const utcDate=(s:string)=>new Date(s+'T12:00:00Z');
export function parisDate(now:number){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
function midnight(date:string){const target=Date.parse(date+'T00:00:00Z');let candidate=target;for(let i=0;i<3;i++){const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(candidate);const get=(s:string)=>p.find(x=>x.type===s)!.value;const asUTC=Date.parse(`${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:00Z`);candidate+=target-asUTC;}return candidate;}
const addDays=(date:string,n:number)=>{const d=utcDate(date);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
export function periodBounds(now:number,weekly=false){let date=parisDate(now);if(weekly){const day=utcDate(date).getUTCDay();date=addDays(date,-((day+6)%7));}return {id:date,startsAt:midnight(date),endsAt:midnight(addDays(date,weekly?7:1))};}
export const CHALLENGE_VERSION=5;
function period(now:number,weekly:boolean,_p:unknown,_catalog:Card[]):ChallengePeriod{
 const b=periodBounds(now,weekly);
 const specs:Pick<Challenge,'name'|'label'|'metric'|'target'|'xp'|'shards'|'rewardChoice'>[]=weekly?[
 {name:'Explorateur assidu',label:'Ouvrir 20 boosters',metric:'packs',target:20,xp:45,shards:250},
 {name:'Maître du recyclage',label:'Recycler 20 doublons',metric:'duplicate_recycles',target:20,xp:75,shards:300},
 {name:'Chasseur de raretés',label:'Obtenir 8 cartes Rares ou supérieures dans des boosters',metric:'rarity_cards',target:8,xp:105,shards:350},
 {name:'Passionné d’ATLAS',label:'Ouvrir 40 boosters',metric:'packs',target:40,xp:75,shards:400},
 {name:'Détermination',label:'Terminer au moins 4 défis quotidiens sur 5 jours distincts',metric:'daily_days',target:5,xp:105,shards:450,rewardChoice:true},
 ]:[
 {name:'Premier tirage',label:'Ouvrir 3 boosters',metric:'packs',target:3,xp:5,shards:25},
 {name:'Recycleur',label:'Recycler 5 cartes',metric:'recycles',target:5,xp:8,shards:35},
 {name:'Belle trouvaille',label:'Obtenir une carte Rare ou supérieure dans un booster',metric:'rarity_cards',target:1,xp:10,shards:45},
 {name:'Collectionneur actif',label:'Ouvrir 6 boosters',metric:'packs',target:6,xp:8,shards:60},
 {name:'Grand recyclage',label:'Recycler 12 doublons',metric:'duplicate_recycles',target:12,xp:10,shards:85},
 ];
 return {...b,schemaVersion:CHALLENGE_VERSION,items:specs.map((c,i)=>({...c,id:`economy-v2:${weekly?'week':'day'}:${b.id}:${i}`,difficulty:weekly?'Hebdomadaire':'Quotidien',progress:0}))};
}
function renewPeriod(previous:ChallengePeriod,now:number,weekly:boolean,p:Progression,catalog:Card[]){
 if(previous.items.length){p.challengeHistory??=[];if(!p.challengeHistory.some(h=>h.id===previous.id&&h.schemaVersion===previous.schemaVersion&&h.items[0]?.id===previous.items[0]?.id))p.challengeHistory.push(structuredClone(previous));}
 return period(now,weekly,p,catalog);
}
function payChallenge(g:TestGame,c:Challenge,pr:ChallengePeriod,now:number,choice?:'shards'|'epic'){
 const p=g.progression!,id='challenge:'+c.id;if(c.rewardedAt||p.events.some(e=>e.id===id))return null;
 if(c.rewardChoice&&!choice)return null;
 c.rewardedAt=now;if(choice)c.choice=choice;
 const shards=choice==='epic'?0:c.shards;g.shards+=shards;
 if(choice==='epic')g.packs.push({id:crypto.randomUUID(),type:'evenement'});
 const event:XPEvent={id,at:now,source:c.id.includes(':week:')?'weekly':'daily',xp:c.xp,shards,label:`${c.name||c.label}${choice==='epic'?' · booster Épique en réserve':''}`};grantXP(g,event);
 if(event.source==='daily'){p.dailyCompletion??={};const ids=p.dailyCompletion[pr.id]??=[];if(!ids.includes(c.id))ids.push(c.id);}
 return event;
}
export function chooseChallengeReward(g:TestGame,challengeId:unknown,choice:unknown,now:number){
 if(choice!=='shards'&&choice!=='epic')throw Error('Choisissez 450 Éclats ou un booster Épique.');
 const periods=[g.progression!.weekly,...(g.progression!.challengeHistory||[])],pr=periods.find(h=>h.items.some(c=>c.id===challengeId&&c.rewardChoice)),c=pr?.items.find(c=>c.id===challengeId);
 if(!pr||!c||!c.completedAt||c.progress<c.target)throw Error('Ce défi n’est pas encore terminé.');
 if(c.rewardedAt)return c.choice;payChallenge(g,c,pr,now,choice);return choice;
}
export function settleChallenges(g:TestGame,catalog:Card[],now:number){const p=g.progression!;const earned:XPEvent[]=[];
 for(const pr of [p.daily,p.weekly]){const events=p.events.filter(e=>e.at>=pr.startsAt&&e.at<pr.endsAt),booster=events.filter(e=>e.source==='booster');
  for(const c of pr.items){if(c.rewardedAt)continue;let value=0;
   if(c.metric==='packs')value=new Set(booster.map(e=>e.packId)).size;
   else if(c.metric==='rarity_cards')value=booster.filter(e=>(CARD_XP[e.rarity||'']||0)>=15).length;
   else if(c.metric==='recycles')value=events.filter(e=>e.source==='recycle').length;
   else if(c.metric==='duplicate_recycles')value=events.filter(e=>e.source==='recycle'&&e.isNew===false).length;
   else if(c.metric==='daily_days')value=Object.entries(p.dailyCompletion||{}).filter(([date,ids])=>date>=pr.id&&date<addDays(pr.id,7)&&new Set(ids).size>=4).length;
   c.progress=Math.min(c.target,value);if(c.progress<c.target)continue;c.completedAt??=now;const event=payChallenge(g,c,pr,now);if(event)earned.push(event);
  }
 }return earned;
}
// One zero-XP audit event per removed copy, in the same CAS transaction as the recycling.
export function recordRecycling(g:TestGame,card:Card,duplicate:boolean,now:number){if(!g.progression)return;grantXP(g,{id:'recycle:'+crypto.randomUUID(),at:now,source:'recycle',xp:0,modelId:card.id,rarity:card.rarity||'',isNew:!duplicate,label:`Recyclage · ${card.name}`});}
export const LOGIN_REWARDS=[{shards:50},{shards:75},{shards:100},{shards:150},{shards:0,pack:'classique'},{shards:200},{shards:300,pack:'evenement'}] as const;
export function awardLogin(g:TestGame,now:number){const p=g.progression!,date=parisDate(now),previous=p.login;if(previous&&previous.lastDate>=date)return false;
 const consecutive=previous&&addDays(previous.lastDate,1)===date,day=consecutive?previous.day%7+1:1,cycle=previous?(day===1?previous.cycle+1:previous.cycle):1;
 const reward=LOGIN_REWARDS[day-1],packIds:string[]=[];g.shards+=reward.shards;if('pack' in reward){const id=crypto.randomUUID();g.packs.push({id,type:reward.pack});packIds.push(id);}
 const entry={id:'login:'+date,date,day,cycle,at:now,shards:reward.shards,packIds};p.login={lastDate:date,day,cycle,history:[...(previous?.history||[]),entry]};recoverLevelShards(g,now);return true;
}
// Only the receipts created/raised by V2 are reversed. Earlier legitimate gains remain.
export function rollbackLevelEconomy(g:TestGame,now:number){
 const p=g.progression!;if(p.levelRollback?.version===1)return false;
 const m=p.economyMigration,fromLevel=p.level,toLevel=levelFor(p.xp),removedRewards:Progression['levelRewards']=[];let total=0;
 if(m){const kept:Progression['levelRewards']=[];
  for(const r of p.levelRewards){
   if(r.at>=m.at){removedRewards.push({...r});if(!r.shardsPending)total+=r.shards;
    // A genuinely reached old-curve level keeps its original pending 35 reward.
    if(r.level<=toLevel)kept.push({...r,shards:35+(BONUS[r.level]?.shards||0),shardsPending:true,shardsClaimedAt:undefined});
   }else{
    const originalBase=r.shards-(BONUS[r.level]?.shards||0);
    if(originalBase===75){r.shards-=40;if(m.compensatedLevels.includes(r.level)||(!r.shardsPending&&(r.shardsClaimedAt||0)>=m.at))total+=40;}
    kept.push(r);
   }
  }p.levelRewards=kept;
 }
 p.level=toLevel;p.xpCurveVersion=XP_CURVE_VERSION;p.economyVersion=2;
 p.levelRollback={version:1,at:now,fromLevel,toLevel,total,debited:0,remaining:total,removedRewards,compensation:m?.compensation||0};
 // Keep audit records; stop unearned frames/titles from exposing the rolled-back level.
 const cosmetics=p.levelRewards.map(r=>r.cosmetic);if(p.frame&&!cosmetics.includes(p.frame))p.frame='';if(p.title==='Érudit'&&!p.levelRewards.some(r=>r.level===40))p.title='';
 if(!p.levelRewards.some(r=>r.level===5))delete p.achievements.explorer;if(toLevel<50&&!p.levelRewards.some(r=>r.level===50))delete p.achievements['level-50'];
 recoverLevelShards(g,now);return true;
}
export function recoverLevelShards(g:TestGame,now:number){const p=g.progression!,r=p.levelRollback;if(!r||r.remaining<=0)return 0;const debit=Math.min(Math.max(0,g.shards),r.remaining);if(!debit)return 0;g.shards-=debit;r.remaining-=debit;r.debited+=debit;p.events.push({id:'levels-rollback:'+crypto.randomUUID(),at:now,source:'economy',xp:0,shards:-debit,label:'Annulation des Éclats des niveaux V2'});return debit;}
function migrateEconomy(g:TestGame,now:number){rollbackLevelEconomy(g,now);}
export function ensureProgression(g:TestGame,catalog:Card[],now:number){
 normalizeWishlist(g);
 const copies=new Set<string>();g.inventory=g.inventory.map(c=>{const id=c.instanceId&&!copies.has(c.instanceId)?c.instanceId:crypto.randomUUID();copies.add(id);return {...c,instanceId:id};});
 if(!g.progression){const discovered=[...new Set(g.inventory.map(c=>c.id))];g.progression={version:1,xpCurveVersion:XP_CURVE_VERSION,startedAt:now,xp:0,level:1,events:[],levelRewards:[],albumRewards:[],discovered,stats:{packs:0,cards:0,supremes:0,trades:0},achievements:{},featured:[],frame:'',title:'',daily:period(now,false,{discovered},catalog),weekly:period(now,true,{discovered},catalog)};}
 const p=g.progression;migrateEconomy(g,now);rebalanceProgression(p,now);recoverLevelShards(g,now);if(p.daily.id!==periodBounds(now).id||p.daily.schemaVersion!==CHALLENGE_VERSION)p.daily=renewPeriod(p.daily,now,false,p,catalog);if(p.weekly.id!==periodBounds(now,true).id||p.weekly.schemaVersion!==CHALLENGE_VERSION)p.weekly=renewPeriod(p.weekly,now,true,p,catalog);return p;
}
export function grantXP(g:TestGame,event:XPEvent){const p=g.progression!;if(p.events.some(e=>e.id===event.id))return false;p.events.push(event);p.xp=Math.max(0,p.xp+event.xp);p.level=levelFor(p.xp);
 for(let n=2;n<=p.level;n++){if(p.levelRewards.some(r=>r.level===n))continue;const b=BONUS[n],shards=35+(b?.shards||0),priorPack=p.levelRollback?.removedRewards.find(r=>r.level===n)?.packId,packId=b?.pack?(priorPack||crypto.randomUUID()):undefined;if(packId&&!priorPack)g.packs.push({id:packId,type:'cible'});p.levelRewards.push({level:n,at:event.at,shards,shardsPending:true,packId,cosmetic:b?.cosmetic||undefined});}return true;}
function achievements(p:Progression,catalog:Card[],now:number){const unlock=(id:string,condition:boolean)=>{if(condition&&!p.achievements[id])p.achievements[id]=now;};unlock('explorer',p.levelRewards.some(r=>r.level===5));unlock('first-pack',p.stats.packs>0);unlock('first-supreme',p.stats.supremes>0);unlock('100-cards',p.stats.cards>=100);unlock('500-cards',p.stats.cards>=500);unlock('first-album',p.albumRewards.length>0);unlock('five-albums',p.albumRewards.length>=5);const universes=[...new Set(catalog.filter(c=>c.status==='ready'&&c.rarity!=='Editions spéciales').map(c=>c.universe))];unlock('all-universes',universes.length>0&&universes.every(u=>catalog.some(c=>c.universe===u&&p.discovered.includes(c.id))));unlock('ten-trades',p.stats.trades>=10);unlock('level-50',p.level===50);}
export const ACHIEVEMENTS:Record<string,string>={'explorer':'Explorateur','first-pack':'Première ouverture','first-supreme':'Première Suprême','100-cards':'100 cartes de boosters','500-cards':'500 cartes de boosters','first-album':'Premier album complété','five-albums':'Cinq albums complétés','all-universes':'Tous les univers explorés','ten-trades':'Dix échanges finalisés','level-50':'Légende d’ATLAS'};
export function syncProgression(g:TestGame,catalog:Card[],albums:Album[],now:number,version:string){const p=ensureProgression(g,catalog,now);for(const c of g.inventory)if(!p.discovered.includes(c.id))p.discovered.push(c.id);
 const owned=new Set(g.inventory.map(c=>c.id));for(const a of albums.filter(a=>a.status==='active')){if(p.albumRewards.some(r=>r.id===a.id))continue;const cards=catalog.filter(c=>c.status==='ready'&&albumContains(c,a));if(!cards.length||!cards.every(c=>owned.has(c.id)))continue;const xp=a.kind==='general'?400:cards.length<=20?75:cards.length<=60?150:250;p.albumRewards.push({id:a.id,version,at:now,xp});grantXP(g,{id:'album:'+a.id,at:now,source:'album',xp,label:`Première complétion · ${a.name}`});}settleChallenges(g,catalog,now);recoverLevelShards(g,now);achievements(p,catalog,now);return p;}
export function awardOpening(g:TestGame,pack:{id:string;type:string},cards:Card[],catalog:Card[],now:number){const p=ensureProgression(g,catalog,now);if(p.events.some(e=>e.packId===pack.id&&e.source==='booster'))return null;
 const fromLevel=p.level,newIds:string[]=[],xpByCard=cards.map((c,i)=>{const isNew=!p.discovered.includes(c.id);if(isNew){p.discovered.push(c.id);newIds.push(c.id);}const xp=CARD_XP[c.rarity||'']||0;grantXP(g,{id:`draw:${pack.id}:${i}`,instanceId:`${pack.id}:${i}`,packId:pack.id,packType:pack.type,modelId:c.id,rarity:c.rarity||'',universe:c.universe,category:c.category,isNew,at:now,source:'booster',xp,label:c.name});return {instanceId:`${pack.id}:${i}`,xp,isNew};});
 p.stats.packs++;p.stats.cards+=cards.length;p.stats.supremes+=cards.filter(c=>c.rarity==='Suprême').length;
 const gained=settleChallenges(g,catalog,now);
 achievements(p,catalog,now);return {cards:xpByCard,total:xpByCard.reduce((s,c)=>s+c.xp,0),fromLevel,toLevel:p.level,challengeXP:gained.reduce((s,e)=>s+e.xp,0),rewards:p.levelRewards.filter(r=>r.level>fromLevel)};
}
export function selectCosmetics(p:Progression,input:any){if(!Array.isArray(input.featured)||input.featured.length>3||new Set(input.featured).size!==input.featured.length||input.featured.some((id:unknown)=>typeof id!=='string'||!p.achievements[id]))throw Error('Choisissez jusqu’à trois succès débloqués.');const frames=p.levelRewards.map(r=>r.cosmetic).filter(c=>c?.includes('Cadre'));if(input.frame!==''&&!frames.includes(input.frame))throw Error('Cadre non débloqué.');if(input.title!==''&&!(input.title==='Érudit'&&p.levelRewards.some(r=>r.level===40)))throw Error('Titre non débloqué.');p.featured=input.featured;p.frame=input.frame;p.title=input.title;}

export function claimLevelShards(g:TestGame,now:number){let total=0;for(const reward of g.progression!.levelRewards){if(!reward.shardsPending)continue;total+=reward.shards;reward.shardsPending=false;reward.shardsClaimedAt=now;}g.shards+=total;recoverLevelShards(g,now);return total;}
