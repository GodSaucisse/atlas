'use client';
import {useEffect,useRef} from 'react';

/** Refresh visible screens and reconnect immediately without overlapping requests. */
export function useAutoRefresh(refresh:()=>Promise<unknown>,enabled=true,interval=10000){
 const current=useRef({refresh,enabled});current.current={refresh,enabled};
 useEffect(()=>{
  let active=true,running=false;
  const sync=async()=>{
   if(!active||running||!current.current.enabled||document.visibilityState!=='visible'||!navigator.onLine)return;
   running=true;try{await current.current.refresh()}finally{running=false}
  };
  const timer=setInterval(()=>void sync(),interval);
  const resume=()=>void sync();
  window.addEventListener('focus',resume);window.addEventListener('online',resume);document.addEventListener('visibilitychange',resume);
  return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',resume);window.removeEventListener('online',resume);document.removeEventListener('visibilitychange',resume)};
 },[interval]);
}
