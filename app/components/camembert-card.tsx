import {type CSSProperties} from 'react';
import {displayRarity,type Card} from '../model';
import {CARD_FONT,BACK_TEXT_AREA,cardTitle,cardDescription,textLines,type CardSide} from './card-layout';
export function isCamembertSupreme(card:Card){return card.code==='FRO-003'&&card.universe==='Fromages'&&displayRarity(card)==='Suprême';}
const box=(x:number,y:number,w:number,h:number):CSSProperties=>({left:`${x/630*100}%`,top:`${y/972*100}%`,width:`${w/630*100}%`,height:`${h/972*100}%`});
const bubbles=[[120,820,14,0],[210,800,9,-2.5],[420,810,12,-4.2],[500,830,16,-1.3],[300,790,8,-5.6],[80,700,10,-3.3],[550,620,12,-6.4]];
const stars=[[300,40,14,0],[560,230,13,-1.1],[14,330,12,-.5],[604,700,12,-1.7],[12,740,11,-2.2],[160,90,10,-.9],[470,110,10,-1.9]];
export default function CamembertCard({card,side='front'}:{card:Card;side?:CardSide}){
 const back=side==='back',title=cardTitle(card.name),description=cardDescription(card.description),height=972*360/630;
 return <div className={`atlas-card-face camembert-card ${back?'camembert-back':''}`} data-side={side} data-layout="camembert-supreme" data-design-model="FRO-003" role="img" aria-description={back?`${card.category}. ${card.description}`:undefined} aria-label={`${card.name} — Suprême — ${back?'Verso':'Recto'}`} style={{fontFamily:CARD_FONT}}>
  <div className="camembert-ly camembert-rim"/><div className="camembert-bd camembert-sw"/><div className="camembert-bd camembert-sv"/><div className="camembert-ly camembert-gw"/>
  {!back&&<><div className="camembert-photo" style={box(38,38,554,896)}><div className="camembert-ly camembert-photo-shade"/><div className="camembert-ly camembert-gf"/></div>
   {bubbles.map(([x,y,size,delay],i)=><div key={i} className="camembert-bub" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
   {[[60,380,0],[380,640,-3.4],[200,860,-1.7]].map(([x,y,delay],i)=><div key={i} className="camembert-sh" style={{...box(x,y,80,3),animationDelay:`${delay}s`}}/>)}
   <div className="camembert-name-bg" style={box(158,832,314,70)}/></>}
  {back&&<div className="camembert-back-panel" style={{left:`${BACK_TEXT_AREA.x/360*100}%`,top:`${BACK_TEXT_AREA.y/height*100}%`,width:`${BACK_TEXT_AREA.width/360*100}%`,height:`${BACK_TEXT_AREA.height/504*100}%`}}/>}
  {[18,562].map(x=><div key={x} className="camembert-ap camembert-gr" style={{...box(x,461,50,50),animationDelay:'-1.2s'}}/>)}
  <div className="camembert-wh"/>
  <img className="camembert-ly camembert-frame" src="/designs/camembert/frame.png" alt=""/>
  {!back?<div className="camembert-caption" style={box(158,832,314,70)}><div className="camembert-gt camembert-title" data-card-name="true">Camembert</div><div className="camembert-divider"><i/><b/><i/></div><div className="camembert-motto">FROMAGE DE NORMANDIE</div></div>:<svg className="camembert-back-text" viewBox={`0 0 360 ${height}`} role="presentation">
   <rect data-back-text-area="true" x={BACK_TEXT_AREA.x} y={BACK_TEXT_AREA.y} width={BACK_TEXT_AREA.width} height={BACK_TEXT_AREA.height*height/504} rx="8" fill="none"/>
   <g fill="#4c2c12"><text x="30" y="77" fontSize={Math.min(20,title.size)} fontWeight="750">{title.lines.map((line,i)=><tspan key={i} x="30" dy={i?23:0}>{line}</tspan>)}</text><text x="30" y="126" fontSize="10" fontWeight="600" fill="#80501b">{textLines(card.category,10,284).slice(0,2).map((line,i)=><tspan key={i} x="30" dy={i?13:0}>{line}</tspan>)}</text><text data-card-description="true" x="32" y="157" fontSize={description.size}>{description.lines.map((line,i)=><tspan key={i} x="32" dy={i?description.size*1.48:0}>{line}</tspan>)}</text><text x="330" y={height-18} textAnchor="end" fontSize="8">{card.code}</text></g>
  </svg>}
  {stars.map(([x,y,size,delay],i)=><div key={i} className="camembert-st" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  <div className="camembert-ly camembert-ho"/><div className="camembert-ly camembert-gl"/><div className="camembert-ly camembert-g2"/>
 </div>;
}
