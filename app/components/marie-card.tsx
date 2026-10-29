import {type CSSProperties} from 'react';
import {displayRarity,type Card} from '../model';
import {CARD_FONT,BACK_TEXT_AREA,cardTitle,cardDescription,textLines,type CardSide} from './card-layout';
export function isMarieSupreme(card:Card){return card.code==='CAT-002'&&card.universe==='Chrétienté'&&displayRarity(card)==='Suprême';}
const box=(x:number,y:number,w:number,h:number):CSSProperties=>({left:`${x/630*100}%`,top:`${y/972*100}%`,width:`${w/630*100}%`,height:`${h/972*100}%`});
const orbs=[[29,29,12,0],[589,29,12,-.7],[29,931,12,-1.4],[589,931,12,-2.1],[308.5,34.5,13,-1],[37.5,480.5,11,-.4],[581.5,480.5,11,-1.7],[127,862,10,-2.4],[493,862,10,-.9]];
const stars=[[560,150,13,0],[14,300,12,-1.2],[604,680,12,-.6],[12,700,11,-1.9]];
export default function MarieCard({card,side='front'}:{card:Card;side?:CardSide}){
 const back=side==='back',title=cardTitle(card.name),description=cardDescription(card.description),height=972*360/630;
 return <div className={`atlas-card-face marie-card ${back?'marie-back':''}`} data-side={side} data-layout="marie-supreme" data-design-model="CAT-002" role="img" aria-description={back?`${card.category}. ${card.description}`:undefined} aria-label={`${card.name} — Suprême — ${back?'Verso':'Recto'}`} style={{fontFamily:CARD_FONT}}>
  <div className="marie-ly marie-rim"/><div className="marie-bd marie-sw"/><div className="marie-bd marie-sv"/><div className="marie-ly marie-gw"/>
  {!back&&<><div className="marie-photo" style={box(38,38,554,896)}><div className="marie-ly marie-photo-shade"/><div className="marie-ly marie-gf"/></div><div className="marie-name-bg" style={box(158,832,314,70)}/></>}
  {back&&<div className="marie-back-panel" style={{left:`${BACK_TEXT_AREA.x/360*100}%`,top:`${BACK_TEXT_AREA.y/height*100}%`,width:`${BACK_TEXT_AREA.width/360*100}%`,height:`${BACK_TEXT_AREA.height/504*100}%`}}/>}
  {!back&&<><div className="marie-mh"/><div className="marie-sh marie-s1"/><div className="marie-sh marie-s2"/></>}
  <img className="marie-ly marie-frame" src="/designs/marie/frame.png" alt=""/>
  {orbs.filter((_,i)=>!back||i<7).map(([x,y,size,delay],i)=><div key={i} className="marie-orb" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  <div className="marie-cm"><i/></div>{[25,571].map(x=><div key={x} className="marie-mp" style={box(x,469,34,34)}><i/></div>)}
  {!back&&[[159,290],[165.1,247.7],[182.8,208.9],[210.8,176.6],[246.7,153.6],[287.7,141.5],[330.3,141.5],[371.3,153.6],[407.2,176.6],[435.2,208.9],[452.9,247.7],[459,290]].map(([x,y],i)=><div key={i} className="marie-sc" style={{...box(x,y,19,19),animationDelay:`${-.25*i}s`}}/>)}
  {!back?<div className="marie-caption" style={box(158,832,314,70)}><div className="marie-gt marie-title" data-card-name="true">Marie, Mère de Jésus</div><div className="marie-divider"><i/><b/><i/></div><div className="marie-motto">VIERGE IMMACULÉE</div></div>:<svg className="marie-back-text" viewBox={`0 0 360 ${height}`} role="presentation">
   <rect data-back-text-area="true" x={BACK_TEXT_AREA.x} y={BACK_TEXT_AREA.y} width={BACK_TEXT_AREA.width} height={BACK_TEXT_AREA.height*height/504} rx="8" fill="none"/>
   <g fill="#dfe9fb"><text x="30" y="77" fontSize={Math.min(20,title.size)} fontWeight="750">{title.lines.map((line,i)=><tspan key={i} x="30" dy={i?23:0}>{line}</tspan>)}</text><text x="30" y="126" fontSize="10" fontWeight="600" fill="#cfdcf5">{textLines(card.category,10,284).slice(0,2).map((line,i)=><tspan key={i} x="30" dy={i?13:0}>{line}</tspan>)}</text><text data-card-description="true" x="32" y="157" fontSize={description.size}>{description.lines.map((line,i)=><tspan key={i} x="32" dy={i?description.size*1.48:0}>{line}</tspan>)}</text><text x="330" y={height-18} textAnchor="end" fontSize="8">{card.code}</text></g>
  </svg>}
  {stars.map(([x,y,size,delay],i)=><div key={i} className="marie-st" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  <div className="marie-ly marie-ho"/><div className="marie-ly marie-gl"/><div className="marie-ly marie-g2"/>
 </div>;
}
