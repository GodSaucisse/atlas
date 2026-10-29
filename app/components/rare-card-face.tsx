import {useId} from 'react';
import {type Card} from '../model';
import {CARD_FONT,textLines} from './card-layout';
import {cardSummary} from './card-summary';
export const RARE_TEMPLATE='/templates/rare-v1.png';
export const RARE_PHOTO={x:30,y:61,width:570,height:674} as const;
export function rareCardTitle(name:string){let size=32;const text=name.toLocaleUpperCase('fr');while(size>21&&textLines(text,size,492).length>2)size--;const lines=textLines(text,size,492).slice(0,2);if(textLines(text,size,492).length>2)lines[1]=lines[1].slice(0,-1)+'…';return {size,lines};}
// The supplied PNG is the actual frame, not an approximation. Only its content fields are replaced.
export default function RareCardFace({card,imageHref}:{card:Card;imageHref?:string}){
 const id='rare'+useId().replace(/[^a-zA-Z0-9]/g,'');const title=rareCardTitle(card.name||'Nom de la carte');
 const summary=cardSummary(card);let size=18;while(size>13&&textLines(summary,size,470).length>2)size--;const lines=textLines(summary,size,470).slice(0,2);
 const photo=imageHref||(card.imageKey?`/api/media/${card.imageKey}`:'');const u=(s:string)=>`url(#${id}${s})`;
 return <svg className="atlas-card-face atlas-rare-template" viewBox="0 0 630 972" xmlns="http://www.w3.org/2000/svg" role="img" data-side="front" data-layout="rare-template" data-rarity="Rare" data-material="rare" aria-labelledby={`${id}title ${id}desc`} fontFamily={CARD_FONT}>
  <title id={`${id}title`}>{`${card.name} — Rare — Recto`}</title><desc id={`${id}desc`}>ATLAS. RARE. {card.name}. {summary}</desc>
  <defs>
   <mask id={`${id}photo`} maskUnits="userSpaceOnUse" x="0" y="0" width="630" height="972"><rect {...RARE_PHOTO} fill="white"/><path d="M296 44L307 33H325L335 44V73L325 86H306L296 73Z M22 49H39L47 57V73L39 81H22L14 73V57Z M590 49H607L615 57V73L607 81H590L582 73V57Z M22 718H39L47 726V743L39 751H22L14 743V726Z M590 718H607L615 726V743L607 751H590L582 743V726Z M11 391L20 380H31L40 391V408L31 418H20L11 408Z M591 391L600 380H611L620 391V408L611 418H600L591 408Z" fill="black"/></mask>
   <pattern id={`${id}titleTexture`} x="0" y="0" width="630" height="20" patternUnits="userSpaceOnUse"><image href={RARE_TEMPLATE} width="630" height="972" y="-771"/></pattern>
   <pattern id={`${id}summaryTexture`} x="0" y="0" width="630" height="20" patternUnits="userSpaceOnUse"><image href={RARE_TEMPLATE} width="630" height="972" y="-905"/></pattern>
  </defs>
  <image data-original-template="true" href={RARE_TEMPLATE} width="630" height="972"/>
  {photo&&<image data-main-photo="true" data-photo-format="vertical" href={photo} {...RARE_PHOTO} preserveAspectRatio="xMidYMid slice" mask={u('photo')}/>}
  {photo&&<g mask={u('photo')} fill="none" stroke="#eff6ff" pointerEvents="none"><rect x="30.5" y="61.5" width="569" height="673" strokeOpacity=".85"/><rect x="38" y="71" width="554" height="656" strokeOpacity=".6"/></g>}
  <rect x="157" y="794" width="319" height="38" fill={u('titleTexture')}/>
  <rect x="108" y="859" width="415" height="45" fill={u('summaryTexture')}/>
  <text data-card-name="true" x="315" y={title.lines.length===1?822:799} textAnchor="middle" fontSize={title.size} fontWeight="750" letterSpacing=".7" fill="#ffffff" style={{paintOrder:'stroke',stroke:'#142d61',strokeWidth:1}}>{title.lines.map((line,i)=><tspan key={i} x="315" dy={i?title.size*1.04:0}>{line}</tspan>)}</text>
  <text data-card-summary="true" x="315" y={lines.length===1?888:877} textAnchor="middle" fontSize={size} fontWeight="500" fill="#eef4ff">{lines.map((line,i)=><tspan key={i} x="315" dy={i?23:0}>{line}</tspan>)}</text>
 </svg>;
}
