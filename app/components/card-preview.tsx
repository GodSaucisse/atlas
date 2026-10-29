"use client";
import {useState} from 'react';
import {type Card} from '../model';
import CardVisual from './card-visual';
import {type CardSide} from './card-layout';
export default function CardPreview({card}:{card:Card}){
 const [side,setSide]=useState<CardSide>('front');
 return <div className="card-preview"><div className="card-side-controls" role="group" aria-label="Face de la carte"><button type="button" aria-pressed={side==='front'} onClick={()=>setSide('front')}>Recto</button><button type="button" aria-pressed={side==='back'} onClick={()=>setSide('back')}>Verso</button></div><CardVisual card={card} side={side} reveal={side==='front'}/></div>;
}
