'use client';
import {useEffect,useState} from 'react';
import {HALLOWEEN_STARTS_AT,HALLOWEEN_ENDS_AT,isHalloweenActive,OCT31_STARTS_AT,OCT31_ENDS_AT} from './config/event';
/** Switches an already-open page at the event boundary, including after sleep. */
export function useHalloweenEvent(){
 const [active,setActive]=useState(()=>Date.now());
 useEffect(()=>{let timer:ReturnType<typeof setTimeout>;const sync=()=>{clearTimeout(timer);const now=Date.now();setActive(now);const next=[HALLOWEEN_STARTS_AT,OCT31_STARTS_AT,OCT31_ENDS_AT,HALLOWEEN_ENDS_AT].filter(t=>t>now).sort((a,b)=>a-b)[0]??null;if(next!==null)timer=setTimeout(sync,Math.min(2147483647,Math.max(1,next-now)));};sync();document.addEventListener('visibilitychange',sync);window.addEventListener('focus',sync);return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',sync);window.removeEventListener('focus',sync);};},[]);
 return isHalloweenActive(active);
}
