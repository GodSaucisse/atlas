'use client';
import {useState,useRef} from 'react';
import {type Card} from '../model';
export default function NbaImport({cards,onComplete}:{cards:Card[];onComplete:()=>Promise<unknown>}){
 const [running,setRunning]=useState(false),[progress,setProgress]=useState(''),[errors,setErrors]=useState<string[]>([]);const stop=useRef(false);const repairCodes=[1, 2, 3, 5, 6, 10, 15, 17, 51, 53, 56, 57, 59, 60, 61, 65, 71, 72, 74, 76, 80, 89, 96];
 const count=cards.filter(c=>c.universe==='NBA'&&c.status!=='deleted').length;
 async function run(){
  stop.current=false;setRunning(true);setErrors([]);let complete=0;const failures:string[]=[];
  try{for(let index=1;index<=100&&!stop.current;index++){
   const exists=cards.some(c=>c.code===`NBA-${String(index).padStart(3,'0')}`&&c.universe==='NBA'&&c.status!=='deleted');if(exists&&!repairCodes.includes(index)){complete++;continue;}
   setProgress(`Vérification et illustration de NBA-${String(index).padStart(3,'0')} · ${complete}/100`);
   let ok=false;for(let attempt=0;attempt<4&&!stop.current;attempt++){
    try{const r=await fetch('/api/nba-import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({index,repairImages:exists&&repairCodes.includes(index)})});const d:any=await r.json();if(!r.ok){if((String(d.error).includes('429')||r.status===503)&&attempt<3){setProgress(`La source demande une pause · reprise de NBA-${String(index).padStart(3,'0')}`);await new Promise(resolve=>setTimeout(resolve,20000*(attempt+1)));continue;}throw Error(d.error||'Import impossible.');}ok=true;break;}catch(e){failures.push(`NBA-${String(index).padStart(3,'0')} : ${e instanceof Error?e.message:String(e)}`);setErrors([...failures]);break;}
   }
   if(ok)complete++;await new Promise(resolve=>setTimeout(resolve,exists?500:3000));
  }}finally{setProgress(stop.current?'Import interrompu ; les cartes enregistrées sont conservées.':`${complete}/100 cartes vérifiées et enregistrées. Les raretés restent à valider.`);setRunning(false);await onComplete();}
 }
 if(count>=100&&!running&&!progress)return null;
 return <div className="panel" style={{marginBottom:20,padding:20}}><strong>Catalogue NBA · 100 cartes</strong><p>50 joueurs NBA actuels et 50 anciens joueurs NBA, y compris les joueurs encore actifs dans d’autres ligues. Sélection datée du 26 octobre 2026. Illustrations créditées ; brouillons et raretés proposées.</p>{progress&&<p role="status">{progress}</p>}{running?<button className="button secondary" onClick={()=>{stop.current=true;}}>Arrêter après la carte en cours</button>:<button className="button secondary" onClick={run}>{count?'Reprendre les cartes NBA restantes':'Importer les 100 cartes NBA'}</button>}{errors.length>0&&<details open><summary>{errors.length} illustrations à reprendre</summary><ul>{errors.map(e=><li key={e}>{e}</li>)}</ul></details>}</div>;
}
