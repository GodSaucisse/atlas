import type {Album,Card} from './model';
import type {TestGame} from './test-game-engine';
import {albumContains} from './album-membership';
export const CARD_XP:Record<string,number>={Courante:5,Inhabituelle:8,Rare:15,Précieuse:25,Légendaire:50,Suprême:100,'Editions spéciales':100};
export const LEGACY_LEVEL_XP=Array.from({length:50},(_,i)=>i).reduce<number[]>((a,i)=>{a.push(i===0?0:a[i-1]+50+10*(i-1)+Math.floor((i-1)**2/5));return a;},[]);
export const XP_CURVE_VERSION=2;
export const LEVEL_XP=Array.from({length:50},(_,i)=>i).reduce<number[]>((a,i)=>{a.push(i===0?0:a[i-1]+250+60*(i-1)+6*(i-1)**2);return a;},[]);
export function rebalanceProgression(p:Progression,now:number){if(p.xpCurveVersion===XP_CURVE_VERSION)return false;const previousXP=p.xp;let level=1;while(level<50&&previousXP>=LEGACY_LEVEL_XP[level])level++;const oldBase=LEGACY_LEVEL_XP[level-1],newBase=LEVEL_XP[level-1];p.xp=level===50?newBase+Math.max(0,previousXP-oldBase):newBase+Math.floor((previousXP-oldBase)/(LEGACY_LEVEL_XP[level]-oldBase)*(LEVEL_XP[level]-newBase));p.level=level;p.xpCurveVersion=XP_CURVE_VERSION;p.xpRebalance={at:now,previousXP};return true;}

