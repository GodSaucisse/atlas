import {useId,type CSSProperties} from 'react';
import {displayRarity,type Card} from '../model';
import {CARD_FONT,BACK_TEXT_AREA,cardTitle,cardDescription,textLines,type CardSide} from './card-layout';
export function isB747Supreme(card:Card){return card.code==='AVI-017'&&card.universe==='Aviation'&&displayRarity(card)==='Suprême';}
const box=(x:number,y:number,w:number,h:number):CSSProperties=>({left:`${x/630*100}%`,top:`${y/972*100}%`,width:`${w/630*100}%`,height:`${h/972*100}%`});
const orbs=[[28.5,28.5,13,0],[588.5,28.5,13,-.8],[28.5,930.5,13,-1.6],[588.5,930.5,13,-2.3],[309,37,12,-1.1]];
const turbines=[[26,471,0],[574,471,-2]];
const stars=[[560,14,14,0],[12,520,12,-1.2],[606,300,12,-.6]];
export default function B747Card({card,side='front'}:{card:Card;side?:CardSide}){
 const uid='b747'+useId().replace(/[^a-zA-Z0-9]/g,'');const back=side==='back',title=cardTitle(card.name),description=cardDescription(card.description),height=972*360/630;
 return <div className={`atlas-card-face b747-card ${back?'b747-back':''}`} data-side={side} data-layout="b747-supreme" data-design-model="AVI-017" role="img" aria-description={back?`${card.category}. ${card.description}`:undefined} aria-label={`${card.name} — Suprême — ${back?'Verso':'Recto'}`} style={{fontFamily:CARD_FONT}}>
  <div className="b747-ly b747-rim"/><div className="b747-bd b747-sw"/><div className="b747-bd b747-sv"/><div className="b747-ly b747-gw"/>
  {!back&&<><div className="b747-photo" style={box(38,38,554,896)}><div className="b747-ly b747-photo-shade"/><div className="b747-ly b747-gf"/></div><div className="b747-name-bg" style={box(172,823,286,75)}/></>}
  {back&&<div className="b747-back-panel" style={{left:`${BACK_TEXT_AREA.x/360*100}%`,top:`${BACK_TEXT_AREA.y/height*100}%`,width:`${BACK_TEXT_AREA.width/360*100}%`,height:`${BACK_TEXT_AREA.height/504*100}%`}}/>}
  <img className="b747-ly b747-frame" src="/designs/b747/frame.png" alt=""/>
  {orbs.filter((_,i)=>!back||i<7).map(([x,y,size,delay],i)=><div key={i} className="b747-orb" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  {turbines.map(([x,y,delay],i)=><svg key={i} className="b747-tb" viewBox="-15 -15 30 30" style={{...box(x,y,30,30),animationDelay:`${delay}s`}} aria-hidden="true"><defs><linearGradient id={`${uid}turbine${i}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff6d8"/><stop offset="1" stopColor="#b98a3c"/></linearGradient></defs><circle r="14.5" fill="#0b0a1c"/>{Array.from({length:12},(_,blade)=><path key={blade} d="M0 -3L5 -13L9 -12L4 -2Z" fill={`url(#${uid}turbine${i})`} transform={`rotate(${blade*30})`}/>)}<circle r="3.4" fill="#f6dfa0" stroke="#7a5420" strokeWidth=".6"/></svg>)}
  {!back?<div className="b747-caption" style={box(172,823,286,75)}><div className="b747-gt b747-title" data-card-name="true">{card.name}</div><div className="b747-divider"><i/><b/><i/></div><div className="b747-motto">REINE DES CIEUX</div></div>:<svg className="b747-back-text" viewBox={`0 0 360 ${height}`} role="presentation">
   <rect data-back-text-area="true" x={BACK_TEXT_AREA.x} y={BACK_TEXT_AREA.y} width={BACK_TEXT_AREA.width} height={BACK_TEXT_AREA.height*height/504} rx="8" fill="none"/>
   <g fill="#fff5da"><text x="30" y="77" fontSize={Math.min(20,title.size)} fontWeight="750">{title.lines.map((line,i)=><tspan key={i} x="30" dy={i?23:0}>{line}</tspan>)}</text><text x="30" y="126" fontSize="10" fontWeight="600" fill="#ffd98a">{textLines(card.category,10,284).slice(0,2).map((line,i)=><tspan key={i} x="30" dy={i?13:0}>{line}</tspan>)}</text><text data-card-description="true" x="32" y="157" fontSize={description.size}>{description.lines.map((line,i)=><tspan key={i} x="32" dy={i?description.size*1.48:0}>{line}</tspan>)}</text><text x="330" y={height-18} textAnchor="end" fontSize="8">{card.code}</text></g>
  </svg>}
  {stars.map(([x,y,size,delay],i)=><div key={i} className="b747-st" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  <div className="b747-ly b747-ho"/><div className="b747-ly b747-gl"/><div className="b747-ly b747-g2"/>
 </div>;
}
