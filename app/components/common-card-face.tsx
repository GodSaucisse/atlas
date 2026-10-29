import {useId} from 'react';
import {type Card} from '../model';
import {CARD_FONT,textLines} from './card-layout';
import {cardSummary} from './card-summary';
export const COMMON_TEMPLATE='/templates/common-v1.png';
export const COMMON_PHOTO={x:30,y:62,width:570,height:636} as const;
function nameLines(name:string){let size=32;const text=name.toLocaleUpperCase('fr');while(size>21&&textLines(text,size,440).length>2)size--;const lines=textLines(text,size,440).slice(0,2);if(textLines(text,size,440).length>2)lines[1]=lines[1].slice(0,-1)+'…';return {size:lines.length>1?Math.min(size,25):size,lines};}
// Preserve the provided artwork; replace only its photograph and placeholder text.
export default function CommonCardFace({card,imageHref}:{card:Card;imageHref?:string}){
 const id='common'+useId().replace(/[^a-zA-Z0-9]/g,'');const title=nameLines(card.name||'Nom de la carte');const summary=cardSummary(card);let size=20;while(size>14&&textLines(summary,size,466).length>2)size--;const lines=textLines(summary,size,466).slice(0,2);
 const photo=imageHref||(card.imageKey?`/api/media/${card.imageKey}`:'');const u=(s:string)=>`url(#${id}${s})`;
 return <svg className="atlas-card-face atlas-common-template" viewBox="0 0 630 972" xmlns="http://www.w3.org/2000/svg" role="img" data-side="front" data-layout="common-template" data-rarity="Courante" data-material="common" aria-labelledby={`${id}title ${id}desc`} fontFamily={CARD_FONT}>
  <title id={`${id}title`}>{`${card.name} — Courante — Recto`}</title><desc id={`${id}desc`}>{`ATLAS. COMMUNE. ${card.name}. ${summary}`}</desc>
  <defs>
   <clipPath id={`${id}photo`}><path d="M42 64H598V685L587 697H30V76Z"/></clipPath>
   <pattern id={`${id}nameTexture`} x="0" y="0" width="630" height="20" patternUnits="userSpaceOnUse"><image href={COMMON_TEMPLATE} width="630" height="972" y="-777"/></pattern>
   <pattern id={`${id}summaryTexture`} x="0" y="0" width="630" height="14" patternUnits="userSpaceOnUse"><image href={COMMON_TEMPLATE} width="630" height="972" y="-904"/></pattern>
   <filter id={`${id}softPatch`} x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
   <mask id={`${id}summaryBlend`} maskUnits="userSpaceOnUse" x="0" y="0" width="630" height="972"><rect x="101" y="856" width="428" height="42" fill="white" filter={u('softPatch')}/></mask>
  </defs>
  <image data-original-template="true" href={COMMON_TEMPLATE} width="630" height="972"/>
  {photo&&<image data-main-photo="true" data-photo-format="vertical" href={photo} {...COMMON_PHOTO} preserveAspectRatio="xMidYMid slice" clipPath={u('photo')}/>}
  <rect x="138" y="797" width="354" height="36" fill={u('nameTexture')}/>
  <rect x="89" y="844" width="452" height="66" fill={u('summaryTexture')} mask={u('summaryBlend')}/>
  <text data-card-name="true" x="315" y={title.lines.length===1?826:804} textAnchor="middle" fontSize={title.size} fontWeight="750" letterSpacing=".5" fill="#16232b">{title.lines.map((line,i)=><tspan key={i} x="315" dy={i?27:0}>{line}</tspan>)}</text>
  <text data-card-summary="true" x="315" y={lines.length===1?880:866} textAnchor="middle" fontSize={size} fontWeight="500" fill="#16232b">{lines.map((line,i)=><tspan key={i} x="315" dy={i?24:0}>{line}</tspan>)}</text>
 </svg>;
}