export function levelFor(xp:number){let level=1;while(level<50&&xp>=LEVEL_XP[level])level++;return level;}
export function rankFor(level:number){return level===50?"Légende d’ATLAS":level>=40?'Érudit':level>=30?'Conservateur':level>=20?'Archiviste':level>=10?'Cartographe':level>=5?'Explorateur':'Novice';}
export const BONUS:Record<number,{shards?:number;pack?:boolean;cosmetic:string}>={5:{shards:30,cosmetic:'Badge Explorateur'},10:{pack:true,cosmetic:'Cadre Cartographe'},20:{shards:50,cosmetic:'Cadre Archiviste'},25:{pack:true,cosmetic:''},30:{shards:75,cosmetic:'Cadre animé Conservateur'},40:{pack:true,cosmetic:'Titre Érudit'},50:{shards:150,pack:true,cosmetic:'Cadre exclusif animé Légende'}};
export function levelReward(level:number){const b=BONUS[level];return `35 Éclats${b?.shards?` + ${b.shards} Éclats`:''}${b?.pack?' + booster Ciblé':''}${b?.cosmetic?` + ${b.cosmetic}`:''}`;}
export type XPEvent={id:string;at:number;source:string;xp:number;shards?:number;classicPacks?:number;label:string;packId?:string;packType?:string;instanceId?:string;modelId?:string;rarity?:string;reason?:string;actor?:string;universe?:string;category?:string;isNew?:boolean};
export type Challenge={id:string;label:string;metric:'packs'|'cards'|'discoveries'|'universes'|'models'|'rarity_cards'|'universe_cards'|'universe_collection'|'active_days'|'categories';target:number;xp:number;shards:number;classicPacks?:number;progress:number;rewardedAt?:number;difficulty:string;universes?:string[];universe?:string;minimumXP?:number;perGroup?:number};
export type ChallengePeriod={id:string;startsAt:number;endsAt:number;items:Challenge[];schemaVersion?:number};
export type Progression={version:1;xpCurveVersion?:number;xpRebalance?:{at:number;previousXP:number};startedAt:number;xp:number;level:number;events:XPEvent[];levelRewards:{level:number;at:number;shards:number;shardsPending?:boolean;shardsClaimedAt?:number;packId?:string;cosmetic?:string}[];albumRewards:{id:string;version:string;at:number;xp:number}[];discovered:string[];stats:{packs:number;cards:number;supremes:number;trades:number};achievements:Record<string,number>;featured:string[];frame:string;title:string;daily:ChallengePeriod;weekly:ChallengePeriod};
const utcDate=(s:string)=>new Date(s+'T12:00:00Z');
function parisDate(now:number){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
function midnight(date:string){const target=Date.parse(date+'T00:00:00Z');let candidate=target;for(let i=0;i<3;i++){const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(candidate);const get=(s:string)=>p.find(x=>x.type===s)!.value;const asUTC=Date.parse(`${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:00Z`);candidate+=target-asUTC;}return candidate;}
const addDays=(date:string,n:number)=>{const d=utcDate(date);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
export function periodBounds(now:number,weekly=false){let date=parisDate(now);if(weekly){const day=utcDate(date).getUTCDay();date=addDays(date,-((day+6)%7));}return {id:date,startsAt:midnight(date),endsAt:midnight(addDays(date,weekly?7:1))};}
export const CHALLENGE_VERSION=4;
function period(now:number,weekly:boolean,p:Pick<Progression,'discovered'>&Partial<Pick<Progression,'events'>>,catalog:Card[]):ChallengePeriod{
 const b=periodBounds(now,weekly),day=Math.floor(Date.parse(b.id)/86400000),seed=weekly?Math.floor(day/7):day;
 const available=catalog.filter(c=>c.status==='ready'&&c.rarity!=='Editions spéciales'),missing=available.filter(c=>!p.discovered.includes(c.id)).length;
 const universes=[...new Set(available.map(c=>c.universe))].sort(),categories=new Set(available.map(c=>c.category).filter(Boolean)).size;
 const pick=(n:number)=>((seed%n)+n)%n,universe=universes[pick(Math.max(1,universes.length))];
 type Goal={metric:Challenge['metric'];target:number;label:string;minimumXP?:number;perGroup?:number;universe?:string};
 const packs=(n:number):Goal=>({metric:'packs',target:n,label:`Ouvrir ${n} boosters`}),cards=(n:number):Goal=>({metric:'cards',target:n,label:`Obtenir ${n} cartes dans des boosters`}),models=(n:number):Goal=>({metric:'models',target:Math.max(1,Math.min(n,available.length)),label:`Obtenir ${Math.max(1,Math.min(n,available.length))} modèles différents dans des boosters`});
 const coverage=(n:number,each:number):Goal=>({metric:'universe_collection',target:Math.max(1,Math.min(n,universes.length)),perGroup:each,label:`Obtenir au moins ${each} cartes dans chacun de ${Math.max(1,Math.min(n,universes.length))} univers`});
 const focus=(n:number):Goal=>({metric:'universe_cards',target:n,universe,label:`Obtenir ${n} cartes de l’univers ${universe} dans des boosters`});
 const rare=(n:number,minimumXP:number):Goal=>!available.some(c=>(CARD_XP[c.rarity||'']||0)>=minimumXP)?cards(n*5):({metric:'rarity_cards',target:n,minimumXP,label:`Obtenir ${n} cartes ${minimumXP===25?'Précieuses':'Rares'} ou supérieures dans des boosters`});
 const days=(n:number,each:number):Goal=>{const today=parisDate(now),todayStart=midnight(today),past=new Map<string,number>();for(const e of p.events||[])if(e.source==='booster'&&e.at>=b.startsAt&&e.at<todayStart){const date=parisDate(e.at);past.set(date,(past.get(date)||0)+1);}const remaining=7-((utcDate(today).getUTCDay()+6)%7),possible=remaining+[...past.values()].filter(count=>count>=each).length;return possible<n?(each>=25?rare(60,15):cards(225)):{metric:'active_days',target:n,perGroup:each,label:`Obtenir au moins ${each} cartes de boosters sur ${n} jours différents`};};
 const discoveries=(n:number):Goal=>missing>=n&&missing>=available.length*.35?{metric:'discoveries',target:n,label:`Découvrir ${n} nouveaux modèles dans des boosters`}:models(120);
 const dailyBanks:Goal[][]=[
  [packs(5),cards(30),packs(7),cards(40),packs(6),cards(35),packs(8)],
  [models(22),coverage(3,4),focus(8),models(30),coverage(4,4),focus(10),models(26)],
  [rare(5,15),rare(3,25),coverage(4,5),rare(7,15),...(categories>=8?[{metric:'categories' as const,target:8,label:'Obtenir des cartes de 8 catégories différentes dans des boosters'}]:[packs(9)]),rare(4,25),rare(8,15)]
 ];
 const weeklyBanks:Goal[][]=[
  [packs(35),cards(200),days(5,15),packs(45),cards(250),days(6,15),packs(40)],
  [models(120),coverage(6,12),focus(35),discoveries(35),coverage(7,10),models(150),focus(40)],
  [rare(45,15),days(6,25),rare(12,25),coverage(8,15),rare(60,15),focus(50),rare(15,25)]
 ];
 const banks=weekly?weeklyBanks:dailyBanks,difficulties=weekly?['Facile','Intermédiaire','Difficile']:['Découverte','Collection','Exploration'];
 const items=banks.map((bank,i)=>({...bank[pick(bank.length)],id:`${weekly?'week':'day'}:${b.id}:${difficulties[i]}`,xp:weekly?[45,75,105][i]:[5,8,10][i],shards:weekly?[10,20,30][i]:[3,5,7][i],classicPacks:weekly&&i===2?3:undefined,difficulty:difficulties[i],progress:0}));
 return {...b,schemaVersion:CHALLENGE_VERSION,items};
}
function renewPeriod(previous:ChallengePeriod,now:number,weekly:boolean,p:Progression,catalog:Card[]){const next=period(now,weekly,p,catalog);if(previous.id===next.id&&(previous.schemaVersion===2||previous.schemaVersion===3)){next.items=previous.items.map((old,i)=>old.rewardedAt?old:{...old,xp:weekly?[45,75,105][i]:old.xp,shards:weekly?[10,20,30][i]:old.shards,classicPacks:weekly&&i===2?3:undefined});return next;}if(previous.id===next.id)next.items=next.items.map((c,i)=>{if(c.metric==='discoveries'&&p.events.some(e=>e.source==='booster'&&e.at>=next.startsAt&&e.at<next.endsAt&&e.isNew===undefined)){c={...c,metric:'models',target:Math.max(1,Math.min(120,catalog.filter(m=>m.status==='ready'&&m.rarity!=='Editions spéciales').length)),label:`Obtenir ${Math.max(1,Math.min(120,catalog.filter(m=>m.status==='ready'&&m.rarity!=='Editions spéciales').length))} modèles différents dans des boosters`};}const old=previous.items[i],received=p.events.find(e=>e.id==='challenge:'+c.id);return old?.rewardedAt?old:received?{...c,progress:c.target,rewardedAt:received.at}:c;});return next;}
export function settleChallenges(g:TestGame,catalog:Card[],now:number){const p=g.progression!,models=new Map(catalog.map(c=>[c.id,c]));const earned:XPEvent[]=[];
 for(const pr of [p.daily,p.weekly]){const events=p.events.filter(e=>e.source==='booster'&&e.at>=pr.startsAt&&e.at<pr.endsAt),universe=(e:XPEvent)=>e.universe||models.get(e.modelId||'')?.universe||'',category=(e:XPEvent)=>e.category||models.get(e.modelId||'')?.category||'';
  for(const c of pr.items){if(c.rewardedAt)continue;let value=0;
   if(c.metric==='packs')value=new Set(events.map(e=>e.packId)).size;
   else if(c.metric==='cards')value=events.length;
   else if(c.metric==='models')value=new Set(events.map(e=>e.modelId)).size;
   else if(c.metric==='discoveries')value=new Set(events.filter(e=>e.isNew).map(e=>e.modelId)).size;
   else if(c.metric==='universes')value=new Set(events.map(universe).filter(Boolean)).size;
   else if(c.metric==='categories')value=new Set(events.map(category).filter(Boolean)).size;
   else if(c.metric==='rarity_cards')value=events.filter(e=>(CARD_XP[e.rarity||'']||0)>=(c.minimumXP||15)).length;
   else if(c.metric==='universe_cards')value=events.filter(e=>universe(e)===c.universe).length;
   else if(c.metric==='universe_collection'||c.metric==='active_days'){const groups=new Map<string,number>();for(const e of events){const key=c.metric==='active_days'?parisDate(e.at):universe(e);if(key)groups.set(key,(groups.get(key)||0)+1);}value=[...groups.values()].filter(n=>n>=(c.perGroup||1)).length;}
   c.progress=Math.min(c.target,value);if(c.progress<c.target)continue;const id='challenge:'+c.id,already=p.events.find(e=>e.id===id);if(already){c.rewardedAt=already.at;continue;}c.rewardedAt=now;g.shards+=c.shards;for(let i=0;i<(c.classicPacks||0);i++)g.packs.push({id:crypto.randomUUID(),type:'classique'});const event={id,at:now,source:pr===p.daily?'daily':'weekly',xp:c.xp,shards:c.shards,classicPacks:c.classicPacks,label:c.label};grantXP(g,event);earned.push(event);
  }
 }return earned;
}
export function ensureProgression(g:TestGame,catalog:Card[],now:number){
 if(!g.progression){const discovered=[...new Set(g.inventory.map(c=>c.id))];g.progression={version:1,xpCurveVersion:XP_CURVE_VERSION,startedAt:now,xp:0,level:1,events:[],levelRewards:[],albumRewards:[],discovered,stats:{packs:0,cards:0,supremes:0,trades:0},achievements:{},featured:[],frame:'',title:'',daily:period(now,false,{discovered},catalog),weekly:period(now,true,{discovered},catalog)};}
 const p=g.progression;rebalanceProgression(p,now);if(p.daily.id!==periodBounds(now).id||p.daily.schemaVersion!==CHALLENGE_VERSION)p.daily=renewPeriod(p.daily,now,false,p,catalog);if(p.weekly.id!==periodBounds(now,true).id||p.weekly.schemaVersion!==CHALLENGE_VERSION)p.weekly=renewPeriod(p.weekly,now,true,p,catalog);return p;
}
export function grantXP(g:TestGame,event:XPEvent){const p=g.progression!;if(p.events.some(e=>e.id===event.id))return false;p.events.push(event);p.xp=Math.max(0,p.xp+event.xp);p.level=levelFor(p.xp);
 for(let n=2;n<=p.level;n++){if(p.levelRewards.some(r=>r.level===n))continue;const b=BONUS[n],shards=35+(b?.shards||0),packId=b?.pack?crypto.randomUUID():undefined;if(packId)g.packs.push({id:packId,type:'cible'});p.levelRewards.push({level:n,at:event.at,shards,shardsPending:true,packId,cosmetic:b?.cosmetic||undefined});}return true;}
function achievements(p:Progression,catalog:Card[],now:number){const unlock=(id:string,condition:boolean)=>{if(condition&&!p.achievements[id])p.achievements[id]=now;};unlock('explorer',p.levelRewards.some(r=>r.level===5));unlock('first-pack',p.stats.packs>0);unlock('first-supreme',p.stats.supremes>0);unlock('100-cards',p.stats.cards>=100);unlock('500-cards',p.stats.cards>=500);unlock('first-album',p.albumRewards.length>0);unlock('five-albums',p.albumRewards.length>=5);const universes=[...new Set(catalog.filter(c=>c.status==='ready'&&c.rarity!=='Editions spéciales').map(c=>c.universe))];unlock('all-universes',universes.length>0&&universes.every(u=>catalog.some(c=>c.universe===u&&p.discovered.includes(c.id))));unlock('ten-trades',p.stats.trades>=10);unlock('level-50',p.level===50);}
export const ACHIEVEMENTS:Record<string,string>={'explorer':'Explorateur','first-pack':'Première ouverture','first-supreme':'Première Suprême','100-cards':'100 cartes de boosters','500-cards':'500 cartes de boosters','first-album':'Premier album complété','five-albums':'Cinq albums complétés','all-universes':'Tous les univers explorés','ten-trades':'Dix échanges finalisés','level-50':'Légende d’ATLAS'};
export function syncProgression(g:TestGame,catalog:Card[],albums:Album[],now:number,version:string){const p=ensureProgression(g,catalog,now);for(const c of g.inventory)if(!p.discovered.includes(c.id))p.discovered.push(c.id);
 const owned=new Set(g.inventory.map(c=>c.id));for(const a of albums.filter(a=>a.status==='active')){if(p.albumRewards.some(r=>r.id===a.id))continue;const cards=catalog.filter(c=>c.status==='ready'&&albumContains(c,a));if(!cards.length||!cards.every(c=>owned.has(c.id)))continue;const xp=a.kind==='general'?400:cards.length<=20?75:cards.length<=60?150:250;p.albumRewards.push({id:a.id,version,at:now,xp});grantXP(g,{id:'album:'+a.id,at:now,source:'album',xp,label:`Première complétion · ${a.name}`});}settleChallenges(g,catalog,now);achievements(p,catalog,now);return p;}
export function awardOpening(g:TestGame,pack:{id:string;type:string},cards:Card[],catalog:Card[],now:number){const p=ensureProgression(g,catalog,now);if(p.events.some(e=>e.packId===pack.id&&e.source==='booster'))return null;
 const fromLevel=p.level,newIds:string[]=[],xpByCard=cards.map((c,i)=>{const isNew=!p.discovered.includes(c.id);if(isNew){p.discovered.push(c.id);newIds.push(c.id);}const xp=CARD_XP[c.rarity||'']||0;grantXP(g,{id:`draw:${pack.id}:${i}`,instanceId:`${pack.id}:${i}`,packId:pack.id,packType:pack.type,modelId:c.id,rarity:c.rarity||'',universe:c.universe,category:c.category,isNew,at:now,source:'booster',xp,label:c.name});return {instanceId:`${pack.id}:${i}`,xp,isNew};});
 p.stats.packs++;p.stats.cards+=cards.length;p.stats.supremes+=cards.filter(c=>c.rarity==='Suprême').length;
 const gained=settleChallenges(g,catalog,now);
 achievements(p,catalog,now);return {cards:xpByCard,total:xpByCard.reduce((s,c)=>s+c.xp,0),fromLevel,toLevel:p.level,challengeXP:gained.reduce((s,e)=>s+e.xp,0),rewards:p.levelRewards.filter(r=>r.level>fromLevel)};
}
export function selectCosmetics(p:Progression,input:any){if(!Array.isArray(input.featured)||input.featured.length>3||new Set(input.featured).size!==input.featured.length||input.featured.some((id:unknown)=>typeof id!=='string'||!p.achievements[id]))throw Error('Choisissez jusqu’à trois succès débloqués.');const frames=p.levelRewards.map(r=>r.cosmetic).filter(c=>c?.includes('Cadre'));if(input.frame!==''&&!frames.includes(input.frame))throw Error('Cadre non débloqué.');if(input.title!==''&&!(input.title==='Érudit'&&p.levelRewards.some(r=>r.level===40)))throw Error('Titre non débloqué.');p.featured=input.featured;p.frame=input.frame;p.title=input.title;}

export function claimLevelShards(g:TestGame,now:number){let total=0;for(const reward of g.progression!.levelRewards){if(!reward.shardsPending)continue;total+=reward.shards;reward.shardsPending=false;reward.shardsClaimedAt=now;}g.shards+=total;return total;}
