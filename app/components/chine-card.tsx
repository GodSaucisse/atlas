import {useId,type CSSProperties} from 'react';
import {displayRarity,type Card} from '../model';
import {CARD_FONT,BACK_TEXT_AREA,cardTitle,cardDescription,textLines,type CardSide} from './card-layout';
export function isChineSupreme(card:Card){return card.code==='GEP-002'&&card.universe==='Géopolitique'&&displayRarity(card)==='Suprême';}
const box=(x:number,y:number,w:number,h:number):CSSProperties=>({left:`${x/630*100}%`,top:`${y/972*100}%`,width:`${w/630*100}%`,height:`${h/972*100}%`});
const bubbles=[[120,820,14,0],[210,800,9,-2.5],[420,810,12,-4.2],[500,830,16,-1.3],[300,790,8,-5.6],[80,700,10,-3.3],[550,620,12,-6.4]];
const stars=[[300,40,14,0],[560,230,13,-1.1],[14,330,12,-.5],[604,700,12,-1.7],[12,740,11,-2.2],[160,90,10,-.9],[470,110,10,-1.9]];
export default function ChineCard({card,side='front'}:{card:Card;side?:CardSide}){
 const uid=useId().replace(/[^a-zA-Z0-9]/g,'');
 const back=side==='back',title=cardTitle(card.name),description=cardDescription(card.description),height=972*360/630;
 return <div className={`atlas-card-face chine-card ${back?'chine-back':''}`} data-side={side} data-layout="chine-supreme" data-design-model="GEP-002" role="img" aria-description={back?`${card.category}. ${card.description}`:undefined} aria-label={`${card.name} — Suprême — ${back?'Verso':'Recto'}`} style={{fontFamily:CARD_FONT}}>
  <div className="chine-ly chine-rim"/><div className="chine-bd chine-sw"/><div className="chine-bd chine-sv"/><div className="chine-ly chine-gw"/>
  {!back&&<><div className="chine-photo" style={box(38,38,554,896)}><div className="chine-ly chine-photo-shade"/><div className="chine-ly chine-gf"/><div className="chine-reflections"/>{Array.from({length:40},(_,i)=><i key={i} className="chine-city-light" style={{left:`${(i*37)%94+3}%`,top:`${40+(i*13)%25}%`,animationDelay:`${-i*.1}s`}}/>)}</div>
   {Array.from({length:10},(_,i)=><img key={i} className="chine-sky-lantern" src="/designs/chine/sky-lantern.svg" alt="" style={{...box(80+(i*83)%440,908,24+(i%4)*5,36+(i%4)*6),animationDuration:`${28+i}s`,animationDelay:`${-i*3}s`}}/>)}
   <div className="chine-name-bg" style={box(158,832,314,70)}/></>}
  {back&&<div className="chine-back-panel" style={{left:`${BACK_TEXT_AREA.x/360*100}%`,top:`${BACK_TEXT_AREA.y/height*100}%`,width:`${BACK_TEXT_AREA.width/360*100}%`,height:`${BACK_TEXT_AREA.height/504*100}%`}}/>}
  {[18,562].map(x=><div key={x} className="chine-mg" style={box(x+1,462,48,48)}/>)}
  <div className="chine-wh">★</div>
  {[[92,66],[496,66]].map(([x,y],i)=><img key={i} className="chine-lantern" src="/designs/chine/lantern.svg" alt="" style={{...box(x,y,42,67),animationDelay:`${-1.3*i}s`}}/>)}
  <img className="chine-ly chine-frame" src="/designs/chine/frame.png" alt=""/>
  {!back?<div className="chine-caption" style={box(158,832,314,70)}><div className="chine-gt chine-title" data-card-name="true">Chine</div><div className="chine-divider"><i/><b/><i/></div><div className="chine-motto">EMPIRE DU MILIEU</div></div>:<svg className="chine-back-text" viewBox={`0 0 360 ${height}`} role="presentation">
   <rect data-back-text-area="true" x={BACK_TEXT_AREA.x} y={BACK_TEXT_AREA.y} width={BACK_TEXT_AREA.width} height={BACK_TEXT_AREA.height*height/504} rx="8" fill="none"/>
   <g fill="#f1deaa"><text x="30" y="77" fontSize={Math.min(20,title.size)} fontWeight="750">{title.lines.map((line,i)=><tspan key={i} x="30" dy={i?23:0}>{line}</tspan>)}</text><text x="30" y="126" fontSize="10" fontWeight="600" fill="#e8c260">{textLines(card.category,10,284).slice(0,2).map((line,i)=><tspan key={i} x="30" dy={i?13:0}>{line}</tspan>)}</text><text data-card-description="true" x="32" y="157" fontSize={description.size}>{description.lines.map((line,i)=><tspan key={i} x="32" dy={i?description.size*1.48:0}>{line}</tspan>)}</text><text x="330" y={height-18} textAnchor="end" fontSize="8">{card.code}</text></g>
  </svg>}
  {stars.map(([x,y,size,delay],i)=><div key={i} className="chine-st" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  <div className="chine-ly chine-ho"/><div className="chine-ly chine-gl"/><div className="chine-ly chine-g2"/>
 </div>;
}
