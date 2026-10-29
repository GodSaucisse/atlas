'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {X} from 'lucide-react';
export default function SocialDialog({title,onClose,children,wide=false,conversation=false}:{title:string;onClose:()=>void;children:ReactNode;wide?:boolean;conversation?:boolean}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const element=ref.current,before=document.body.style.overflow;document.body.style.overflow='hidden';element?.showModal();return()=>{if(element?.open)element.close();document.body.style.overflow=before;};},[]);
 function close(){ref.current?.close();onClose();}
 if(typeof document==='undefined')return null;
 return createPortal(<dialog ref={ref} className="social-dialog" aria-label={title} onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}}><section className={`social-modal ${wide?'social-modal-wide':''} ${conversation?'social-modal-conversation':''}`}><header><h2>{title}</h2><button autoFocus type="button" aria-label="Fermer" onClick={close}><X/></button></header><div className="social-modal-body">{children}</div></section></dialog>,document.body);
}
