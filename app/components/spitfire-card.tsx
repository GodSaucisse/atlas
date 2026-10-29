import {type CSSProperties} from 'react';
import {displayRarity,type Card} from '../model';
import {CARD_FONT,BACK_TEXT_AREA,cardTitle,cardDescription,textLines,type CardSide} from './card-layout';
export function isSpitfireSupreme(card:Card){return card.code==='AVI-039'&&card.universe==='Aviation'&&displayRarity(card)==='Suprême';}
const box=(x:number,y:number,w:number,h:number):CSSProperties=>({left:`${x/630*100}%`,top:`${y/972*100}%`,width:`${w/630*100}%`,height:`${h/972*100}%`});
const orbs=[[29,29,12,0],[589,29,12,-.7],[29,931,12,-1.4],[589,931,12,-2.1],[308.5,34.5,13,-1],[37.5,480.5,11,-.4],[581.5,480.5,11,-1.7],[127,862,10,-2.4],[493,862,10,-.9]];
const stars=[[560,150,13,0],[14,300,12,-1.2],[604,680,12,-.6],[12,700,11,-1.9]];
export default function SpitfireCard({card,side='front'}:{card:Card;side?:CardSide}){
 const back=side==='back',title=cardTitle(card.name),description=cardDescription(card.description),height=972*360/630;
 return <div className={`atlas-card-face spitfire-card ${back?'spitfire-back':''}`} data-side={side} data-layout="spitfire-supreme" data-design-model="AVI-039" role="img" aria-description={back?`${card.category}. ${card.description}`:undefined} aria-label={`${card.name} — Suprême — ${back?'Verso':'Recto'}`} style={{fontFamily:CARD_FONT}}>
  <div className="spitfire-ly spitfire-rim"/><div className="spitfire-bd spitfire-sw"/><div className="spitfire-bd spitfire-sv"/><div className="spitfire-ly spitfire-gw"/>
  {!back&&<><div className="spitfire-photo" style={box(38,38,554,896)}><div className="spitfire-ly spitfire-photo-shade"/><div className="spitfire-ly spitfire-gf"/></div><div className="spitfire-name-bg" style={box(158,832,314,70)}/></>}
  {back&&<div className="spitfire-back-panel" style={{left:`${BACK_TEXT_AREA.x/360*100}%`,top:`${BACK_TEXT_AREA.y/height*100}%`,width:`${BACK_TEXT_AREA.width/360*100}%`,height:`${BACK_TEXT_AREA.height/504*100}%`}}/>}
  <div className="spitfire-ly spitfire-tr spitfire-t1"/><div className="spitfire-ly spitfire-tr spitfire-t2"/>
  <img className="spitfire-ly spitfire-frame" src="/designs/spitfire/frame.png" alt=""/>
  {orbs.filter((_,i)=>!back||i<7).map(([x,y,size,delay],i)=><div key={i} className="spitfire-orb" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  {[13,577].map(x=><div key={x} className="spitfire-dl" style={box(x,466,40,40)}><i/></div>)}
  {[[301,30,28],[20,20,16],[582,20,16],[20,924,16],[582,924,16]].map(([x,y,size],i)=><div key={i} className="spitfire-rd" style={box(x,y,size,size)}/>)}
  {!back?<div className="spitfire-caption" style={box(158,832,314,70)}><div className="spitfire-gt spitfire-title" data-card-name="true">{card.name}</div><div className="spitfire-divider"><i/><b/><i/></div><div className="spitfire-motto">BATAILLE D'ANGLETERRE</div></div>:<svg className="spitfire-back-text" viewBox={`0 0 360 ${height}`} role="presentation">
   <rect data-back-text-area="true" x={BACK_TEXT_AREA.x} y={BACK_TEXT_AREA.y} width={BACK_TEXT_AREA.width} height={BACK_TEXT_AREA.height*height/504} rx="8" fill="none"/>
   <g fill="#f0e2c0"><text x="30" y="77" fontSize={Math.min(20,title.size)} fontWeight="750">{title.lines.map((line,i)=><tspan key={i} x="30" dy={i?23:0}>{line}</tspan>)}</text><text x="30" y="126" fontSize="10" fontWeight="600" fill="#e8b84a">{textLines(card.category,10,284).slice(0,2).map((line,i)=><tspan key={i} x="30" dy={i?13:0}>{line}</tspan>)}</text><text data-card-description="true" x="32" y="157" fontSize={description.size}>{description.lines.map((line,i)=><tspan key={i} x="32" dy={i?description.size*1.48:0}>{line}</tspan>)}</text><text x="330" y={height-18} textAnchor="end" fontSize="8">{card.code}</text></g>
  </svg>}
  {stars.map(([x,y,size,delay],i)=><div key={i} className="spitfire-st" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  <div className="spitfire-ly spitfire-ho"/><div className="spitfire-ly spitfire-gl"/><div className="spitfire-ly spitfire-g2"/>
 </div>;
}
