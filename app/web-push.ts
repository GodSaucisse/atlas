// RFC 8291 aes128gcm payload encryption and RFC 8292 VAPID; Web Crypto only.
const bytes=(s:string)=>new TextEncoder().encode(s);
export const b64=(v:Uint8Array)=>btoa(String.fromCharCode(...v)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export const unb64=(v:string)=>Uint8Array.from(atob(v.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-v.length%4)%4)),c=>c.charCodeAt(0));
const cat=(...parts:Uint8Array[])=>{const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let i=0;for(const p of parts){out.set(p,i);i+=p.length}return out};
const buf=(v:Uint8Array)=>v.slice().buffer as ArrayBuffer;
export type PushSubscriptionData={endpoint:string;keys:{auth:string;p256dh:string}};
export function validPushSubscription(input:unknown):PushSubscriptionData{
 const s=input as PushSubscriptionData;const url=new URL(s?.endpoint||'');
 if(url.protocol!=='https:'||url.port||url.username||url.password||!(/^(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)$/.test(url.hostname)))throw Error('Service de notifications non pris en charge.');
 if(typeof s.keys?.auth!=='string'||typeof s.keys?.p256dh!=='string'||unb64(s.keys.auth).length!==16||unb64(s.keys.p256dh).length!==65)throw Error('Abonnement de notifications invalide.');return {endpoint:url.href,keys:{auth:s.keys.auth,p256dh:s.keys.p256dh}};
}
export async function pushRequest(subscription:PushSubscriptionData,payload:unknown,privateJwk:JsonWebKey,publicKey:string,subject:string){
 const client=unb64(subscription.keys.p256dh),auth=unb64(subscription.keys.auth);
 const ephemeral=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);const server=new Uint8Array(await crypto.subtle.exportKey('raw',ephemeral.publicKey));
 const peer=await crypto.subtle.importKey('raw',buf(client),{name:'ECDH',namedCurve:'P-256'},false,[]);const shared=await crypto.subtle.deriveBits({name:'ECDH',public:peer},ephemeral.privateKey,256);
 async function hkdf(ikm:ArrayBuffer,salt:Uint8Array,info:Uint8Array,length:number){const k=await crypto.subtle.importKey('raw',ikm,'HKDF',false,['deriveBits']);return crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt:buf(salt),info:buf(info)},k,length*8)}
 const ikm=await hkdf(shared,auth,cat(bytes('WebPush: info\0'),client,server),32);const salt=crypto.getRandomValues(new Uint8Array(16));
 const [cek,nonce]=await Promise.all([hkdf(ikm,salt,bytes('Content-Encoding: aes128gcm\0'),16),hkdf(ikm,salt,bytes('Content-Encoding: nonce\0'),12)]);
 const aes=await crypto.subtle.importKey('raw',cek,'AES-GCM',false,['encrypt']);const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},aes,buf(cat(bytes(JSON.stringify(payload)),new Uint8Array([2])))));
 const header=new Uint8Array(21);header.set(salt);new DataView(header.buffer).setUint32(16,4096);header[20]=server.length;
 const signing=await crypto.subtle.importKey('jwk',privateJwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);const jwt=b64(bytes(JSON.stringify({typ:'JWT',alg:'ES256'})))+'.'+b64(bytes(JSON.stringify({aud:new URL(subscription.endpoint).origin,exp:Math.floor(Date.now()/1000)+43200,sub:subject})));
 const signature=new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},signing,buf(bytes(jwt))));
 return {headers:{Authorization:`vapid t=${jwt}.${b64(signature)}, k=${publicKey}`,'Content-Encoding':'aes128gcm','Content-Type':'application/octet-stream',TTL:'86400',Urgency:'normal'},body:buf(cat(header,server,cipher))};
}
