import {type CSSProperties} from 'react';
import {displayRarity,type Card} from '../model';
import {CARD_FONT,BACK_TEXT_AREA,cardTitle,cardDescription,textLines,type CardSide} from './card-layout';
export function isBlackbirdSupreme(card:Card){return card.code==='AVI-094'&&card.universe==='Aviation'&&displayRarity(card)==='Suprême';}
const box=(x:number,y:number,w:number,h:number):CSSProperties=>({left:`${x/630*100}%`,top:`${y/972*100}%`,width:`${w/630*100}%`,height:`${h/972*100}%`});
const orbs=[[29,29,12,0],[589,29,12,-.7],[29,931,12,-1.4],[589,931,12,-2.1],[308.5,34.5,13,-1],[37.5,480.5,11,-.4],[581.5,480.5,11,-1.7],[127,862,10,-2.4],[493,862,10,-.9]];
const stars=[[560,150,13,0],[14,300,12,-1.2],[604,680,12,-.6],[12,700,11,-1.9]];
export default function BlackbirdCard({card,side='front'}:{card:Card;side?:CardSide}){
 const back=side==='back',title=cardTitle(card.name),description=cardDescription(card.description),height=972*360/630;
 return <div className={`atlas-card-face blackbird-card ${back?'blackbird-back':''}`} data-side={side} data-layout="blackbird-supreme" data-design-model="AVI-094" role="img" aria-description={back?`${card.category}. ${card.description}`:undefined} aria-label={`${card.name} — Suprême — ${back?'Verso':'Recto'}`} style={{fontFamily:CARD_FONT}}>
  <div className="blackbird-ly blackbird-rim"/><div className="blackbird-bd blackbird-sw"/><div className="blackbird-bd blackbird-sv"/><div className="blackbird-ly blackbird-gw"/>
  {!back&&<><div className="blackbird-photo" style={box(38,38,554,896)}><div className="blackbird-ly blackbird-photo-shade"/><div className="blackbird-ly blackbird-gf"/></div><div className="blackbird-name-bg" style={box(158,832,314,70)}/></>}
  {back&&<div className="blackbird-back-panel" style={{left:`${BACK_TEXT_AREA.x/360*100}%`,top:`${BACK_TEXT_AREA.y/height*100}%`,width:`${BACK_TEXT_AREA.width/360*100}%`,height:`${BACK_TEXT_AREA.height/504*100}%`}}/>}
  <div className="blackbird-ly blackbird-tr blackbird-t1"/><div className="blackbird-ly blackbird-tr blackbird-t2"/>
  {!back&&<div className="blackbird-dr"/>}
  <img className="blackbird-ly blackbird-frame" src="/designs/blackbird/frame.png" alt=""/>
  {orbs.filter((_,i)=>!back||i<7).map(([x,y,size,delay],i)=><div key={i} className="blackbird-orb" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  {[13,577].map(x=><div key={x} className="blackbird-dl" style={box(x,466,40,40)}><i/></div>)}
  <div className="blackbird-rdr"/>
  {!back?<div className="blackbird-caption" style={box(158,832,314,70)}><div className="blackbird-gt blackbird-title" data-card-name="true">{card.name}</div><div className="blackbird-divider"><i/><b/><i/></div><div className="blackbird-motto">MACH 3 · STRATOSPHÈRE</div></div>:<svg className="blackbird-back-text" viewBox={`0 0 360 ${height}`} role="presentation">
   <rect data-back-text-area="true" x={BACK_TEXT_AREA.x} y={BACK_TEXT_AREA.y} width={BACK_TEXT_AREA.width} height={BACK_TEXT_AREA.height*height/504} rx="8" fill="none"/>
   <g fill="#e6e9ee"><text x="30" y="77" fontSize={Math.min(20,title.size)} fontWeight="750">{title.lines.map((line,i)=><tspan key={i} x="30" dy={i?23:0}>{line}</tspan>)}</text><text x="30" y="126" fontSize="10" fontWeight="600" fill="#ffd9a0">{textLines(card.category,10,284).slice(0,2).map((line,i)=><tspan key={i} x="30" dy={i?13:0}>{line}</tspan>)}</text><text data-card-description="true" x="32" y="157" fontSize={description.size}>{description.lines.map((line,i)=><tspan key={i} x="32" dy={i?description.size*1.48:0}>{line}</tspan>)}</text><text x="330" y={height-18} textAnchor="end" fontSize="8">{card.code}</text></g>
  </svg>}
  {stars.map(([x,y,size,delay],i)=><div key={i} className="blackbird-st" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  <div className="blackbird-ly blackbird-ho"/><div className="blackbird-ly blackbird-gl"/><div className="blackbird-ly blackbird-g2"/>
 </div>;
}
