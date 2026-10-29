import type {PublicProfile} from './player-profile';
import type {Card} from './model';
import type {TestGame} from './test-game-engine';
export const SALE_DURATIONS=[10,30,45,60,180,360] as const;
export const RECYCLE:Record<string,number>={Courante:1,Inhabituelle:5,Rare:10,Précieuse:25,Légendaire:50,Suprême:100,'Editions spéciales':100};
export type Listing={id:string;seller:string;card:Card;price:number;kind:'sale'|'auction';end:number;bidder?:string;buyer?:string;watchers?:string[];reminded?:boolean;remindedUsers?:string[];status:'open'|'sold'|'cancelled';};
export type Offer={id:string;from:string;to:string;card:Card;cards?:Card[];wanted?:string;wantedIds?:string[];end:number;status:'open'|'accepted'|'declined'};
export type SiteNotice={id:string;user:string;text:string;at:number;read?:boolean;deleted?:boolean;messageId?:string;conversationFrom?:string};
export type DirectMessage={id:string;from:string;to:string;text:string;at:number;readAt?:number};
export type Hub={revision?:number;messages?:DirectMessage[];favorites?:Record<string,string[]>;notifications?:SiteNotice[];token:string;listings:Listing[];offers:Offer[];friends:{from:string;to:string;status:'pending'|'accepted'}[];requests:string[]};
export type Player={id:string;name:string;profile?:PublicProfile;lastSeenAt?:number;collected?:number;progression?:{level:number;xp:number;rank:string;featured:string[];frame:string;title:string}};
export const emptyHub=():Hub=>({token:crypto.randomUUID(),listings:[],offers:[],friends:[],requests:[]});
export function operate(h:Hub,games:Map<string,TestGame>,who:string,input:any,players:Player[],now:number){
 const before=JSON.stringify(h);h.notifications??=[];const name=(id:string)=>players.find(p=>p.id===id)?.name||'Un joueur';const notify=(user:string,text:string,extra:Partial<SiteNotice>={})=>{h.notifications!.push({id:crypto.randomUUID(),user,text,at:now,...extra});};const g=games.get(who)!;if(!g)throw Error('Partie introuvable');
 const get=(id:string)=>{const p=games.get(id);if(!p)throw Error('Partie du destinataire indisponible');return p};
 const take=(p:TestGame,id:string)=>{const i=p.inventory.findIndex(c=>c.id===id);if(i<0)throw Error('Carte indisponible dans la collection');return p.inventory.splice(i,1)[0]};
 const amount=(n:unknown)=>{if(!Number.isSafeInteger(n)||Number(n)<1||Number(n)>1000000000)throw Error('Montant invalide');return Number(n)};
 const debit=(p:TestGame,n:number)=>{if(p.shards<n)throw Error('Éclats insuffisants');p.shards-=n};
 for(const l of h.listings.filter(l=>l.status==='open'&&l.kind==='sale'&&l.end>0&&l.end<=now)){get(l.seller).inventory.push(l.card);l.status='cancelled';notify(l.seller,`La vente directe de ${l.card.name} est terminée ; votre carte est revenue dans votre collection.`)}
 // Close elapsed auctions and expire exchanges on every visit, even after a period offline.
 for(const l of h.listings.filter(l=>l.status==='open'&&l.kind==='auction'&&l.end<=now)){if(l.bidder){get(l.bidder).inventory.push(l.card);get(l.seller).shards+=l.price;l.status='sold';notify(l.seller,`${name(l.bidder)} a remporté ${l.card.name} pour ${l.price} éclats.`);notify(l.bidder,`Vous avez remporté ${l.card.name} pour ${l.price} éclats.`)}else{notify(l.seller,`L’enchère de ${l.card.name} s’est terminée sans offre.`);get(l.seller).inventory.push(l.card);l.status='cancelled'}}
 for(const o of h.offers.filter(o=>o.status==='open'&&o.end<=now)){get(o.from).inventory.push(...(o.cards||[o.card]));o.status='declined';notify(o.from,`Votre proposition pour ${o.card.name} a expiré ; votre carte est revenue dans votre collection.`);notify(o.to,`La proposition de ${name(o.from)} pour ${o.card.name} a expiré.`)}
 for(const l of h.listings.filter(l=>l.status==='open'&&l.kind==='auction'&&l.end-now<=120000&&l.end>now)){for(const user of new Set([l.seller,...(l.watchers||[]),...(l.bidder?[l.bidder]:[])])){l.remindedUsers??=[];if(!l.remindedUsers.includes(user)){notify(user,`Il reste 2 minutes ou moins pour l’enchère ${l.card.name} (${l.price} éclats).`);l.remindedUsers.push(user);}}}
 const action=input.action;
 if(action==='list') {const price=amount(input.price);const kind=input.kind==='auction'?'auction':'sale';const minutes=Number(input.minutes);if(!SALE_DURATIONS.includes(minutes as typeof SALE_DURATIONS[number]))throw Error('Durée invalide');h.listings.push({id:crypto.randomUUID(),seller:who,card:take(g,input.cardId),price,kind,end:now+minutes*60000,status:'open'});}
 else if(action==='buy'||action==='bid'||action==='cancel') {const l=h.listings.find(l=>l.id===input.id&&l.status==='open');if(!l)throw Error('Annonce terminée');if(action==='cancel'){if(l.seller!==who||l.bidder)throw Error('Annulation impossible');g.inventory.push(l.card);l.status='cancelled'}else{if(l.seller===who)throw Error('Vous ne pouvez pas acheter votre propre carte');if(action==='buy'){if(l.kind!=='sale')throw Error('Cette carte est aux enchères');debit(g,l.price);get(l.seller).shards+=l.price;g.inventory.push(l.card);l.buyer=who;l.status='sold';notify(l.seller,`${name(who)} vous a acheté ${l.card.name} pour ${l.price} éclats.`);notify(who,`Vous avez acheté ${l.card.name} à ${name(l.seller)} pour ${l.price} éclats.`)}else{if(l.kind!=='auction'||l.end<=now)throw Error('Enchère terminée');const bid=amount(input.price);if(bid<l.price+(l.bidder?1:0))throw Error('Enchère trop faible');if(l.bidder===who)g.shards+=l.price;debit(g,bid);if(l.bidder&&l.bidder!==who){get(l.bidder).shards+=l.price;notify(l.bidder,`${name(who)} a surenchéri sur ${l.card.name} : ${bid} éclats. Votre mise a été remboursée.`)}notify(l.seller,`${name(who)} a enchéri ${bid} éclats sur ${l.card.name}.`);l.watchers=[...new Set([...(l.watchers||[]),who])];l.price=bid;l.bidder=who;if(l.end-now<=10000&&l.end-now>0)l.end+=30000;}}}
 else if(action==='recycle'){if(input.confirm!==true)throw Error('Confirmez le recyclage');const c=take(g,input.cardId);const reward=RECYCLE[c.rarity||'']||1;g.shards+=reward;notify(who,`${c.name} recyclée : +${reward} éclats.`);}
 else if(action==='offer'){
 if(input.to===who||!h.friends.some(f=>f.status==='accepted'&&((f.from===who&&f.to===input.to)||(f.to===who&&f.from===input.to))))throw Error('Choisissez un ami ajouté.');
 const ids=input.cardIds??[input.cardId],wanted=input.wantedIds??(input.wanted?[input.wanted]:[]);
 if(!Array.isArray(ids)||ids.length<1||ids.length>5||!ids.every(id=>typeof id==='string')||!Array.isArray(wanted)||wanted.length>5||!wanted.every(id=>typeof id==='string'))throw Error('Choisissez de 1 à 5 cartes à proposer et 5 cartes maximum à recevoir.');
 const check=(inventory:Card[],ids:string[])=>{const available=inventory.slice();for(const id of ids){const i=available.findIndex(c=>c.id===id);if(i<0)throw Error('Une carte ou un exemplaire est indisponible.');available.splice(i,1)}};
 check(g.inventory,ids);check(get(input.to).inventory,wanted);
 const cards=ids.map(id=>take(g,id));h.offers.push({id:crypto.randomUUID(),from:who,to:input.to,card:cards[0],cards,wanted:wanted[0],wantedIds:wanted,end:now+48*3600000,status:'open'});
 notify(input.to,`${name(who)} vous propose ${wanted.length?'un échange':'un don'} : ${cards.map(c=>c.name).join(', ')}.`);notify(who,`Proposition envoyée à ${name(input.to)}.`);
 }
 else if(action==='accept'||action==='decline'){
 const o=h.offers.find(o=>o.id===input.id&&o.status==='open');if(!o||o.to!==who)throw Error('Proposition indisponible');
 if(action==='accept'){const wanted=o.wantedIds??(o.wanted?[o.wanted]:[]);const available=g.inventory.slice();for(const id of wanted){const i=available.findIndex(c=>c.id===id);if(i<0)throw Error('Une carte demandée est indisponible.');available.splice(i,1)}const received=wanted.map(id=>take(g,id));get(o.from).inventory.push(...received);g.inventory.push(...(o.cards||[o.card]));o.status='accepted';}
 else{get(o.from).inventory.push(...(o.cards||[o.card]));o.status='declined'}
 notify(o.from,`${name(who)} a ${action==='accept'?'accepté':'refusé'} votre proposition pour ${o.card.name}.`);notify(who,`Proposition ${action==='accept'?'acceptée':'refusée'} : ${o.card.name}.`);
 }
 else if(action==='favorite'){
 const linked=h.friends.some(f=>f.status==='accepted'&&((f.from===who&&f.to===input.to)||(f.to===who&&f.from===input.to)));if(!linked)throw Error('Choisissez un ami confirmé.');h.favorites??={};const current=h.favorites[who]||[];h.favorites[who]=current.includes(input.to)?current.filter(id=>id!==input.to):[...current,input.to];
 }
 else if(action==='message'){
 if(input.to===who||!h.friends.some(f=>f.status==='accepted'&&((f.from===who&&f.to===input.to)||(f.to===who&&f.from===input.to))))throw Error('Vous pouvez écrire uniquement à un ami confirmé.');
 if(typeof input.text!=='string'||!input.text.trim()||input.text.length>2000)throw Error('Le message doit contenir entre 1 et 2 000 caractères.');h.messages??=[];const message={id:crypto.randomUUID(),from:who,to:input.to,text:input.text.trim(),at:now};h.messages.push(message);notify(input.to,`${name(who)} vous a envoyé un message.`,{messageId:message.id,conversationFrom:who});
 }
 else if(action==='readMessages'){
 if(input.ids!==undefined&&(!Array.isArray(input.ids)||input.ids.length>200||!input.ids.every((id:unknown)=>typeof id==='string')))throw Error('Messages invalides.');
 const read=(h.messages||[]).filter(message=>message.to===who&&message.from===input.from&&(input.ids===undefined||input.ids.includes(message.id)));for(const message of read)if(!message.readAt)message.readAt=now;
 const ids=new Set(read.map(m=>m.id)),through=Math.max(0,...read.map(m=>m.at));for(const n of h.notifications!)if(n.user===who&&!n.read&&(n.messageId?ids.has(n.messageId):n.text===`${name(input.from)} vous a envoyé un message.`&&n.at<=through))n.read=true;
 }
 else if(action==='friend'){if(input.to===who||!players.some(p=>p.id===input.to))throw Error('Joueur invalide');if(h.friends.some(f=>(f.from===who&&f.to===input.to)||(f.to===who&&f.from===input.to)))throw Error('Invitation déjà envoyée');h.friends.push({from:who,to:input.to,status:'pending'});notify(input.to,`${name(who)} vous a envoyé une invitation d’ami.`)}
 else if(action==='friendAccept'||action==='friendRemove'){const f=h.friends.find(f=>(f.from===input.to&&f.to===who)||(f.from===who&&f.to===input.to));if(!f)throw Error('Invitation introuvable');if(action==='friendAccept'){if(f.to!==who)throw Error('Invitation non reçue');f.status='accepted';notify(f.from,`${name(who)} a accepté votre invitation d’ami.`)}else h.friends=h.friends.filter(v=>v!==f)}
 else if(action==='readNotifications'){for(const n of h.notifications!)if(n.user===who&&(input.id==='all'||n.id===input.id))n.read=true;}
 else if(action==='deleteReadNotifications'){for(const n of h.notifications!)if(n.user===who&&n.read)n.deleted=true;}
 else if(action!=='refresh')throw Error('Action inconnue');
 if(JSON.stringify(h)!==before)h.token=crypto.randomUUID();
}
