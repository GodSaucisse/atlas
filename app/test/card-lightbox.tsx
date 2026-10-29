'use client';
import {useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import CardVisual from '../components/card-visual';
import type {Card} from '../model';
import './card-viewing.css';

/** A card-only top-layer dialog; closing it preserves the opening underneath. */
export default function CardLightbox({card,onClose}:{card:Card;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  const element=dialog.current;
  element?.showModal();
  return()=>{if(element?.open)element.close();};
 },[]);
 function close(){dialog.current?.close();onClose();}
 if(typeof document==='undefined')return null;
 return createPortal(<dialog ref={dialog} className="card-lightbox" aria-label={`Agrandissement de ${card.name}`} onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===event.currentTarget)close();}}>
  <button autoFocus type="button" className="card-lightbox-close" aria-label="Fermer l’agrandissement" onClick={close}>✕</button>
  <div className="card-lightbox-stage"><CardVisual card={card} effects="interactive"/></div>
 </dialog>,document.body);
}
