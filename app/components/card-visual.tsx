'use client';
import CardBackImage from './card-back-image';
import {archiveSupremeDesign} from './archive-supreme-card';
import {isNapoleonSupreme} from './napoleon-card';
import MossadCard,{isMossadSupreme} from './mossad-card';
import LouisCard,{isLouisSupreme} from './louis-card';
import CesarCard,{isCesarSupreme} from './cesar-card';
import FranceCard,{isFranceSupreme} from './france-card';
import CiaCard,{isCiaSupreme} from './cia-card';
import ChineCard,{isChineSupreme} from './chine-card';
import CharlemagneCard,{isCharlemagneSupreme} from './charlemagne-card';
import {isSaintNectaireSupreme} from './nectaire-card';
import {isRoquefortSupreme} from './roquefort-card';
import {isEverestSupreme} from './everest-card';
import {isMarieSupreme} from './marie-card';
import {isReefSupreme} from './reef-card';
import {isComteSupreme} from './comte-card';
import {isCamembertSupreme} from './camembert-card';
import {isSpitfireSupreme} from './spitfire-card';
import {isBlackbirdSupreme} from './blackbird-card';
import {isStukaSupreme} from './stuka-card';
import {useEffect,useRef,type CSSProperties,type PointerEvent} from 'react';
import {displayRarity,type Card} from '../model';
import {RARITY_STYLES,type Rarity} from '../config/rarities';
import {cardLightPosition} from '../config/card-interaction';
import CardFace from './card-face';
import {isRafaleSupreme} from './rafale-card';
import {isConcordeSupreme} from './concorde-card';
import {isB747Supreme} from './b747-card';
import {isA380Supreme} from './a380-card';
import {type CardSide} from './card-layout';
export type CardVisualProps={card:Card;side?:CardSide;small?:boolean;imageHref?:string;effects?:'inherit'|'static'|'animated'|'interactive';reveal?:boolean;label?:string};
export default function CardVisual({card,small=false,imageHref,side='front',effects='inherit',reveal=false,label}:CardVisualProps){
 const ref=useRef<HTMLDivElement>(null),frame=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const custom=!!archiveSupremeDesign(card)||isNapoleonSupreme(card)||isMossadSupreme(card)||isLouisSupreme(card)||isCesarSupreme(card)||isFranceSupreme(card)||isCiaSupreme(card)||isChineSupreme(card)||isCharlemagneSupreme(card)||isSaintNectaireSupreme(card)||isRoquefortSupreme(card)||isEverestSupreme(card)||isMarieSupreme(card)||isReefSupreme(card)||isComteSupreme(card)||isCamembertSupreme(card)||isSpitfireSupreme(card)||isBlackbirdSupreme(card)||isStukaSupreme(card)||isA380Supreme(card)||isB747Supreme(card)||isConcordeSupreme(card)||isRafaleSupreme(card);const rarity=displayRarity(card);const material=RARITY_STYLES[rarity as Rarity]||RARITY_STYLES.Courante;
 const allowed=()=>effects!=='static'&&document.documentElement.dataset.motion!=='off'&&document.documentElement.dataset.motion!=='reduced'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function reset(){cancelAnimationFrame(frame.current);if(timer.current)clearTimeout(timer.current);if(!ref.current)return;for(const p of ['--tilt-x','--tilt-y','--light-x','--light-y','--supreme-pointer-x','--supreme-pointer-y','--supreme-inverse-x','--supreme-inverse-y'])ref.current.style.removeProperty(p);delete ref.current.dataset.interacting;}
 function light(e:PointerEvent<HTMLDivElement>){
  if(!allowed())return;
  const el=e.currentTarget,r=el.getBoundingClientRect(),p=cardLightPosition(e.clientX-r.left,e.clientY-r.top,r.width,r.height);
  cancelAnimationFrame(frame.current);frame.current=requestAnimationFrame(()=>{el.style.setProperty('--tilt-x',`${p.rotateX}deg`);el.style.setProperty('--tilt-y',`${p.rotateY}deg`);el.style.setProperty('--light-x',`${p.lightX}px`);el.style.setProperty('--light-y',`${p.lightY}px`);const x=Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)),y=Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100));el.style.setProperty('--supreme-pointer-x',`${x}%`);el.style.setProperty('--supreme-pointer-y',`${y}%`);el.style.setProperty('--supreme-inverse-x',`${100-x}%`);el.style.setProperty('--supreme-inverse-y',`${100-y}%`);el.dataset.interacting='true';});
 }
 useEffect(()=>()=>{cancelAnimationFrame(frame.current);if(timer.current)clearTimeout(timer.current);},[]);
 if(side==='back')return <div className="universal-card-back"><CardBackImage alt="Verso ATLAS"/></div>;
 return <div ref={ref} className={`atlas-card ${small?'compact':''}`} data-side={side} data-design-model={archiveSupremeDesign(card)?card.code:isNapoleonSupreme(card)?'HIS-001':isMossadSupreme(card)?'GEP-069':isLouisSupreme(card)?'HIS-007':isCesarSupreme(card)?'HIS-002':isFranceSupreme(card)?'GEP-004':isCiaSupreme(card)?'GEP-066':isChineSupreme(card)?'GEP-002':isCharlemagneSupreme(card)?'HIS-006':isSaintNectaireSupreme(card)?'FRO-025':isRoquefortSupreme(card)?'FRO-002':isEverestSupreme(card)?'GEO-001':isMarieSupreme(card)?'CAT-002':isReefSupreme(card)?'GEO-069':isComteSupreme(card)?'FRO-004':isCamembertSupreme(card)?'FRO-003':isSpitfireSupreme(card)?'AVI-039':isBlackbirdSupreme(card)?'AVI-094':isStukaSupreme(card)?'AVI-070':isA380Supreme(card)?'AVI-026':isB747Supreme(card)?'AVI-017':isConcordeSupreme(card)?'AVI-027':isRafaleSupreme(card)?'AVI-051':undefined} data-rarity={rarity||'unset'} data-material={material.token} data-effects={effects} data-reveal={reveal?'true':'false'} style={{'--card-accent':isSaintNectaireSupreme(card)?'#e8c260':isRoquefortSupreme(card)?'#9abce5':isEverestSupreme(card)?'#e8c260':isMarieSupreme(card)?'#a0c8ff':isReefSupreme(card)?'#3fd6e8':isComteSupreme(card)?'#c98a1e':isCamembertSupreme(card)?'#c98a1e':isSpitfireSupreme(card)?'#e8b84a':isBlackbirdSupreme(card)?'#ffd9a0':isStukaSupreme(card)?'#ffb0a0':isRafaleSupreme(card)?'#9cc8ff':isConcordeSupreme(card)?'#a6b7d6':custom?'#d5ad46':material.hex,'--card-light':isSaintNectaireSupreme(card)?'#f1deaa':isRoquefortSupreme(card)?'#d9e9ff':isEverestSupreme(card)?'#f1deaa':isMarieSupreme(card)?'#dfe9fb':isReefSupreme(card)?'#c9f6ff':isComteSupreme(card)?'#f7e6bd':isCamembertSupreme(card)?'#fff6d2':isSpitfireSupreme(card)?'#f0e2c0':isBlackbirdSupreme(card)?'#e6e9ee':isStukaSupreme(card)?'#e6e9ee':isRafaleSupreme(card)?'#e8f0fa':isConcordeSupreme(card)?'#eef4ff':custom?'#fff3c4':material.light,'--card-shadow':isSaintNectaireSupreme(card)?'#3a3b3e':isRoquefortSupreme(card)?'#5c6a80':isEverestSupreme(card)?'#1c1440':isMarieSupreme(card)?'#050c2a':isReefSupreme(card)?'#0a6aa0':isComteSupreme(card)?'#4a2e16':isCamembertSupreme(card)?'#7a5230':isSpitfireSupreme(card)?'#2a3016':isBlackbirdSupreme(card)?'#080a10':isStukaSupreme(card)?'#1c222a':isA380Supreme(card)?'#08183c':isB747Supreme(card)?'#140c30':isConcordeSupreme(card)?'#050a1c':isRafaleSupreme(card)?'#04060a':material.shadow,...((custom||rarity==='Légendaire'||rarity==='Inhabituelle'||rarity==='Courante'||rarity==='Rare'||rarity==='Précieuse')?{aspectRatio:'630 / 972',background:'transparent',borderRadius:custom?'4.127% / 2.675%':'5% / 3.24%'}:{})} as CSSProperties} aria-label={label} onPointerMove={light} onPointerLeave={reset} onPointerCancel={reset} onPointerDown={e=>{light(e);if(e.pointerType==='touch'){if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(reset,1600);}}}><CardFace card={card} imageHref={imageHref} side={side}/></div>;
}
