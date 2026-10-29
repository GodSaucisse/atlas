'use client';
import {useState,useRef} from 'react';
import {type Card} from '../model';
export default function GeopoliticsImport({cards,onComplete}:{cards:Card[];onComplete:()=>Promise<unknown>}){
 const [running,setRunning]=useState(false),[progress,setProgress]=useState(''),[errors,setErrors]=useState<string[]>([]);const stop=useRef(false);
 const count=cards.filter(c=>c.universe==='Géopolitique'&&c.status!=='deleted').length;
 async function run(){
  stop.current=false;setRunning(true);setErrors([]);let complete=0;const failures:string[]=[];
  try{for(let index=1;index<=100&&!stop.current;index++){
   if(cards.some(c=>c.code===`GEP-${String(index).padStart(3,'0')}`&&c.universe==='Géopolitique'&&c.status!=='deleted')){complete++;continue;}
   setProgress(`Vérification et illustration de GEP-${String(index).padStart(3,'0')} · ${complete}/100`);
   let ok=false;for(let attempt=0;attempt<4&&!stop.current;attempt++){
    try{const r=await fetch('/api/geopolitics-import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({index})});const d:any=await r.json();if(!r.ok){if((String(d.error).includes('429')||r.status===503)&&attempt<3){setProgress(`La source demande une pause · reprise de GEP-${String(index).padStart(3,'0')}`);await new Promise(resolve=>setTimeout(resolve,20000*(attempt+1)));continue;}throw Error(d.error||'Import impossible.');}ok=true;break;}catch(e){failures.push(`GEP-${String(index).padStart(3,'0')} : ${e instanceof Error?e.message:String(e)}`);setErrors([...failures]);break;}
   }
   if(ok)complete++;await new Promise(resolve=>setTimeout(resolve,1200));
  }}finally{setProgress(stop.current?'Import interrompu ; les cartes enregistrées sont conservées.':`${complete}/100 cartes vérifiées et enregistrées. Les raretés restent à valider.`);setRunning(false);await onComplete();}
 }
 if(count>=100&&!running&&!progress)return null;
 return <div className="panel" style={{marginBottom:20,padding:20}}><strong>Catalogue Géopolitique · 100 cartes</strong><p>États, organisations, alliances, traités, territoires, renseignement, ressources et crises. Illustrations créditées ; brouillons et raretés proposées.</p>{progress&&<p role="status">{progress}</p>}{running?<button className="button secondary" onClick={()=>{stop.current=true;}}>Arrêter après la carte en cours</button>:<button className="button secondary" onClick={run}>{count?'Reprendre les cartes Géopolitique restantes':'Importer les 100 cartes Géopolitique'}</button>}{errors.length>0&&<details open><summary>{errors.length} illustrations à reprendre</summary><ul>{errors.map(e=><li key={e}>{e}</li>)}</ul></details>}</div>;
}
