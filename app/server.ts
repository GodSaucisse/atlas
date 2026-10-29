import {applyAnimalsFictionImagesMigration} from './animals-fiction-images-migration';
import {applyHalloweenWalterRickMigration} from './halloween-walter-rick-migration';
import {applyAnimalChristianDraftsMigration} from './animal-christian-drafts-migration';
import {applyResearchDraftsMigration} from './research-drafts-migration';
import {isWorkshopPlayer} from './workshop-access';
import {applyRemainingSupremeMigration} from './remaining-supreme-migration';
import {applySaintPierreMigration} from './saint-pierre-migration';
import {applyOctoberSupremeMigration} from './october-supreme-migration';
import {applyHalloweenMigration} from './halloween-migration';
import {catalogAsset} from './catalog-assets';
import {applyEditionUniverseMigration} from './edition-universe-migration';
import {albumAccepts} from './album-membership';
import editionManifest from './content/special-edition-import.json';
import {belongs} from './album-classification';
import {SPECIALIZED_DRAFTS} from './specialized-drafts';
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "./chatgpt-auth";
import {BOOSTER_POLICY} from "./config/boosters";
import { canManageAtlas, RARITIES, UNIVERSES, SEEDED, SEED_ALBUMS, missing, EMPTY_RARITY, type Card, type Album, type Admin, type AtlasState } from "./model";
export class HttpError extends Error { constructor(public status:number,message:string){super(message);} }
export function db(){if(!env.DB)throw new HttpError(503,"La base de données n’est pas encore disponible.");return env.DB;}
const now=()=>new Date().toISOString();
export async function authorize():Promise<Admin & {userId:string}> {
  const user=await getChatGPTUser();if(!user)throw new HttpError(401,"Connectez-vous à votre compte ChatGPT.");
  const database=db();
  let record=await database.prepare("SELECT slot,email,user_id AS userId,name,updated_at AS updatedAt FROM admins WHERE user_id=?").bind(user.userId).first<Admin>();
  if(!record){
    const email=user.email.trim().toLowerCase();const principal=env.ATLAS_OWNER_EMAIL?.trim().toLowerCase();
    if(principal&&email===principal)await database.prepare("INSERT OR IGNORE INTO admins (slot,email,user_id,name,updated_at) VALUES ('owner',?,?,?,?)").bind(email,user.userId,user.fullName||"Mathis",now()).run();
    await database.prepare("UPDATE admins SET user_id=?,updated_at=? WHERE email=? AND user_id IS NULL").bind(user.userId,now(),email).run();
    record=await database.prepare("SELECT slot,email,user_id AS userId,name,updated_at AS updatedAt FROM admins WHERE user_id=?").bind(user.userId).first<Admin>();
  }
  if(!record)throw new HttpError(403,"Ce compte n’a pas d’accès à l’atelier ATLAS.");
  if(!canManageAtlas(record.slot))throw new HttpError(403,"Cette action nécessite un compte administrateur autorisé.");
  return {...record,userId:user.userId};
}
export type AtlasPlayer={userId:string;name:string;email:string;slot:'player'};
/** Player sessions are separate from ChatGPT administrator identities. */
export async function authorizePlayer(request?:Request):Promise<AtlasPlayer>{
  const {playerFromRequest}=await import('./player-auth');
  return playerFromRequest(request);
}
export async function playerCanAccessWorkshop(actor:AtlasPlayer){if(!isWorkshopPlayer(actor.email,env.ATLAS_OWNER_EMAIL||'',env.ATLAS_WORKSHOP_EMAILS||''))return false;const admin=await db().prepare('SELECT slot FROM admins WHERE lower(email)=?').bind(actor.email.trim().toLowerCase()).first<{slot:string}>();return !!admin&&canManageAtlas(admin.slot);}
export async function playerState(){
  const {applyPlayerStarterMigration}=await import('./player-starter');await applyPlayerStarterMigration();
  await initialize();const database=db();
  const [meta,cards,albums]=await Promise.all([
    database.prepare("SELECT revision FROM catalog_meta WHERE id='catalog'").first<{revision:number}>(),
    database.prepare('SELECT data FROM cards ORDER BY code').all<{data:string}>(),
    database.prepare('SELECT data FROM albums').all<{data:string}>(),
  ]);
  return {revision:meta?.revision||0,cards:cards.results.map(r=>({...EMPTY_RARITY,...JSON.parse(r.data)} as Card)),albums:albums.results.map(r=>JSON.parse(r.data) as Album)};
}
export async function initialize(){
  const database=db();
  if(await database.prepare("SELECT id FROM catalog_meta WHERE id='catalog'").first())return;
  const t=now();const token=crypto.randomUUID();
  const statements=[database.prepare("INSERT OR IGNORE INTO catalog_meta (id,revision,last_mutation) VALUES ('catalog',0,?)").bind(token)];
  const gate="(SELECT last_mutation FROM catalog_meta WHERE id='catalog')=?";
  for(const [code,name,rarity] of SEEDED){
    const c:Card={...EMPTY_RARITY,rarityStatus:"validated",rarityValidatedBy:"instruction-principal-20261022",rarityValidatedAt:t,id:code,code,name,rarity,universe:"Aviation",category:"",description:"",imageKey:"",imageCredit:"",imageSource:"",albumIds:["aviation"],status:"draft",updatedAt:t};
    statements.push(database.prepare(`INSERT INTO cards (id,code,data) SELECT ?,?,? WHERE ${gate}`).bind(code,code,JSON.stringify(c),token));
  }
  for(const [id,name,kind,status] of SEED_ALBUMS){
    const a:Album={id,name,kind,status,universe:"Aviation",description:"",updatedAt:t};
    statements.push(database.prepare(`INSERT INTO albums (id,data) SELECT ?,? WHERE ${gate}`).bind(id,JSON.stringify(a),token));
  }
  statements.push(database.prepare(`INSERT INTO audit (id,at,actor_id,actor_name,action,entity,before_json,after_json,revision) SELECT ?,?,'system','ATLAS','Initialisation','12 cartes · 8 albums conservés · 2 reportés',NULL,?,1 WHERE ${gate}`).bind(crypto.randomUUID(),t,JSON.stringify({decisions:"22/10/2026",rarities:SEEDED,albums:SEED_ALBUMS,notes:"Illustrations, textes, catégories et classements spécialisés à compléter. Aucun album écarté créé."}),token));
  statements.push(database.prepare("UPDATE catalog_meta SET revision=1,last_mutation='seeded' WHERE id='catalog' AND last_mutation=?").bind(token));
  await database.batch(statements);
}
export async function stateFor(admin:Admin & {userId:string},allLogs=false):Promise<AtlasState>{
  await initialize();
  const seeded=await db().prepare("SELECT id FROM settings WHERE id='specialized-drafts-v1'").first();
  if(!seeded){
    const existing=await db().prepare('SELECT data FROM albums').all<{data:string}>();
    const albums=existing.results.map(r=>JSON.parse(r.data) as Album);
    const additions:Album[]=[];
    for(const [universe,names] of Object.entries(SPECIALIZED_DRAFTS)){
      if(albums.some(a=>a.universe===universe&&a.kind==='specialized'&&a.status!=='deleted'))continue;
      for(const name of names)additions.push({id:crypto.randomUUID(),name,universe,kind:'specialized',description:'Proposition à sélectionner et à compléter dans l’atelier.',status:'draft',updatedAt:now()});
    }
    const meta=await db().prepare("SELECT revision FROM catalog_meta WHERE id='catalog'").first<{revision:number}>();
    try{await commitCatalog({onceKey:'specialized-drafts-v1',revision:meta!.revision,actor:admin,albums:additions,settings:[{id:'specialized-drafts-v1',data:'true'}],before:null,after:additions,action:'Propositions d’albums spécialisés',entity:`${additions.length} albums en brouillon`});}catch(e){if(!(await db().prepare("SELECT id FROM settings WHERE id='specialized-drafts-v1'").first()))throw e;}
  }
  if(!(await db().prepare("SELECT id FROM settings WHERE id='populate-specialized-v2'").first())){
    const ar=await db().prepare('SELECT data FROM albums').all<{data:string}>();const cr=await db().prepare('SELECT data FROM cards').all<{data:string}>();
    const albums=ar.results.map(r=>JSON.parse(r.data) as Album),cards=cr.results.map(r=>JSON.parse(r.data) as Card);
    const selected=albums.filter(a=>a.kind==='specialized'&&(a.status==='draft'||a.status==='active'));
    const updates=cards.filter(c=>c.status!=='deleted'&&c.status!=='archived').map(c=>{const ids=selected.filter(a=>belongs(c,a)).map(a=>a.id);return {...c,albumIds:[...new Set([...c.albumIds,...ids])],updatedAt:now()};}).filter(c=>c.albumIds.length!==cards.find(o=>o.id===c.id)!.albumIds.length);
    const changed=selected.filter(a=>a.status==='draft'&&cards.some(c=>belongs(c,a))).map(a=>({...a,status:'active' as const,updatedAt:now()}));
    const meta=await db().prepare("SELECT revision FROM catalog_meta WHERE id='catalog'").first<{revision:number}>();
    try{await commitCatalog({onceKey:'populate-specialized-v2',revision:meta!.revision,actor:admin,cards:updates,albums:changed,settings:[{id:'populate-specialized-v2',data:'true'}],before:{albums:selected,cards:cards.filter(c=>updates.some(u=>u.id===c.id))},after:{albums:changed,cards:updates},action:'Classement et conservation des albums spécialisés',entity:`${changed.length} albums conservés · ${updates.length} cartes classées`});}catch(e){if(!(await db().prepare("SELECT id FROM settings WHERE id='populate-specialized-v2'").first()))throw e;}
  }
  if(!(await db().prepare("SELECT id FROM settings WHERE id='special-editions-20261027-v1'").first())){
    const ar=await db().prepare('SELECT data FROM albums').all<{data:string}>(),cr=await db().prepare('SELECT data FROM cards').all<{data:string}>();
    const albums=ar.results.map(r=>JSON.parse(r.data) as Album),existing=cr.results.map(r=>JSON.parse(r.data) as Card),t=now();
    const album:Album={id:'editions-speciales',name:'Editions spéciales',universe:'Editions spéciales',kind:'general',description:'Les modèles et variantes en édition spéciale d’ATLAS, tous univers confondus.',status:'active',updatedAt:t};
    if(albums.some(a=>a.name===album.name&&a.id!==album.id))throw new HttpError(409,'Un album Editions spéciales existe déjà sous un autre identifiant.');
    const additions:Card[]=editionManifest.map(item=>{
      const previous=existing.find(c=>c.code===item.code);if(previous)throw new HttpError(409,'Un numéro réservé aux éditions spéciales est déjà utilisé.');
      const subjectAlbums=albums.filter(a=>a.status==='active'&&a.universe===item.universe&&a.kind==='general').map(a=>a.id);
      const card:Card={...EMPTY_RARITY,id:item.code,code:item.code,name:item.name,universe:item.universe,category:item.category,description:item.description,rarity:'Editions spéciales',rarityStatus:'validated',rarityValidatedBy:admin.userId,rarityValidatedAt:t,imageKey:item.imageKey,imageFit:'cover',imageCredit:'Modèle original fourni par le créateur ATLAS',imageSource:'',albumIds:[album.id,...subjectAlbums],status:'ready',updatedAt:t};
      card.albumIds=[...new Set([...card.albumIds,...albums.filter(a=>a.kind==='specialized'&&a.status==='active'&&belongs(card,a)).map(a=>a.id)])];return card;
    });
    const meta=await db().prepare("SELECT revision FROM catalog_meta WHERE id='catalog'").first<{revision:number}>();
    try{await commitCatalog({onceKey:'special-editions-20261027-v1',revision:meta!.revision,actor:admin,cards:additions,albums:[album],settings:[{id:'special-editions-20261027-v1',data:'true'}],before:null,after:{album,cards:additions},action:'Création des Editions spéciales sur instruction explicite',entity:'21 modèles · rareté Editions spéciales · album principal'});}catch(e){if(!(await db().prepare("SELECT id FROM settings WHERE id='special-editions-20261027-v1'").first()))throw e;}
  }
  await applyEditionUniverseMigration(admin);
  await applyHalloweenMigration(admin);
  await applyOctoberSupremeMigration(admin);
  await applySaintPierreMigration(admin);
  await applyRemainingSupremeMigration(admin);
  await applyResearchDraftsMigration(admin);
  await applyAnimalChristianDraftsMigration(admin);
  await applyHalloweenWalterRickMigration(admin);
  await applyAnimalsFictionImagesMigration(admin);
  const results=await db().batch([
    db().prepare("SELECT revision FROM catalog_meta WHERE id='catalog'"),db().prepare("SELECT data FROM cards ORDER BY code"),db().prepare("SELECT data FROM albums ORDER BY rowid"),
    db().prepare("SELECT slot,email,user_id AS userId,name,updated_at AS updatedAt FROM admins ORDER BY slot DESC"),
    db().prepare(`SELECT id,at,actor_name AS actorName,action,entity,before_json AS before,after_json AS after,revision FROM audit ORDER BY revision DESC ${allLogs?"":"LIMIT 150"}`),
    db().prepare("SELECT data FROM settings WHERE id=?").bind(`motion:${admin.userId}`),
    db().prepare("SELECT data FROM settings WHERE id='booster-policy'")
  ]);
  return {motion:results[5].results[0]?JSON.parse((results[5].results[0] as any).data):"system",boosterPolicy:BOOSTER_POLICY,revision:(results[0].results[0] as {revision:number}).revision,cards:results[1].results.map((r:any)=>({...EMPTY_RARITY,...JSON.parse(r.data)})),albums:results[2].results.map((r:any)=>JSON.parse(r.data)),admins:results[3].results as unknown as Admin[],logs:results[4].results as any[],user:{id:admin.userId,name:admin.name,email:admin.email,role:admin.slot}};
}
function txt(v:unknown,max:number,required=false){if(typeof v!=="string"||(required&&!v.trim())||v.length>max)throw new HttpError(400,"Un champ est manquant ou trop long.");return v.trim();}
function choice<T extends string>(v:unknown,choices:readonly T[]):T{if(!choices.includes(v as T))throw new HttpError(400,"Une valeur sélectionnée est invalide.");return v as T;}
function administrator(admin:Admin){if(!canManageAtlas(admin.slot))throw new HttpError(403,"Cette action nécessite un compte administrateur autorisé.");}
export function validateCard(raw:any,previous:Card|undefined,admin:Admin,albums:Album[]):Card{
  administrator(admin);
  if(!raw||typeof raw!=="object"||Array.isArray(raw))throw new HttpError(400,"Fiche carte invalide.");
  const code=txt(raw.code,32,true).toUpperCase();if(!/^[A-Z]{2,6}-\d{3,6}$/.test(code))throw new HttpError(400,"Le numéro doit suivre le format AVI-001 (3 à 6 chiffres).");
  const universe=choice(raw.universe,UNIVERSES);const rarity=raw.rarity===null||raw.rarity===""?null:choice(raw.rarity,RARITIES);
  if(previous&&rarity!==previous.rarity)throw new HttpError(400,"La rareté actuelle se modifie dans la gestion des raretés, avec validation explicite d’un administrateur.");
  if(previous&&raw.rarityStatus!==undefined&&raw.rarityStatus!==previous.rarityStatus)throw new HttpError(403,"La validation de rareté nécessite une action explicite dans la gestion des raretés.");
  const proposal=raw.rarityProposal===undefined?(previous?.rarityProposal||null):raw.rarityProposal===null||raw.rarityProposal===""?null:choice(raw.rarityProposal,RARITIES);
  const proposalChanged=proposal!==(previous?.rarityProposal||null);
  const metadata={...EMPTY_RARITY,...(previous?{rarityStatus:previous.rarityStatus,rarityValidatedBy:previous.rarityValidatedBy,rarityValidatedAt:previous.rarityValidatedAt}:{}),rarityProposal:proposal,rarityProposedBy:proposalChanged?(proposal?admin.userId:null):(previous?.rarityProposedBy||null),rarityProposedAt:proposalChanged?(proposal?now():null):(previous?.rarityProposedAt||null)};
  const status=choice(raw.status,["draft","ready","archived","deleted"] as const);
  const category=txt(raw.category,100);if(universe==="Chrétienté"&&category!=="Catholicisme")throw new HttpError(400,"La catégorie de l’univers Chrétienté est Catholicisme.");
  if(!Array.isArray(raw.albumIds)||raw.albumIds.length>100)throw new HttpError(400,"La sélection d’albums est invalide.");
  const albumIds=[...new Set(raw.albumIds)] as string[];
  if(albumIds.some(id=>!albums.some(a=>a.id===id&&a.status!=="deleted"&&albumAccepts({universe,rarity,rarityProposal:proposal,editionSubjectUniverse:previous?.editionSubjectUniverse},a))))throw new HttpError(400,"Les albums doivent appartenir au même univers que la carte.");
  const imageKey=txt(raw.imageKey||"",160);if(imageKey&&!/^[a-f0-9-]{36}\.(png|jpg|webp|gif)$/.test(imageKey))throw new HttpError(400,"L’illustration est invalide.");
  const imageSource=txt(raw.imageSource||"",1000);if(imageSource){let url:URL;try{url=new URL(imageSource);}catch{throw new HttpError(400,"L’URL de la source est invalide.");}if(url.protocol!=="https:")throw new HttpError(400,"La source doit être une adresse HTTPS.");}
  const imageFit=choice(raw.imageFit??previous?.imageFit??"cover",["cover","contain"] as const);
  const c:Card={...metadata,id:previous?.id||crypto.randomUUID(),code,name:txt(raw.name,140,true),universe,...(previous?.editionSubjectUniverse?{editionSubjectUniverse:previous.editionSubjectUniverse}:{}),category,description:txt(raw.description,700),learningText:txt(raw.learningText??previous?.learningText??"",40000),rarity,imageKey,imageFit,imageCredit:txt(raw.imageCredit||"",300),imageSource,albumIds,status,updatedAt:now()};
  if(status==="ready"&&c.rarityStatus!=="validated")throw new HttpError(400,"La rareté doit être validée avant de marquer la carte prête.");
  if(status==="ready"&&missing(c).length)throw new HttpError(400,`À compléter avant validation : ${missing(c).join(", ")}.`);return c;
}
async function imageAvailable(key:string){return !!catalogAsset(key)||!!(await env.BUCKET?.head(key));}
export async function mutate(admin:Admin & {userId:string},input:any){
  administrator(admin);
  const state=await stateFor(admin);if(!Number.isSafeInteger(input.revision)||input.revision!==state.revision)throw new HttpError(409,"Le catalogue a été modifié depuis votre ouverture. Rechargez les données avant de réessayer ; votre saisie est conservée.");
  const changedCards:Card[]=[];const changedAlbums:Album[]=[];let staff:Admin|undefined;let removeEditor=false;const settingChanges:{id:string;data:string}[]=[];
  let before:any=null;let after:any=null;let action="";let entity="";
  if(input.action==="card.save"){
    const previous=state.cards.find(c=>c.id===input.card?.id);if(input.card?.id&&!previous)throw new HttpError(404,"Carte introuvable.");
    const c=validateCard(input.card,previous,admin,state.albums);if(state.cards.some(v=>v.code===c.code&&v.id!==c.id))throw new HttpError(409,"Ce numéro de carte existe déjà, y compris dans la corbeille.");
    if(c.imageKey&&!(await imageAvailable(c.imageKey)))throw new HttpError(400,"L’illustration doit être téléversée avant enregistrement.");
    changedCards.push(c);before=previous;after=c;entity=`${c.code} · ${c.name}`;action=!previous?"Création de carte":previous.rarity!==c.rarity?"Modification de rareté":c.status==="deleted"?"Carte déplacée en corbeille":"Modification de carte";
  }else if(input.action==="cards.ready"){
    if(!Array.isArray(input.ids)||!input.ids.length||input.ids.length>500||new Set(input.ids).size!==input.ids.length)throw new HttpError(400,"Sélectionnez de 1 à 500 cartes distinctes.");
    const oldCards:Card[]=[];const t=now();
    for(const id of input.ids){
      const old=state.cards.find(c=>c.id===id);
      if(!old||old.status!=="draft")throw new HttpError(409,"Une carte sélectionnée n’est plus en brouillon. Actualisez le catalogue.");
      if(old.rarityStatus!=="validated"||old.rarityProposal||missing(old).length)throw new HttpError(400,`Fiche ou rareté à compléter : ${old.code}.`);
      validateCard({...old,status:"ready"},old,admin,state.albums);
      oldCards.push(old);changedCards.push({...old,status:"ready",updatedAt:t});
    }
    for(let i=0;i<changedCards.length;i+=10){const images=await Promise.all(changedCards.slice(i,i+10).map(c=>imageAvailable(c.imageKey)));if(images.some(image=>!image))throw new HttpError(400,"Une illustration est absente. Aucun changement enregistré.");}
    before=oldCards;after=changedCards;action="Cartes · passage à Prête";entity=`${changedCards.length} cartes`;
  }else if(input.action==="album.save"){
    const raw=input.album;if(!raw||typeof raw!=="object"||Array.isArray(raw))throw new HttpError(400,"Fiche album invalide.");const prev=state.albums.find(a=>a.id===raw?.id);if(raw?.id&&!prev)throw new HttpError(404,"Album introuvable.");
    const status=choice(raw.status,["active","draft","deferred","deleted"] as const);if(status==="deleted"||prev?.status==="deleted")administrator(admin);
    const a:Album={id:prev?.id||crypto.randomUUID(),name:txt(raw.name,140,true),description:txt(raw.description,700),universe:choice(raw.universe,UNIVERSES),kind:choice(raw.kind,["general","specialized"] as const),status,updatedAt:now()};
    if(state.albums.some(v=>v.id!==a.id&&v.status!=="deleted"&&v.name.toLocaleLowerCase("fr")===a.name.toLocaleLowerCase("fr")))throw new HttpError(409,"Un album de ce nom existe déjà.");
    if(!Array.isArray(input.cardIds)||input.cardIds.length>10000)throw new HttpError(400,"Sélection de cartes invalide.");const ids=new Set<string>(input.cardIds);
    if([...ids].some(id=>!state.cards.some(c=>c.id===id&&albumAccepts(c,a)&&c.status!=="deleted")))throw new HttpError(400,"Sélectionnez des cartes existantes du même univers.");
    for(const c of state.cards){const had=c.albumIds.includes(a.id);const wants=status!=="deleted"&&ids.has(c.id);if(had!==wants)changedCards.push({...c,albumIds:wants?[...c.albumIds,a.id]:c.albumIds.filter(id=>id!==a.id),updatedAt:now()});}
    changedAlbums.push(a);before={album:prev,cards:state.cards.filter(c=>c.albumIds.includes(a.id)).map(c=>c.id)};after={album:a,cards:status==="deleted"?[]:[...ids]};action=!prev?"Création d’album":status==="deleted"?"Album déplacé en corbeille":"Modification d’album";entity=a.name;
  }else if(input.action==="cards.import"){
    administrator(admin);if(!Array.isArray(input.cards)||!input.cards.length||input.cards.length>100)throw new HttpError(400,"Import limité à 100 nouvelles cartes par lot.");
    const codes=new Set(state.cards.map(c=>c.code));for(const raw of input.cards){const c=validateCard({...raw,id:undefined,imageKey:raw.imageKey||"",status:"draft",imageCredit:raw.imageCredit||"",imageSource:raw.imageSource||"",albumIds:raw.albumIds||[]},undefined,admin,state.albums);if(codes.has(c.code))throw new HttpError(409,`Numéro déjà utilisé : ${c.code}. Aucun élément n’a été importé.`);if(c.imageKey&&!(await imageAvailable(c.imageKey)))throw new HttpError(400,`Illustration absente pour ${c.code}. Aucun élément n’a été importé.`);codes.add(c.code);changedCards.push(c);}after=changedCards;action="Import de cartes";entity=`${changedCards.length} nouvelles cartes`;
  }else if(input.action==="rarities.update"){
    const mode=choice(input.mode,["propose","validate","discard"] as const);if(mode!=="propose")administrator(admin);
    if(!Array.isArray(input.changes)||!input.changes.length||input.changes.length>200)throw new HttpError(400,"Sélectionnez de 1 à 200 cartes par enregistrement.");
    const seen=new Set<string>();const t=now();const oldCards:Card[]=[];
    for(const change of input.changes){
      if(!change||typeof change.id!=="string"||seen.has(change.id))throw new HttpError(400,"La sélection contient un doublon ou un identifiant invalide.");seen.add(change.id);
      const old=state.cards.find(c=>c.id===change.id&&c.status!=="deleted");if(!old)throw new HttpError(404,"Une carte sélectionnée n’existe plus.");
      const c={...old,updatedAt:t};
      if(mode==="validate"){const value=choice(change.rarity||old.rarityProposal||old.rarity,RARITIES);Object.assign(c,{rarity:value,rarityStatus:"validated",rarityProposal:null,rarityProposedBy:null,rarityProposedAt:null,rarityValidatedBy:admin.userId,rarityValidatedAt:t});}
      else if(mode==="propose"){const value=choice(change.rarity,RARITIES);Object.assign(c,{rarityProposal:value,rarityProposedBy:admin.userId,rarityProposedAt:t});}
      else {if(!old.rarityProposal)continue;Object.assign(c,{rarityProposal:null,rarityProposedBy:null,rarityProposedAt:null});}
      oldCards.push(old);changedCards.push(c);
    }
    if(!changedCards.length)throw new HttpError(400,"Aucune proposition à retirer dans cette sélection.");
    before=oldCards;after=changedCards;action=mode==="validate"?"Raretés · validation":mode==="propose"?"Raretés · proposition":"Raretés · rejet de proposition";entity=`${changedCards.length} carte${changedCards.length>1?"s":""}`;
  }else if(input.action==="rarities.restore"){
    administrator(admin);const id=txt(input.logId,150,true);const entry=await db().prepare("SELECT action,before_json FROM audit WHERE id=?").bind(id).first<{action:string;before_json:string}>();
    if(!entry?.action.startsWith("Raretés ·"))throw new HttpError(400,"Cette entrée ne contient pas une modification de rareté restaurable.");
    const snapshots=JSON.parse(entry.before_json);if(!Array.isArray(snapshots)||!snapshots.length||snapshots.length>200)throw new HttpError(400,"Historique de rareté invalide.");
    const oldCards:Card[]=[];
    for(const snapshot of snapshots){const old=state.cards.find(c=>c.id===snapshot.id);if(!old)throw new HttpError(409,"Une carte de cet historique n’existe plus ; aucune restauration effectuée.");
      const safeValue=snapshot.rarity===null?null:choice(snapshot.rarity,RARITIES);const safeProposal=snapshot.rarityProposal?choice(snapshot.rarityProposal,RARITIES):null;const safeStatus=choice(snapshot.rarityStatus,["pending","validated"] as const);
      const restored={...old,rarity:safeValue,rarityStatus:safeStatus,rarityProposal:safeProposal,rarityProposedBy:snapshot.rarityProposedBy||null,rarityProposedAt:snapshot.rarityProposedAt||null,rarityValidatedBy:snapshot.rarityValidatedBy||null,rarityValidatedAt:snapshot.rarityValidatedAt||null,updatedAt:now()};oldCards.push(old);changedCards.push(restored);
    }
    before=oldCards;after=changedCards;action="Raretés · restauration";entity=`${changedCards.length} cartes · historique restauré`;
  }else if(input.action==="preferences.save"){
    const motion=choice(input.motion,["system","reduced","off"] as const);before={motion:state.motion};after={motion};settingChanges.push({id:`motion:${admin.userId}`,data:JSON.stringify(motion)});action="Préférence d’animation";entity=admin.name;
  }else if(input.action==="editor.save"){
    administrator(admin);const email=txt(input.email,254,true).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new HttpError(400,"Adresse e-mail invalide.");if(email===state.admins.find(a=>a.slot==="owner")?.email.toLowerCase())throw new HttpError(400,"Les deux comptes administrateurs doivent être différents.");
    const old=state.admins.find(a=>a.slot==="editor");staff={slot:"editor",email,name:txt(input.name||"Administrateur",100,true),userId:old?.email===email?old.userId:null,updatedAt:now()};before=old;after=staff;action="Autorisation administrateur enregistrée";entity=staff.name;
  }else if(input.action==="editor.remove"){
    administrator(admin);removeEditor=true;before=state.admins.find(a=>a.slot==="editor");action="Autorisation administrateur retirée";entity="Second administrateur";
  }else throw new HttpError(400,"Action inconnue.");
  await commitCatalog({revision:state.revision,actor:admin,cards:changedCards,albums:changedAlbums,settings:settingChanges,staff,removeEditor,before,after,action,entity});
  return stateFor(admin);
}
export async function commitCatalog(input:{onceKey?:string;revision:number;actor:{userId:string;name:string};cards?:Card[];albums?:Album[];settings?:{id:string;data:string}[];staff?:Admin;removeEditor?:boolean;before:unknown;after:unknown;action:string;entity:string}){
  const token=crypto.randomUUID();const gate="(SELECT last_mutation FROM catalog_meta WHERE id='catalog')=?";
  const statements=[db().prepare("UPDATE catalog_meta SET revision=revision+1,last_mutation=? WHERE id='catalog' AND revision=? AND (? IS NULL OR NOT EXISTS (SELECT id FROM settings WHERE id=?))").bind(token,input.revision,input.onceKey||null,input.onceKey||null)];
  for(const c of input.cards||[])statements.push(db().prepare(`INSERT INTO cards(id,code,data) SELECT ?,?,? WHERE ${gate} ON CONFLICT(id) DO UPDATE SET code=excluded.code,data=excluded.data`).bind(c.id,c.code,JSON.stringify(c),token));
  for(const a of input.albums||[])statements.push(db().prepare(`INSERT INTO albums(id,data) SELECT ?,? WHERE ${gate} ON CONFLICT(id) DO UPDATE SET data=excluded.data`).bind(a.id,JSON.stringify(a),token));
  for(const setting of input.settings||[])statements.push(db().prepare(`INSERT INTO settings(id,data) SELECT ?,? WHERE ${gate} ON CONFLICT(id) DO UPDATE SET data=excluded.data`).bind(setting.id,setting.data,token));
  const staff=input.staff;
  if(staff)statements.push(db().prepare(`INSERT INTO admins(slot,email,user_id,name,updated_at) SELECT 'editor',?,?,?,? WHERE ${gate} ON CONFLICT(slot) DO UPDATE SET email=excluded.email,user_id=excluded.user_id,name=excluded.name,updated_at=excluded.updated_at`).bind(staff.email,staff.userId,staff.name,staff.updatedAt,token));
  if(input.removeEditor)statements.push(db().prepare(`DELETE FROM admins WHERE slot='editor' AND ${gate}`).bind(token));
  statements.push(db().prepare(`INSERT INTO audit(id,at,actor_id,actor_name,action,entity,before_json,after_json,revision) SELECT ?,?,?,?,?,?,?,?,? WHERE ${gate}`).bind(crypto.randomUUID(),now(),input.actor.userId,input.actor.name,input.action,input.entity,JSON.stringify(input.before??null),JSON.stringify(input.after??null),input.revision+1,token));
  const result=await db().batch(statements);if(!result[0].meta.changes)throw new HttpError(409,"Une autre modification vient d’être enregistrée. Rechargez les données puis réessayez.");
}

export function protectWrite(request:Request){const origin=request.headers.get("origin");const site=request.headers.get("sec-fetch-site");if(site==="cross-site"||(origin&&new URL(origin).host!==new URL(request.url).host))throw new HttpError(403,"Origine de la requête refusée.");}
export function errorResponse(error:unknown){if(error instanceof HttpError)return Response.json({error:error.message},{status:error.status,headers:{"Cache-Control":"no-store"}});console.error("ATLAS request failed",error instanceof Error?error.message:"Unknown error");return Response.json({error:"L’enregistrement a échoué. Vos champs sont conservés ; réessayez."},{status:500,headers:{"Cache-Control":"no-store"}});}
