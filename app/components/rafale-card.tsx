import {type CSSProperties} from 'react';
import {displayRarity,type Card} from '../model';
import {CARD_FONT,BACK_TEXT_AREA,cardTitle,cardDescription,textLines,type CardSide} from './card-layout';
export function isRafaleSupreme(card:Card){return card.code==='AVI-051'&&card.universe==='Aviation'&&displayRarity(card)==='Suprême';}
const box=(x:number,y:number,w:number,h:number):CSSProperties=>({left:`${x/630*100}%`,top:`${y/972*100}%`,width:`${w/630*100}%`,height:`${h/972*100}%`});
const stars=[[8,8,14,0],[608,950,14,-1.3],[603,520,12,-.7]];
export default function RafaleCard({card,side='front'}:{card:Card;side?:CardSide}){
 const back=side==='back',title=cardTitle(card.name),description=cardDescription(card.description),height=972*360/630;
 return <div className={`atlas-card-face rafale-card ${back?'rafale-back':''}`} data-side={side} data-layout="rafale-supreme" data-design-model="AVI-051" role="img" aria-description={back?`${card.category}. ${card.description}`:undefined} aria-label={`${card.name} — Suprême — ${back?'Verso':'Recto'}`} style={{fontFamily:CARD_FONT}}>
  <div className="rafale-ly rafale-rim"/><div className="rafale-bd rafale-sw"/><div className="rafale-bd rafale-sv"/><div className="rafale-ly rafale-glow"/><div className="rafale-ly rafale-b1"/><div className="rafale-ly rafale-b2"/><div className="rafale-ly rafale-b3"/>
  {!back&&<><div className="rafale-photo" style={box(38,38,554,896)}><div className="rafale-ly rafale-photo-shade"/></div><div className="rafale-name-bg" style={box(132,816,366,83)}/></>}
  {back&&<div className="rafale-back-panel" style={{left:`${BACK_TEXT_AREA.x/360*100}%`,top:`${BACK_TEXT_AREA.y/height*100}%`,width:`${BACK_TEXT_AREA.width/360*100}%`,height:`${BACK_TEXT_AREA.height/504*100}%`}}/>}
  <img className="rafale-ly rafale-frame" src="/designs/rafale/frame.png" alt=""/>
  {!back?<div className="rafale-caption" style={box(132,816,366,83)}><div className="rafale-gt rafale-title" data-card-name="true">{card.name}</div><div className="rafale-divider"><i/><b/><i/></div><div className="rafale-motto">AVION DE CHASSE</div></div>:<svg className="rafale-back-text" viewBox={`0 0 360 ${height}`} role="presentation">
   <rect data-back-text-area="true" x={BACK_TEXT_AREA.x} y={BACK_TEXT_AREA.y} width={BACK_TEXT_AREA.width} height={BACK_TEXT_AREA.height*height/504} rx="8" fill="none"/>
   <g fill="#e8f0fa"><text x="30" y="77" fontSize={Math.min(20,title.size)} fontWeight="750">{title.lines.map((line,i)=><tspan key={i} x="30" dy={i?23:0}>{line}</tspan>)}</text><text x="30" y="126" fontSize="10" fontWeight="600" fill="#9cc8ff">{textLines(card.category,10,284).slice(0,2).map((line,i)=><tspan key={i} x="30" dy={i?13:0}>{line}</tspan>)}</text><text data-card-description="true" x="32" y="157" fontSize={description.size}>{description.lines.map((line,i)=><tspan key={i} x="32" dy={i?description.size*1.48:0}>{line}</tspan>)}</text><text x="330" y={height-18} textAnchor="end" fontSize="8">{card.code}</text></g>
  </svg>}
  {stars.map(([x,y,size,delay],i)=><div key={i} className="rafale-st" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  <div className="rafale-ly rafale-ho"/><div className="rafale-ly rafale-gl"/><div className="rafale-ly rafale-g2"/>
 </div>;
}
