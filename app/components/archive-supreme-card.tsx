import halloweenCharacters from '../content/halloween-walter-rick-designs.json';
import {useId} from 'react';
import designs from '../content/archive-supreme-designs.json';
import editions from '../content/special-edition-designs.json';
import nba from '../content/nba-supreme-designs.json';
import halloween from '../content/halloween-designs.json';
import october from '../content/october-supreme-designs.json';
import pierre from '../content/saint-pierre-designs.json';
import remaining from '../content/remaining-supreme-designs.json';
import {displayRarity,type Card} from '../model';
import {BACK_TEXT_AREA,cardTitle,cardDescription,textLines,type CardSide} from './card-layout';
type Design={slug:string;universe:string;html:string;rarity?:string};
const registry:Record<string,Design>={...designs,...editions,...nba,...halloween,...october,...pierre,...remaining,...halloweenCharacters};
export function archiveSupremeDesign(card:Card):Design|undefined{
 const design=registry[card.code];
 return design&&card.universe===design.universe&&displayRarity(card)===(design.rarity||'Suprême')?design:undefined;
}
export default function ArchiveSupremeCard({card,side='front'}:{card:Card;side?:CardSide}){
 const uid='atlas'+useId().replace(/[^a-zA-Z0-9]/g,'');
 const design=archiveSupremeDesign(card);if(!design)return null;
 const markup=design.html.replace(/\bid="([^"]+)"/g,(_,id)=>`id="${uid}-${id}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${uid}-${id})`).replace(/((?:xlink:)?href)="#([^"]+)"/g,(_,attr,id)=>`${attr}="#${uid}-${id}"`);
 const back=side==='back',height=972*360/630,title=cardTitle(card.name),description=cardDescription(card.description);
 return <div className={`atlas-card-face archive-supreme-card ${back?'archive-supreme-back':''}`} data-side={side} data-layout={`${design.slug}-supreme`} data-design-model={card.code} role="img" aria-label={`${card.name} — ${design.rarity||'Suprême'} — ${back?'Verso':'Recto'}`}>
  <svg className="archive-supreme-art" viewBox="0 0 630 972" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><foreignObject x="0" y="0" width="630" height="972"><div className="archive-native-canvas" dangerouslySetInnerHTML={{__html:markup}}/></foreignObject></svg>
  {back&&<svg className="archive-supreme-back-text" viewBox={`0 0 360 ${height}`} role="presentation">
   <rect data-back-text-area="true" x={BACK_TEXT_AREA.x} y={BACK_TEXT_AREA.y} width={BACK_TEXT_AREA.width} height={BACK_TEXT_AREA.height*height/504} rx="8" fill="#081421" fillOpacity=".88"/>
   <g fill="#f7e9bc"><text x="30" y="77" fontSize={Math.min(20,title.size)} fontWeight="750">{title.lines.map((line,i)=><tspan key={i} x="30" dy={i?23:0}>{line}</tspan>)}</text><text x="30" y="126" fontSize="10" fontWeight="600">{textLines(card.category,10,284).slice(0,2).map((line,i)=><tspan key={i} x="30" dy={i?13:0}>{line}</tspan>)}</text><text data-card-description="true" x="32" y="157" fontSize={description.size}>{description.lines.map((line,i)=><tspan key={i} x="32" dy={i?description.size*1.48:0}>{line}</tspan>)}</text><text x="330" y={height-18} textAnchor="end" fontSize="8">{card.code}</text></g>
  </svg>}
 </div>;
}
