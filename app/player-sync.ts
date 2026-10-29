'use client';
import {useEffect,useRef} from 'react';
type Scope='game'|'hub'|'chat';
type Subscriber={scope:Scope;enabled:()=>boolean;refresh:()=>Promise<unknown>;key?:string;running:boolean};
const subscribers=new Set<Subscriber>();let timer:ReturnType<typeof setTimeout>|undefined,running=false,rerun=false,started=false;
function schedule(delay=2000){if(timer)clearTimeout(timer);if(subscribers.size)timer=setTimeout(()=>void poll(),delay);}
async function poll(){if(running){rerun=true;return;}if(!subscribers.size)return;
 if(document.visibilityState!=='visible'||!navigator.onLine){schedule(15000);return;}running=true;
 try{const response=await fetch('/api/player-sync',{cache:'no-store'});if(!response.ok)throw Error('Synchronisation indisponible');const revision=await response.json() as Record<Scope,string>;await Promise.all([...subscribers].map(async s=>{if(!s.enabled()||s.running||s.key===revision[s.scope])return;s.running=true;try{const accepted=await s.refresh();if(accepted!==false&&subscribers.has(s))s.key=revision[s.scope];}finally{s.running=false;}}));}catch{/* Retry automatically without disrupting a draft or an action. */}finally{running=false;const immediate=rerun;rerun=false;schedule(immediate?0:2000);}}
const resume=()=>{if(document.visibilityState==='visible')void poll();};
export function invalidatePlayerSync(scope?:Scope){for(const s of subscribers)if(!scope||s.scope===scope)s.key=undefined;void poll();}
export function usePlayerSync(scope:Scope,refresh:()=>Promise<unknown>,enabled=true){const current=useRef({refresh,enabled});current.current={refresh,enabled};useEffect(()=>{const subscriber:Subscriber={scope,enabled:()=>current.current.enabled,refresh:()=>current.current.refresh(),running:false};subscribers.add(subscriber);if(!started){started=true;window.addEventListener('focus',resume);window.addEventListener('online',resume);document.addEventListener('visibilitychange',resume);}void poll();return()=>{subscribers.delete(subscriber);if(!subscribers.size){if(timer)clearTimeout(timer);window.removeEventListener('focus',resume);window.removeEventListener('online',resume);document.removeEventListener('visibilitychange',resume);started=false;}};},[scope]);}
