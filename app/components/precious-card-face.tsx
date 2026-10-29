import {useId} from 'react';
import {type Card} from '../model';
import {CARD_FONT,textLines} from './card-layout';
import {cardSummary} from './card-summary';
export const PRECIOUS_TEMPLATE='/templates/precious-v1.png';
export const PRECIOUS_PHOTO={x:30,y:61,width:570,height:674} as const;
function nameLines(name:string){let size=32;const text=name.toLocaleUpperCase('fr');while(size>21&&textLines(text,size,440).length>2)size--;const lines=textLines(text,size,440).slice(0,2);if(textLines(text,size,440).length>2)lines[1]=lines[1].slice(0,-1)+'…';return {size:lines.length>1?Math.min(size,25):size,lines};}
// Preserve the provided artwork; replace only its photograph and placeholder text.
export default function PreciousCardFace({card,imageHref}:{card:Card;imageHref?:string}){
 const id='precious'+useId().replace(/[^a-zA-Z0-9]/g,'');const title=nameLines(card.name||'Nom de la carte');const summary=cardSummary(card);let size=20;while(size>14&&textLines(summary,size,466).length>2)size--;const lines=textLines(summary,size,466).slice(0,2);
 const photo=imageHref||(card.imageKey?`/api/media/${card.imageKey}`:'');const u=(s:string)=>`url(#${id}${s})`;
 return <svg className="atlas-card-face atlas-precious-template" viewBox="0 0 630 972" xmlns="http://www.w3.org/2000/svg" role="img" data-side="front" data-layout="precious-template" data-rarity="Précieuse" data-material="precious" aria-labelledby={`${id}title ${id}desc`} fontFamily={CARD_FONT}>
  <title id={`${id}title`}>{`${card.name} — Précieuse — Recto`}</title><desc id={`${id}desc`}>{`ATLAS. PRÉCIEUSE. ${card.name}. ${summary}`}</desc>
  <defs>
   <mask id={`${id}photo`} maskUnits="userSpaceOnUse" x="0" y="0" width="630" height="972"><rect {...PRECIOUS_PHOTO} fill="white"/><g fill="black"><circle cx="31" cy="64" r="21"/><circle cx="599" cy="64" r="21"/><circle cx="31" cy="734" r="21"/><circle cx="599" cy="734" r="21"/><path d="M315 25L338 57L315 103L292 57Z M315 696L338 734L315 773L292 734Z M0 399L43 377L75 399L43 421Z M555 399L601 377L632 399L601 421Z M160 151L162 159L170 162L162 165L160 173L158 165L150 162L158 159Z M479 519L481 527L489 530L481 533L479 541L477 533L469 530L477 527Z"/></g></mask>
   <pattern id={`${id}nameTexture`} x="0" y="0" width="630" height="10" patternUnits="userSpaceOnUse"><image href={PRECIOUS_TEMPLATE} width="630" height="972" y="-799"/></pattern>
   <pattern id={`${id}summaryTexture`} x="0" y="0" width="630" height="8" patternUnits="userSpaceOnUse"><image href={PRECIOUS_TEMPLATE} width="630" height="972" y="-883"/></pattern>
   <filter id={`${id}softPatch`} x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
   <mask id={`${id}summaryBlend`} maskUnits="userSpaceOnUse" x="0" y="0" width="630" height="972"><rect x="98" y="886" width="434" height="55" fill="white" filter={u('softPatch')}/></mask>
  </defs>
  <image data-original-template="true" href={PRECIOUS_TEMPLATE} width="630" height="972"/>
  {photo&&<image data-main-photo="true" data-photo-format="vertical" href={photo} {...PRECIOUS_PHOTO} preserveAspectRatio="xMidYMid slice" mask={u('photo')}/>}
  {photo&&<g mask={u('photo')} fill="none" stroke="#f8f1ff" pointerEvents="none"><rect x="30.5" y="61.5" width="569" height="673" strokeOpacity=".9"/><rect x="38" y="71" width="554" height="656" strokeOpacity=".65"/></g>}
  <rect x="124" y="809" width="382" height="38" fill={u('nameTexture')}/>
  <rect x="86" y="874" width="458" height="79" fill={u('summaryTexture')} mask={u('summaryBlend')}/>
  <text data-card-name="true" x="315" y={title.lines.length===1?838:819} textAnchor="middle" fontSize={title.size} fontWeight="750" letterSpacing=".5" fill="#352462">{title.lines.map((line,i)=><tspan key={i} x="315" dy={i?27:0}>{line}</tspan>)}</text>
  <text data-card-summary="true" x="315" y={lines.length===1?918:904} textAnchor="middle" fontSize={size} fontWeight="500" fill="#352462">{lines.map((line,i)=><tspan key={i} x="315" dy={i?24:0}>{line}</tspan>)}</text>
 </svg>;
}
