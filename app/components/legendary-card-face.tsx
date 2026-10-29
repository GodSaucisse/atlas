import {useId} from 'react';
import {type Card} from '../model';
import {CARD_FONT,textLines} from './card-layout';
import {cardSummary} from './card-summary';
export const LEGENDARY_TEMPLATE='/templates/legendary-v1.png';
export const LEGENDARY_PHOTO={x:34,y:65,width:562,height:667} as const;
function nameLines(name:string){let size=32;const text=name.toLocaleUpperCase('fr');while(size>21&&textLines(text,size,440).length>2)size--;const lines=textLines(text,size,440).slice(0,2);if(textLines(text,size,440).length>2)lines[1]=lines[1].slice(0,-1)+'…';return {size:lines.length>1?Math.min(size,25):size,lines};}
// Preserve the provided artwork; replace only its photograph and placeholder text.
export default function LegendaryCardFace({card,imageHref}:{card:Card;imageHref?:string}){
 const id='legendary'+useId().replace(/[^a-zA-Z0-9]/g,'');const title=nameLines(card.name||'Nom de la carte');const summary=cardSummary(card);let size=20;while(size>14&&textLines(summary,size,466).length>2)size--;const lines=textLines(summary,size,466).slice(0,2);
 const photo=imageHref||(card.imageKey?`/api/media/${card.imageKey}`:'');const u=(s:string)=>`url(#${id}${s})`;
 return <svg className="atlas-card-face atlas-legendary-template" viewBox="0 0 630 972" xmlns="http://www.w3.org/2000/svg" role="img" data-side="front" data-layout="legendary-template" data-rarity="Légendaire" data-material="legendary" aria-labelledby={`${id}title ${id}desc`} fontFamily={CARD_FONT}>
  <title id={`${id}title`}>{`${card.name} — Légendaire — Recto`}</title><desc id={`${id}desc`}>{`ATLAS. LÉGENDAIRE. ${card.name}. ${summary}`}</desc>
  <defs>
   <filter id={`${id}photoBlur`}><feGaussianBlur stdDeviation="18"/></filter>
   <mask id={`${id}photo`} maskUnits="userSpaceOnUse" x="0" y="0" width="630" height="972"><rect {...LEGENDARY_PHOTO} fill="white"/><rect x="294" y="35" width="42" height="48" rx="10" fill="black"/><circle cx="300" cy="79" r="4" fill="black"/><circle cx="330" cy="79" r="4" fill="black"/></mask>
   <pattern id={`${id}nameTexture`} x="0" y="0" width="630" height="20" patternUnits="userSpaceOnUse"><image href={LEGENDARY_TEMPLATE} width="630" height="972" y="-769"/></pattern>
   <pattern id={`${id}summaryTexture`} x="0" y="0" width="630" height="14" patternUnits="userSpaceOnUse"><image href={LEGENDARY_TEMPLATE} width="630" height="972" y="-910"/></pattern>
   <filter id={`${id}softPatch`} x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
   <mask id={`${id}summaryBlend`} maskUnits="userSpaceOnUse" x="0" y="0" width="630" height="972"><rect x="102" y="858" width="426" height="45" fill="white" filter={u('softPatch')}/></mask>
  </defs>
  <image data-original-template="true" href={LEGENDARY_TEMPLATE} width="630" height="972"/>
  {photo&&card.imageFit==='contain'&&<g mask={u('photo')}><image href={photo} {...LEGENDARY_PHOTO} preserveAspectRatio="xMidYMid slice" filter={u('photoBlur')}/></g>}
  {photo&&<image data-main-photo="true" data-photo-format="vertical" href={photo} {...LEGENDARY_PHOTO} preserveAspectRatio={card.imageFit==='contain'?'xMidYMid meet':'xMidYMid slice'} mask={u('photo')}/>}
  <rect x="145" y="793" width="340" height="36" fill={u('nameTexture')}/>
  <rect x="90" y="846" width="450" height="69" fill={u('summaryTexture')} mask={u('summaryBlend')}/>
  <text data-card-name="true" x="315" y={title.lines.length===1?822:801} textAnchor="middle" fontSize={title.size} fontWeight="750" letterSpacing=".5" fill="#fff5f3">{title.lines.map((line,i)=><tspan key={i} x="315" dy={i?27:0}>{line}</tspan>)}</text>
  <text data-card-summary="true" x="315" y={lines.length===1?887:873} textAnchor="middle" fontSize={size} fontWeight="500" fill="#fff5f3">{lines.map((line,i)=><tspan key={i} x="315" dy={i?24:0}>{line}</tspan>)}</text>
 </svg>;
}
