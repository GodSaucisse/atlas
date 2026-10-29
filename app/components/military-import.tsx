'use client';
import {useState,useRef} from 'react';
import {type Card} from '../model';
export default function MilitaryImport({cards,onComplete}:{cards:Card[];onComplete:()=>Promise<unknown>}){
 const [running,setRunning]=useState(false),[progress,setProgress]=useState(''),[errors,setErrors]=useState<string[]>([]);const stop=useRef(false);const repairCodes=[1, 8, 11, 12, 16, 17, 21, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 53, 68, 70, 71, 74, 75, 78, 79, 83, 84, 91, 96];
 const count=cards.filter(c=>c.universe==='Militaire'&&c.status!=='deleted').length;
 async function run(){
  stop.current=false;setRunning(true);setErrors([]);let complete=0;const failures:string[]=[];
  try{for(let index=1;index<=100&&!stop.current;index++){
   const exists=cards.some(c=>c.code===`MIL-${String(index).padStart(3,'0')}`&&c.universe==='Militaire'&&c.status!=='deleted');if(exists&&!repairCodes.includes(index)){complete++;continue;}
   setProgress(`Vérification et illustration de MIL-${String(index).padStart(3,'0')} · ${complete}/100`);
   let ok=false;for(let attempt=0;attempt<4&&!stop.current;attempt++){
    try{const r=await fetch('/api/military-import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({index,repairImages:exists&&repairCodes.includes(index)})});const d:any=await r.json();if(!r.ok){if((String(d.error).includes('429')||r.status===503)&&attempt<3){setProgress(`La source demande une pause (${String(d.error)}) · reprise de MIL-${String(index).padStart(3,'0')}`);await new Promise(resolve=>setTimeout(resolve,20000*(attempt+1)));continue;}throw Error(d.error||'Import impossible.');}ok=true;break;}catch(e){failures.push(`MIL-${String(index).padStart(3,'0')} : ${e instanceof Error?e.message:String(e)}`);setErrors([...failures]);break;}
   }
   if(ok)complete++;await new Promise(resolve=>setTimeout(resolve,exists?500:5000));
  }}finally{setProgress(stop.current?'Import interrompu ; les cartes enregistrées sont conservées.':`${complete}/100 cartes vérifiées et enregistrées. Les raretés restent à valider.`);setRunning(false);await onComplete();}
 }
 if(count>=100&&!running&&!progress)return null;
 return <div className="panel" style={{marginBottom:20,padding:20}}><strong>Catalogue Militaire · 100 cartes</strong><p>25 unités, 25 armes à feu, 20 véhicules motorisés, 15 chars et 15 systèmes sol-air. Aucune personnalité ni événement historique. Illustrations créditées ; brouillons et raretés proposées.</p>{progress&&<p role="status">{progress}</p>}{running?<button className="button secondary" onClick={()=>{stop.current=true;}}>Arrêter après la carte en cours</button>:<button className="button secondary" onClick={run}>{count?'Reprendre les cartes Militaire restantes':'Importer les 100 cartes Militaire'}</button>}{errors.length>0&&<details open><summary>{errors.length} illustrations à reprendre</summary><ul>{errors.map(e=><li key={e}>{e}</li>)}</ul></details>}</div>;
}
