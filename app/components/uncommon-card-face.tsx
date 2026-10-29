import {useId} from 'react';
import {type Card} from '../model';
import {CARD_FONT,textLines} from './card-layout';
import {cardSummary} from './card-summary';
export const UNCOMMON_TEMPLATE='/templates/uncommon-v1.png';
export const UNCOMMON_PHOTO={x:30,y:63,width:570,height:671} as const;
function nameLines(name:string){let size=32;const text=name.toLocaleUpperCase('fr');while(size>21&&textLines(text,size,440).length>2)size--;const lines=textLines(text,size,440).slice(0,2);if(textLines(text,size,440).length>2)lines[1]=lines[1].slice(0,-1)+'…';return {size:lines.length>1?Math.min(size,25):size,lines};}
// Preserve the provided artwork; replace only its photograph and placeholder text.
export default function UnuncommonCardFace({card,imageHref}:{card:Card;imageHref?:string}){
 const id='uncommon'+useId().replace(/[^a-zA-Z0-9]/g,'');const title=nameLines(card.name||'Nom de la carte');const summary=cardSummary(card);let size=20;while(size>14&&textLines(summary,size,466).length>2)size--;const lines=textLines(summary,size,466).slice(0,2);
 const photo=imageHref||(card.imageKey?`/api/media/${card.imageKey}`:'');const u=(s:string)=>`url(#${id}${s})`;
 return <svg className="atlas-card-face atlas-uncommon-template" viewBox="0 0 630 972" xmlns="http://www.w3.org/2000/svg" role="img" data-side="front" data-layout="uncommon-template" data-rarity="Inhabituelle" data-material="uncommon" aria-labelledby={`${id}title ${id}desc`} fontFamily={CARD_FONT}>
  <title id={`${id}title`}>{`${card.name} — Inhabituelle — Recto`}</title><desc id={`${id}desc`}>{`ATLAS. INHABITUEL. ${card.name}. ${summary}`}</desc>
  <defs>
   <mask id={`${id}photo`} maskUnits="userSpaceOnUse" x="0" y="0" width="630" height="972"><rect {...UNCOMMON_PHOTO} fill="white"/><g fill="black"><circle cx="315" cy="60" r="32"/><ellipse cx="69" cy="63" rx="12" ry="5" transform="rotate(-30 69 63)"/><ellipse cx="559" cy="63" rx="12" ry="5" transform="rotate(30 559 63)"/><ellipse cx="35" cy="108" rx="12" ry="5" transform="rotate(20 35 108)"/><ellipse cx="30" cy="133" rx="12" ry="5" transform="rotate(70 30 133)"/><ellipse cx="595" cy="108" rx="12" ry="5" transform="rotate(-20 595 108)"/><ellipse cx="600" cy="133" rx="12" ry="5" transform="rotate(-70 600 133)"/><ellipse cx="29" cy="392" rx="10" ry="5" transform="rotate(-50 29 392)"/><ellipse cx="32" cy="409" rx="10" ry="5" transform="rotate(45 32 409)"/><ellipse cx="600" cy="392" rx="10" ry="5" transform="rotate(50 600 392)"/><ellipse cx="597" cy="409" rx="10" ry="5" transform="rotate(-45 597 409)"/><ellipse cx="27" cy="666" rx="13" ry="5" transform="rotate(65 27 666)"/><ellipse cx="32" cy="690" rx="12" ry="5" transform="rotate(-10 32 690)"/><ellipse cx="594" cy="666" rx="13" ry="5" transform="rotate(-65 594 666)"/><ellipse cx="592" cy="690" rx="12" ry="5" transform="rotate(10 592 690)"/><ellipse cx="65" cy="735" rx="13" ry="5" transform="rotate(-25 65 735)"/><ellipse cx="559" cy="735" rx="13" ry="5" transform="rotate(25 559 735)"/></g><g fill="none" stroke="black" strokeWidth="4"><path d="M37 96Q56 58 83 73Q101 82 84 94Q73 97 76 83 M593 96Q574 58 547 73Q529 82 546 94Q557 97 554 83 M37 699Q56 737 83 722Q101 713 84 704Q73 701 76 715 M593 699Q574 737 547 722Q529 713 546 704Q557 701 554 715"/></g></mask>
   <pattern id={`${id}nameTexture`} x="0" y="0" width="630" height="20" patternUnits="userSpaceOnUse"><image href={UNCOMMON_TEMPLATE} width="630" height="972" y="-769"/></pattern>
   <pattern id={`${id}summaryTexture`} x="0" y="0" width="630" height="14" patternUnits="userSpaceOnUse"><image href={UNCOMMON_TEMPLATE} width="630" height="972" y="-911"/></pattern>
   <filter id={`${id}softPatch`} x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
   <mask id={`${id}summaryBlend`} maskUnits="userSpaceOnUse" x="0" y="0" width="630" height="972"><rect x="102" y="858" width="426" height="45" fill="white" filter={u('softPatch')}/></mask>
  </defs>
  <image data-original-template="true" href={UNCOMMON_TEMPLATE} width="630" height="972"/>
  {photo&&<image data-main-photo="true" data-photo-format="vertical" href={photo} {...UNCOMMON_PHOTO} preserveAspectRatio="xMidYMid slice" mask={u('photo')}/>}
  <rect x="147" y="795" width="336" height="36" fill={u('nameTexture')}/>
  <rect x="90" y="846" width="450" height="69" fill={u('summaryTexture')} mask={u('summaryBlend')}/>
  <text data-card-name="true" x="315" y={title.lines.length===1?822:801} textAnchor="middle" fontSize={title.size} fontWeight="750" letterSpacing=".5" fill="#f4fff9">{title.lines.map((line,i)=><tspan key={i} x="315" dy={i?27:0}>{line}</tspan>)}</text>
  <text data-card-summary="true" x="315" y={lines.length===1?887:873} textAnchor="middle" fontSize={size} fontWeight="500" fill="#f4fff9">{lines.map((line,i)=><tspan key={i} x="315" dy={i?24:0}>{line}</tspan>)}</text>
 </svg>;
}
