import {type CSSProperties} from 'react';
import {displayRarity,type Card} from '../model';
import {CARD_FONT,BACK_TEXT_AREA,cardTitle,cardDescription,textLines,type CardSide} from './card-layout';
export function isA380Supreme(card:Card){return card.code==='AVI-026'&&card.universe==='Aviation'&&displayRarity(card)==='Suprême';}
const box=(x:number,y:number,w:number,h:number):CSSProperties=>({left:`${x/630*100}%`,top:`${y/972*100}%`,width:`${w/630*100}%`,height:`${h/972*100}%`});
const orbs=[[29,29,12,0],[589,29,12,-.7],[29,931,12,-1.4],[589,931,12,-2.1],[308.5,34.5,13,-1],[37.5,480.5,11,-.4],[581.5,480.5,11,-1.7],[127,862,10,-2.4],[493,862,10,-.9]];
const rings=[[289,15,52,0],[22,465,42,-1.5],[566,465,42,-3]];
const stars=[[560,150,13,0],[14,300,12,-1.2],[604,680,12,-.6],[12,700,11,-1.9]];
export default function A380Card({card,side='front'}:{card:Card;side?:CardSide}){
 const back=side==='back',title=cardTitle(card.name),description=cardDescription(card.description),height=972*360/630;
 return <div className={`atlas-card-face a380-card ${back?'a380-back':''}`} data-side={side} data-layout="a380-supreme" data-design-model="AVI-026" role="img" aria-description={back?`${card.category}. ${card.description}`:undefined} aria-label={`${card.name} — Suprême — ${back?'Verso':'Recto'}`} style={{fontFamily:CARD_FONT}}>
  <div className="a380-ly a380-rim"/><div className="a380-bd a380-sw"/><div className="a380-bd a380-sv"/><div className="a380-ly a380-gw"/>
  {!back&&<><div className="a380-photo" style={box(38,38,554,896)}><div className="a380-ly a380-photo-shade"/><div className="a380-ly a380-gf"/></div><div className="a380-name-bg" style={box(158,832,314,70)}/></>}
  {back&&<div className="a380-back-panel" style={{left:`${BACK_TEXT_AREA.x/360*100}%`,top:`${BACK_TEXT_AREA.y/height*100}%`,width:`${BACK_TEXT_AREA.width/360*100}%`,height:`${BACK_TEXT_AREA.height/504*100}%`}}/>}
  <img className="a380-ly a380-frame" src="/designs/a380/frame.png" alt=""/>
  {orbs.filter((_,i)=>!back||i<7).map(([x,y,size,delay],i)=><div key={i} className="a380-orb" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  {rings.map(([x,y,size,delay],i)=><svg key={i} className="a380-rt" viewBox="-26 -26 52 52" style={{...box(x,y,size,size),animationDelay:`${delay}s`}} aria-hidden="true"><polygon points="0,-24 5.5,-13.3 17,-17 13.3,-5.5 24,0 13.3,5.5 17,17 5.5,13.3 0,24 -5.5,13.3 -17,17 -13.3,5.5 -24,0 -13.3,-5.5 -17,-17 -5.5,-13.3" fill="none" stroke="#fff3c4" strokeWidth="1.1"/></svg>)}
  {!back?<div className="a380-caption" style={box(158,832,314,70)}><div className="a380-gt a380-title" data-card-name="true">{card.name}</div><div className="a380-divider"><i/><b/><i/></div><div className="a380-motto">GÉANT DES CIEUX</div></div>:<svg className="a380-back-text" viewBox={`0 0 360 ${height}`} role="presentation">
   <rect data-back-text-area="true" x={BACK_TEXT_AREA.x} y={BACK_TEXT_AREA.y} width={BACK_TEXT_AREA.width} height={BACK_TEXT_AREA.height*height/504} rx="8" fill="none"/>
   <g fill="#fff5da"><text x="30" y="77" fontSize={Math.min(20,title.size)} fontWeight="750">{title.lines.map((line,i)=><tspan key={i} x="30" dy={i?23:0}>{line}</tspan>)}</text><text x="30" y="126" fontSize="10" fontWeight="600" fill="#aef6ff">{textLines(card.category,10,284).slice(0,2).map((line,i)=><tspan key={i} x="30" dy={i?13:0}>{line}</tspan>)}</text><text data-card-description="true" x="32" y="157" fontSize={description.size}>{description.lines.map((line,i)=><tspan key={i} x="32" dy={i?description.size*1.48:0}>{line}</tspan>)}</text><text x="330" y={height-18} textAnchor="end" fontSize="8">{card.code}</text></g>
  </svg>}
  {stars.map(([x,y,size,delay],i)=><div key={i} className="a380-st" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  <div className="a380-ly a380-ho"/><div className="a380-ly a380-gl"/><div className="a380-ly a380-g2"/>
 </div>;
}
