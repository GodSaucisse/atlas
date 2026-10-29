'use client';
import {useEffect,useState} from 'react';
import {HALLOWEEN_STARTS_AT,HALLOWEEN_ENDS_AT,isHalloweenActive} from './config/event';
/** Switches an already-open page at the event boundary, including after sleep. */
export function useHalloweenEvent(){
 const [active,setActive]=useState(()=>isHalloweenActive());
 useEffect(()=>{let timer:ReturnType<typeof setTimeout>;const sync=()=>{clearTimeout(timer);const now=Date.now();setActive(isHalloweenActive(now));const next=now<HALLOWEEN_STARTS_AT?HALLOWEEN_STARTS_AT:now<HALLOWEEN_ENDS_AT?HALLOWEEN_ENDS_AT:null;if(next!==null)timer=setTimeout(sync,Math.min(2147483647,Math.max(1,next-now)));};sync();document.addEventListener('visibilitychange',sync);window.addEventListener('focus',sync);return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',sync);window.removeEventListener('focus',sync);};},[]);
 return active;
}
