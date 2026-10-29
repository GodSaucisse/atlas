import {type CSSProperties} from 'react';
import {displayRarity,type Card} from '../model';
import {CARD_FONT,BACK_TEXT_AREA,cardTitle,cardDescription,textLines,type CardSide} from './card-layout';
export function isConcordeSupreme(card:Card){return card.code==='AVI-027'&&card.universe==='Aviation'&&displayRarity(card)==='Suprême';}
const box=(x:number,y:number,w:number,h:number):CSSProperties=>({left:`${x/630*100}%`,top:`${y/972*100}%`,width:`${w/630*100}%`,height:`${h/972*100}%`});
const orbs=[[29,29,12,0],[589,29,12,-.7],[29,931,12,-1.4],[589,931,12,-2.1],[308.5,34.5,13,-1],[37.5,480.5,11,-.4],[581.5,480.5,11,-1.7],[127,862,10,-2.4],[493,862,10,-.9]];
const stars=[[560,150,13,0],[14,300,12,-1.2],[604,680,12,-.6],[12,700,11,-1.9]];
export default function ConcordeCard({card,side='front'}:{card:Card;side?:CardSide}){
 const back=side==='back',title=cardTitle(card.name),description=cardDescription(card.description),height=972*360/630;
 return <div className={`atlas-card-face concorde-card ${back?'concorde-back':''}`} data-side={side} data-layout="concorde-supreme" data-design-model="AVI-027" role="img" aria-description={back?`${card.category}. ${card.description}`:undefined} aria-label={`${card.name} — Suprême — ${back?'Verso':'Recto'}`} style={{fontFamily:CARD_FONT}}>
  <div className="concorde-ly concorde-rim"/><div className="concorde-bd concorde-sw"/><div className="concorde-bd concorde-sv"/><div className="concorde-ly concorde-gw"/>
  {!back&&<><div className="concorde-photo" style={box(38,38,554,896)}><div className="concorde-ly concorde-photo-shade"/><div className="concorde-ly concorde-gf"/></div><div className="concorde-name-bg" style={box(158,832,314,70)}/></>}
  {back&&<div className="concorde-back-panel" style={{left:`${BACK_TEXT_AREA.x/360*100}%`,top:`${BACK_TEXT_AREA.y/height*100}%`,width:`${BACK_TEXT_AREA.width/360*100}%`,height:`${BACK_TEXT_AREA.height/504*100}%`}}/>}
  <div className="concorde-co"/><div className="concorde-cg"/><div className="concorde-dr"/>
  <img className="concorde-ly concorde-frame" src="/designs/concorde/frame.png" alt=""/>
  {orbs.filter((_,i)=>!back||i<7).map(([x,y,size,delay],i)=><div key={i} className="concorde-orb" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  <div className="concorde-ec"/>{[25,571].map(x=><div key={x} className="concorde-mp" style={box(x,469,34,34)}><i/></div>)}
  {!back?<div className="concorde-caption" style={box(158,832,314,70)}><div className="concorde-gt concorde-title" data-card-name="true">{card.name}</div><div className="concorde-divider"><i/><b/><i/></div><div className="concorde-motto">ÉCLIPSE SUPERSONIQUE</div></div>:<svg className="concorde-back-text" viewBox={`0 0 360 ${height}`} role="presentation">
   <rect data-back-text-area="true" x={BACK_TEXT_AREA.x} y={BACK_TEXT_AREA.y} width={BACK_TEXT_AREA.width} height={BACK_TEXT_AREA.height*height/504} rx="8" fill="none"/>
   <g fill="#eef4ff"><text x="30" y="77" fontSize={Math.min(20,title.size)} fontWeight="750">{title.lines.map((line,i)=><tspan key={i} x="30" dy={i?23:0}>{line}</tspan>)}</text><text x="30" y="126" fontSize="10" fontWeight="600" fill="#dfe9fb">{textLines(card.category,10,284).slice(0,2).map((line,i)=><tspan key={i} x="30" dy={i?13:0}>{line}</tspan>)}</text><text data-card-description="true" x="32" y="157" fontSize={description.size}>{description.lines.map((line,i)=><tspan key={i} x="32" dy={i?description.size*1.48:0}>{line}</tspan>)}</text><text x="330" y={height-18} textAnchor="end" fontSize="8">{card.code}</text></g>
  </svg>}
  {stars.map(([x,y,size,delay],i)=><div key={i} className="concorde-st" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  <div className="concorde-ly concorde-ho"/><div className="concorde-ly concorde-gl"/><div className="concorde-ly concorde-g2"/>
 </div>;
}
