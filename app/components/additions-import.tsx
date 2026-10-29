'use client';
import {useState,useRef} from 'react';
import manifest from '../content/additions-import.json';
import {type Card} from '../model';
export default function AdditionsImport({cards,onComplete}:{cards:Card[];onComplete:()=>Promise<unknown>}){
 const [running,setRunning]=useState(false),[progress,setProgress]=useState(''),[errors,setErrors]=useState<string[]>([]);const stop=useRef(false);const repairCodes:number[]=[];
 const count=cards.filter(c=>manifest.some(m=>m.code===c.code)&&c.status!=='deleted').length;
 async function run(){
  stop.current=false;setRunning(true);setErrors([]);let complete=0;const failures:string[]=[];
  try{for(let index=1;index<=32&&!stop.current;index++){
   const exists=cards.some(c=>c.code===manifest[index-1].code&&c.status!=='deleted');if(exists&&!repairCodes.includes(index)){complete++;continue;}
   setProgress(`Ajout de ${manifest[index-1].name} · ${complete}/32`);
   let ok=false;for(let attempt=0;attempt<4&&!stop.current;attempt++){
    try{const r=await fetch('/api/additions-import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({index,repairImages:exists&&repairCodes.includes(index)})});const d:any=await r.json();if(!r.ok){if((String(d.error).includes('429')||r.status===503)&&attempt<3){setProgress(`La source demande une pause · reprise de FIC-${String(index).padStart(3,'0')}`);await new Promise(resolve=>setTimeout(resolve,20000*(attempt+1)));continue;}throw Error(d.error||'Import impossible.');}ok=true;break;}catch(e){failures.push(`FIC-${String(index).padStart(3,'0')} : ${e instanceof Error?e.message:String(e)}`);setErrors([...failures]);break;}
   }
   if(ok)complete++;await new Promise(resolve=>setTimeout(resolve,500));
  }}finally{setProgress(stop.current?'Import interrompu ; les cartes enregistrées sont conservées.':`${complete}/32 cartes vérifiées et enregistrées. Les raretés restent à valider.`);setRunning(false);await onComplete();}
 }
 if(count>=32&&!running&&!progress)return null;
 return <div className="panel" style={{marginBottom:20,padding:20}}><strong>30 équipes NBA + 2 cartes Chrétienté</strong><p>Les 30 franchises NBA avec leurs logos, Dieu, Le Père et Le Saint-Esprit. Raretés proposées à valider.</p>{progress&&<p role="status">{progress}</p>}{running?<button className="button secondary" onClick={()=>{stop.current=true;}}>Arrêter après la carte en cours</button>:<button className="button secondary" onClick={run}>{count?'Reprendre les 32 ajouts':'Importer les 32 cartes'}</button>}{errors.length>0&&<details open><summary>{errors.length} illustrations à reprendre</summary><ul>{errors.map(e=><li key={e}>{e}</li>)}</ul></details>}</div>;
}
