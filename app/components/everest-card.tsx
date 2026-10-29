import design from '../content/everest-design.json';
import {type CSSProperties} from 'react';
import {displayRarity,type Card} from '../model';
import {CARD_FONT,BACK_TEXT_AREA,cardTitle,cardDescription,textLines,type CardSide} from './card-layout';
export function isEverestSupreme(card:Card){return card.code==='GEO-001'&&card.universe==='Géographie'&&displayRarity(card)==='Suprême';}
const box=(x:number,y:number,w:number,h:number):CSSProperties=>({left:`${x/630*100}%`,top:`${y/972*100}%`,width:`${w/630*100}%`,height:`${h/972*100}%`});
const stars=[[300,40,14,0],[560,230,13,-1.1],[14,330,12,-.5],[604,700,12,-1.7],[12,740,11,-2.2],[160,90,10,-.9],[470,110,10,-1.9]];
export default function EverestCard({card,side='front'}:{card:Card;side?:CardSide}){
 const back=side==='back',title=cardTitle(card.name),description=cardDescription(card.description),height=972*360/630;
 return <div className={`atlas-card-face everest-card ${back?'everest-back':''}`} data-side={side} data-layout="everest-supreme" data-design-model="GEO-001" role="img" aria-description={back?`${card.category}. ${card.description}`:undefined} aria-label={`${card.name} — Suprême — ${back?'Verso':'Recto'}`} style={{fontFamily:CARD_FONT}}>
  <div className="everest-ly everest-rim"/><div className="everest-bd everest-sw"/><div className="everest-bd everest-sv"/><div className="everest-ly everest-gw"/>
  {!back&&<><div className="everest-photo" style={box(38,38,554,896)}><div className="everest-ly everest-photo-shade"/><div className="everest-ly everest-gf"/><div className="everest-al"/><div className="everest-mo"/><div className="everest-pm"/></div>
   {[[60,380,0],[380,640,-3.4],[200,860,-1.7]].map(([x,y,delay],i)=><div key={i} className="everest-sh" style={{...box(x,y,80,3),animationDelay:`${delay}s`}}/>)}
   <div className="everest-name-bg" style={box(158,832,314,70)}/></>}
  {back&&<div className="everest-back-panel" style={{left:`${BACK_TEXT_AREA.x/360*100}%`,top:`${BACK_TEXT_AREA.y/height*100}%`,width:`${BACK_TEXT_AREA.width/360*100}%`,height:`${BACK_TEXT_AREA.height/504*100}%`}}/>}
  {[18,562].map(x=><div key={x} className="everest-mg" style={box(x+1,462,48,48)}/>)}
  <div className="everest-wh"/>
  {!back&&<><svg className="everest-fg" viewBox="0 0 630 972" aria-hidden="true"><path d="M-6,150 Q140,92 290,26 M636,150 Q490,92 340,26 M38,690 Q315,800 592,664" fill="none" stroke="#f0e2b0" strokeWidth="1.5"/>{design.flags.map((flag,i)=><g key={i} transform={flag.transform}><polygon className="everest-fl" points="-9,0 9,0 9,19 -9,19" fill={flag.color} stroke="rgba(0,0,0,.25)" strokeWidth=".6" style={{animationDelay:`${flag.delay}s`}}/></g>)}</svg>{design.snow.map(([x,size,d,delay],i)=><div key={i} className="everest-sf" style={{...box(x,0,size,size),'--everest-duration':`${d}s`,animationDelay:`${delay}s`} as CSSProperties}/>)}</>}
  <img className="everest-ly everest-frame" src="/designs/everest/frame.png" alt=""/>
  {!back?<div className="everest-caption" style={box(158,832,314,70)}><div className="everest-gt everest-title" data-card-name="true">Mont Everest</div><div className="everest-divider"><i/><b/><i/></div><div className="everest-motto">TOIT DU MONDE · 8 849 m</div></div>:<svg className="everest-back-text" viewBox={`0 0 360 ${height}`} role="presentation">
   <rect data-back-text-area="true" x={BACK_TEXT_AREA.x} y={BACK_TEXT_AREA.y} width={BACK_TEXT_AREA.width} height={BACK_TEXT_AREA.height*height/504} rx="8" fill="none"/>
   <g fill="#f1deaa"><text x="30" y="77" fontSize={Math.min(20,title.size)} fontWeight="750">{title.lines.map((line,i)=><tspan key={i} x="30" dy={i?23:0}>{line}</tspan>)}</text><text x="30" y="126" fontSize="10" fontWeight="600" fill="#e8c260">{textLines(card.category,10,284).slice(0,2).map((line,i)=><tspan key={i} x="30" dy={i?13:0}>{line}</tspan>)}</text><text data-card-description="true" x="32" y="157" fontSize={description.size}>{description.lines.map((line,i)=><tspan key={i} x="32" dy={i?description.size*1.48:0}>{line}</tspan>)}</text><text x="330" y={height-18} textAnchor="end" fontSize="8">{card.code}</text></g>
  </svg>}
  {stars.map(([x,y,size,delay],i)=><div key={i} className="everest-st" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  <div className="everest-ly everest-ho"/><div className="everest-ly everest-gl"/><div className="everest-ly everest-g2"/>
 </div>;
}
