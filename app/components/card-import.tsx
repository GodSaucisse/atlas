"use client";
import {useRef,useState} from 'react';
import {Upload,Download,Check,Search,LoaderCircle,AlertCircle,Image as ImageIcon} from 'lucide-react';
import {parseCardImport,decodeIllustration,MAX_IMPORT_BYTES,type ImportCard} from '../import-format';
import {type AtlasState} from '../model';
export default function CardImport({state,onSave,onClose,onComplete,onDirty,onWorking}:{state:AtlasState;onSave:(payload:any,message:string,revision:number)=>Promise<boolean>;onClose:()=>void;onComplete:()=>void;onDirty:()=>void;onWorking:(working:boolean)=>void}){
 const [text,setText]=useState(''),[rows,setRows]=useState<ImportCard[]|null>(null),[fileName,setFileName]=useState(''),[error,setError]=useState(''),[working,setWorking]=useState(false),[progress,setProgress]=useState('');
 const revision=useRef(state.revision),uploaded=useRef(new Map<string,string>());
 function check(value:string){const parsed=parseCardImport(value,state.cards,state.albums);setRows(parsed);revision.current=state.revision;setError('');}
 async function importCards(){if(!rows)return;setWorking(true);onWorking(true);setError('');try{
  parseCardImport(JSON.stringify({cards:rows}),state.cards,state.albums);revision.current=state.revision;
  const payload=[];
  for(let i=0;i<rows.length;i++){
   const {illustration,...metadata}=rows[i];let imageKey='';
   if(illustration){imageKey=uploaded.current.get(metadata.code)||'';
    if(!imageKey){setProgress(`Enregistrement des illustrations · ${i+1} / ${rows.length}`);const bytes=decodeIllustration(illustration);if(illustration.sha256){const digest=await crypto.subtle.digest('SHA-256',new Uint8Array(bytes).buffer);const hex=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');if(hex!==illustration.sha256)throw Error(`Illustration altérée : ${metadata.code}.`);}
     const form=new FormData();form.set('image',new File([new Uint8Array(bytes).buffer],`${metadata.code}.${illustration.mimeType==='image/jpeg'?'jpg':illustration.mimeType.split('/')[1]}`,{type:illustration.mimeType}));
     const response=await fetch('/api/media',{method:'POST',body:form});const result:any=await response.json();if(!response.ok)throw Error(result.error||`Illustration non enregistrée : ${metadata.code}.`);imageKey=result.key;uploaded.current.set(metadata.code,imageKey);
    }
   }
   payload.push({...metadata,imageKey});
  }
  setProgress('Enregistrement du lot dans le catalogue…');if(await onSave({action:'cards.import',cards:payload},`${rows.length} cartes importées avec leurs illustrations`,revision.current))onComplete();
 }catch(e){setError(e instanceof Error?e.message:'L’import n’a pas abouti. Aucune fiche du lot n’a été ajoutée.');}finally{setWorking(false);onWorking(false);setProgress('');}}
 return <><div className="modal-body"><div className="notice"><ImageIcon size={17}/><div>Jusqu’à 100 nouvelles cartes par lot, avec illustrations intégrées. Les cartes existantes restent conservées et les raretés importées restent à valider.</div></div>
 <label className="upload-zone"><input type="file" accept=".json,application/json" disabled={working} onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>MAX_IMPORT_BYTES)throw Error('Fichier limité à 40 Mo.');onDirty();setRows(null);uploaded.current.clear();setFileName(file.name);const value=await file.text();setText('');check(value);}catch(e){setError(e instanceof Error?e.message:'Fichier illisible.');}}}/><Upload size={23}/><strong>{fileName||'Choisir un fichier JSON'}</strong><small>40 Mo maximum · photographies intégrées acceptées</small></label>
 <button type="button" className="text-button" disabled={working} onClick={()=>{const example=[{code:'AVI-101',name:'Nom de la carte',universe:'Aviation',category:'Avion',description:'Description courte à compléter',rarity:null,albumIds:['aviation']}];const url=URL.createObjectURL(new Blob([JSON.stringify(example,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='atlas-modele-import.json';a.click();URL.revokeObjectURL(url);}}><Download size={15}/>Télécharger le modèle</button>
 {!rows&&<label className="field"><span>Ou coller un lot JSON</span><textarea className="json-input" rows={7} disabled={working} value={text} placeholder='{"cards":[{"code":"AVI-101","name":"Nom","universe":"Aviation","category":"Avion","description":"Description","rarity":null,"albumIds":["aviation"]}]}' onChange={e=>{setText(e.target.value);setRows(null);uploaded.current.clear();onDirty();}}/></label>}
 {rows&&<div className="import-review"><h3>{rows.length} cartes · {rows.filter(c=>c.illustration).length} illustrations intégrées · raretés à valider</h3>{rows.map(c=><div key={c.code}><code>{c.code}</code><strong>{c.name}</strong><span>{c.illustration?<ImageIcon size={14}/>:null}</span></div>)}</div>}
 {working&&<p role="status" className="notice"><LoaderCircle size={17} className="spin"/>{progress}</p>}
 {error&&<div className="form-error" role="alert"><AlertCircle size={18}/><div>{error}</div></div>}
 <p className="field-help">La vérification ne crée aucune carte. L’enregistrement du catalogue se fait en un seul lot après le transfert des illustrations.</p></div>
 <div className="modal-footer"><button className="button secondary" disabled={working} onClick={onClose}>Annuler</button>{rows?<button className="button primary" disabled={working} onClick={importCards}>{working?<LoaderCircle size={16} className="spin"/>:<Check size={16}/>}Importer {rows.length} cartes</button>:<button className="button primary" disabled={working||!text.trim()} onClick={()=>{try{check(text);}catch(e){setError(e instanceof Error?e.message:'JSON invalide.');}}}><Search size={16}/>Vérifier le lot</button>}</div></>;
}
