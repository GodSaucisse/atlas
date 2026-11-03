import type {Card,Album} from '../model';
import type {TestGame} from '../test-game-engine';
import {randomInt} from '../test-game-engine';
import {syncProgression} from '../progression';
import {dailyTheme} from '../daily-theme';
import {WHEEL_RULES,SPIN_THROTTLE,surpriseRarity,chestOutcome,type WheelKind,type WheelReward,type WheelSpin} from './rules';
export class WheelError extends Error{constructor(public status:number,message:string){super(message)}}
const schemas=new WeakMap<object,Promise<void>>();
type Row={id:string;user_id:string;request_id:string;wheel:WheelKind;at:number;price:number;segment:number;reward_json:string;claimed_at:number|null;theme:string|null};
function view(row:Row):WheelSpin{return {id:row.id,requestId:row.request_id,wheel:row.wheel,at:row.at,price:row.price,segment:row.segment,reward:JSON.parse(row.reward_json),claimedAt:row.claimed_at,theme:row.theme};}
export class WheelService{
 constructor(readonly database:any,readonly media:(key:string)=>Promise<boolean>,readonly random:(max:number)=>number=randomInt,readonly clock:()=>number=Date.now){}
 async ensure(){let pending=schemas.get(this.database);if(!pending){pending=Promise.resolve(this.database.batch([
 `CREATE TABLE IF NOT EXISTS atlas_wheel_spins(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,request_id TEXT NOT NULL,wheel TEXT NOT NULL CHECK(wheel IN ('eclats','destin')),at INTEGER NOT NULL,price INTEGER NOT NULL,segment INTEGER NOT NULL,reward_json TEXT NOT NULL,claimed_at INTEGER,theme TEXT,UNIQUE(user_id,request_id))`,
 `CREATE INDEX IF NOT EXISTS atlas_wheel_personal_history ON atlas_wheel_spins(user_id,at DESC,id DESC)`,
 `CREATE TABLE IF NOT EXISTS atlas_wheel_ops(id TEXT PRIMARY KEY,actor TEXT NOT NULL,action TEXT NOT NULL,ok INTEGER NOT NULL CHECK(ok=1),at INTEGER NOT NULL)`,
 `CREATE TRIGGER IF NOT EXISTS atlas_wheel_result_immutable BEFORE UPDATE OF id,user_id,request_id,wheel,at,price,segment,reward_json ON atlas_wheel_spins BEGIN SELECT RAISE(ABORT,'Wheel result immutable'); END`,
 `CREATE TRIGGER IF NOT EXISTS atlas_wheel_claim_once BEFORE UPDATE OF claimed_at,theme ON atlas_wheel_spins WHEN OLD.claimed_at IS NOT NULL BEGIN SELECT RAISE(ABORT,'Wheel chest already claimed'); END`,
 ].map(sql=>this.database.prepare(sql)))).then(()=>{});schemas.set(this.database,pending);}try{await pending}catch(e){schemas.delete(this.database);throw e;}}
 requestId(value:unknown){if(typeof value!=='string'||!/^[a-zA-Z0-9:-]{8,100}$/.test(value))throw new WheelError(400,'Identifiant de lancer invalide.');return value;}
 async receipt(user:string,request:string,wheel?:WheelKind){const row=await this.database.prepare('SELECT * FROM atlas_wheel_spins WHERE user_id=? AND request_id=?').bind(user,request).first() as Row|null;if(row&&wheel&&row.wheel!==wheel)throw new WheelError(409,'Cet identifiant appartient à un autre lancer.');return row;}
 async wallet(user:string){const key='test-game-v1:'+user,row=await this.database.prepare('SELECT data FROM settings WHERE id=?').bind(key).first();if(!row)throw new WheelError(409,'Ouvrez votre espace joueurs avant de lancer une roue.');return {key,raw:row.data as string,game:JSON.parse(row.data) as TestGame};}
 async guard(id:string,user:string,action:string,key:string,raw:string,now:number,spinId?:string){return this.database.prepare(`INSERT INTO atlas_wheel_ops(id,actor,action,ok,at) VALUES(?,?,?,CASE WHEN EXISTS(SELECT 1 FROM settings WHERE id=? AND data=?)${spinId?" AND EXISTS(SELECT 1 FROM atlas_wheel_spins WHERE id=? AND user_id=? AND claimed_at IS NULL)":''} THEN 1 ELSE 0 END,?)`).bind(id,user,action,key,raw,...(spinId?[spinId,user]:[]),now);}
 async catalog(){return (await this.database.prepare('SELECT data FROM cards').all()).results.map((r:any)=>JSON.parse(r.data)) as Card[];}
 async selectCard(cards:Card[],rarity:string){const pool=cards.filter(c=>c.status==='ready'&&c.rarityStatus==='validated'&&!c.rarityProposal&&c.rarity===rarity&&c.universe!=='Editions spéciales'&&c.imageKey);while(pool.length){const card=pool.splice(this.random(pool.length),1)[0];if(await this.media(card.imageKey))return card;}throw new WheelError(409,`Aucune carte ${rarity} admissible et illustrée. Lancer annulé, aucun débit.`);}
 async spin(user:string,kind:WheelKind,request:unknown){await this.ensure();if(!Object.hasOwn(WHEEL_RULES,kind))throw new WheelError(400,'Roue inconnue.');const requestId=this.requestId(request),previous=await this.receipt(user,requestId,kind);if(previous)return view(previous);
 const rule=WHEEL_RULES[kind];
 for(let attempt=0;attempt<6;attempt++){
  const replay=await this.receipt(user,requestId,kind);if(replay)return view(replay);
  const {key,raw,game}=await this.wallet(user),now=this.clock();if(game.shards<rule.price||(game.wheelLastSpinAt!==undefined&&now-game.wheelLastSpinAt<SPIN_THROTTLE)){const saved=await this.receipt(user,requestId,kind);if(saved)return view(saved);if(game.shards<rule.price)throw new WheelError(400,`Éclats insuffisants : ${rule.price} nécessaires.`);throw new WheelError(429,'Un lancer vient d’être validé. Patientez un instant avant le suivant.');}
  const index=this.random(rule.segments.length),segment=rule.segments[index];let reward:WheelReward,card:Card|undefined;
  if(segment.kind==='none')reward={kind:'none',label:'Aucun gain'};
  else if(segment.kind==='shards')reward={kind:'shards',amount:segment.amount!,label:segment.label};
  else if(segment.kind==='relay')reward={kind:'relay',count:3,label:'3 boosters Relais'};
  else if(segment.kind==='card'){
   const catalog=await this.catalog();if(!['Rare','Précieuse'].every(r=>catalog.some(c=>c.status==='ready'&&c.rarityStatus==='validated'&&!c.rarityProposal&&c.rarity===r&&c.universe!=='Editions spéciales'&&c.imageKey)))throw new WheelError(409,'Une rareté de carte surprise est indisponible. Lancer annulé, aucun débit.');
   card=await this.selectCard(catalog,surpriseRarity(this.random(100)));reward={kind:'card',card:{...card,description:'',learningText:''},label:`${card.name} · ${card.rarity}`};
  }else{
   const outcome=chestOutcome(this.random(100)),available=outcome==='themes5'?[...new Set((await this.catalog()).filter(c=>c.status==='ready'&&c.rarity!=='Editions spéciales').map(c=>c.universe))].sort():[],themes=outcome==='themes5'&&available.length>=3?dailyTheme(now,available).names:[];
   if(outcome==='themes5'&&themes.length!==3)throw new WheelError(409,'Les trois thèmes du jour sont indisponibles. Lancer annulé, aucun débit.');
   reward={kind:'chest',outcome,count:outcome==='epic1'?1:outcome==='epic3'?3:5,themes,label:outcome==='themes5'?'5 boosters thématiques à choisir':outcome==='epic1'?'1 booster Épique':'3 boosters Épiques'};
  }
  const id=crypto.randomUUID();game.shards-=rule.price;if(reward.kind==='shards')game.shards+=reward.amount;
  if(reward.kind==='relay')for(let i=0;i<3;i++)game.packs.push({id:crypto.randomUUID(),type:'relais',source:'wheel'});
  if(reward.kind==='chest'&&reward.outcome!=='themes5')for(let i=0;i<reward.count;i++)game.packs.push({id:crypto.randomUUID(),type:'evenement',source:'wheel'});
  if(card){game.inventory.push(card);const [catalog,albums]=await Promise.all([this.catalog(),this.database.prepare('SELECT data FROM albums').all()]);syncProgression(game,catalog,albums.results.map((r:any)=>JSON.parse(r.data)) as Album[],now,'wheel:'+id);}
  game.wheelLastSpinAt=now;game.revision++;
  const pending=reward.kind==='chest'&&reward.outcome==='themes5';
  try{await this.database.batch([await this.guard('spin:'+user+':'+requestId,user,'spin:'+kind,key,raw,now),this.database.prepare('UPDATE settings SET data=? WHERE id=?').bind(JSON.stringify(game),key),this.database.prepare('INSERT INTO atlas_wheel_spins(id,user_id,request_id,wheel,at,price,segment,reward_json,claimed_at,theme) VALUES(?,?,?,?,?,?,?,?,?,NULL)').bind(id,user,requestId,kind,now,rule.price,index,JSON.stringify(reward),pending?null:now)]);return view({id,user_id:user,request_id:requestId,wheel:kind,at:now,price:rule.price,segment:index,reward_json:JSON.stringify(reward),claimed_at:pending?null:now,theme:null});}
  catch(error){const saved=await this.receipt(user,requestId,kind);if(saved)return view(saved);if(attempt===5)throw new WheelError(503,'Lancer non confirmé. Reprenez avec le même identifiant ; aucun second débit ne sera effectué.');}
 }
 throw new WheelError(503,'Lancer momentanément indisponible.');
 }
 async claim(user:string,spinId:unknown,theme:unknown,request:unknown){await this.ensure();this.requestId(request);if(typeof spinId!=='string'||typeof theme!=='string')throw new WheelError(400,'Choix invalide.');
 for(let attempt=0;attempt<6;attempt++){
  const row=await this.database.prepare('SELECT * FROM atlas_wheel_spins WHERE id=? AND user_id=?').bind(spinId,user).first() as Row|null;if(!row)throw new WheelError(404,'Coffre introuvable.');const reward=JSON.parse(row.reward_json) as WheelReward;
  if(reward.kind!=='chest'||reward.outcome!=='themes5')throw new WheelError(400,'Ce lancer ne nécessite aucun choix de thème.');if(row.claimed_at!==null)return view(row);if(!reward.themes.includes(theme))throw new WheelError(400,'Choisissez un des trois thèmes enregistrés lors du gain.');
  const {key,raw,game}=await this.wallet(user),now=this.clock();for(let i=0;i<5;i++)game.packs.push({id:crypto.randomUUID(),type:'cible',theme,source:'wheel'});game.revision++;
  try{await this.database.batch([await this.guard('claim:'+spinId,user,'claim',key,raw,now,spinId),this.database.prepare('UPDATE settings SET data=? WHERE id=?').bind(JSON.stringify(game),key),this.database.prepare('UPDATE atlas_wheel_spins SET claimed_at=?,theme=? WHERE id=? AND user_id=?').bind(now,theme,spinId,user)]);return view({...row,claimed_at:now,theme});}catch(error){const saved=await this.database.prepare('SELECT * FROM atlas_wheel_spins WHERE id=? AND user_id=?').bind(spinId,user).first() as Row|null;if(saved?.claimed_at!==null&&saved)return view(saved);if(attempt===5)throw new WheelError(503,'Choix non confirmé. Réessayez ce coffre sans risque de double attribution.');}
 }
 throw new WheelError(503,'Coffre momentanément indisponible.');
 }
 async snapshot(user:string,cursor?:string,request?:string){await this.ensure();let at=Number.MAX_SAFE_INTEGER,id='~';if(cursor){const match=/^(\d{1,16})~([a-zA-Z0-9-]{1,100})$/.exec(cursor);if(!match)throw new WheelError(400,'Page d’historique invalide.');at=Number(match[1]);id=match[2];}
 const [{game},history,pending,total]=await Promise.all([this.wallet(user),this.database.prepare('SELECT * FROM atlas_wheel_spins WHERE user_id=? AND (at<? OR (at=? AND id<?)) ORDER BY at DESC,id DESC LIMIT 41').bind(user,at,at,id).all(),this.database.prepare("SELECT * FROM atlas_wheel_spins WHERE user_id=? AND claimed_at IS NULL ORDER BY at DESC,id DESC LIMIT 20").bind(user).all(),this.database.prepare('SELECT COUNT(*) n FROM atlas_wheel_spins WHERE user_id=? AND claimed_at IS NULL').bind(user).first()]);const rows=history.results as Row[],last=rows[39],requested=request?await this.receipt(user,this.requestId(request)):null;return {userId:user,balance:game.shards,revision:game.revision,history:rows.slice(0,40).map(view),pending:pending.results.map(view),pendingCount:total.n,cursor:rows.length>40?`${last.at}~${last.id}`:null,...(request?{request:requested?view(requested):null}:{})};
 }
 async statistics(){await this.ensure();const [totals,rewards,segments]=await Promise.all([this.database.prepare('SELECT wheel,COUNT(*) spins,SUM(price) spent,SUM(CASE WHEN json_extract(reward_json,\'$.kind\')=\'shards\' THEN json_extract(reward_json,\'$.amount\') ELSE 0 END) shardsAwarded FROM atlas_wheel_spins GROUP BY wheel').all(),this.database.prepare("SELECT wheel,json_extract(reward_json,'$.kind') kind,json_extract(reward_json,'$.outcome') outcome,json_extract(reward_json,'$.card.rarity') rarity,COUNT(*) count,SUM(CASE WHEN claimed_at IS NULL THEN 1 ELSE 0 END) pending FROM atlas_wheel_spins GROUP BY wheel,kind,outcome,rarity").all(),this.database.prepare('SELECT wheel,segment,COUNT(*) count FROM atlas_wheel_spins GROUP BY wheel,segment').all()]);return {at:this.clock(),totals:totals.results,rewards:rewards.results,segments:segments.results};}
}
