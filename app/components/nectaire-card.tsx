import {useId,type CSSProperties} from 'react';
import {displayRarity,type Card} from '../model';
import {CARD_FONT,BACK_TEXT_AREA,cardTitle,cardDescription,textLines,type CardSide} from './card-layout';
export function isSaintNectaireSupreme(card:Card){return card.code==='FRO-025'&&card.universe==='Fromages'&&displayRarity(card)==='Suprême';}
const box=(x:number,y:number,w:number,h:number):CSSProperties=>({left:`${x/630*100}%`,top:`${y/972*100}%`,width:`${w/630*100}%`,height:`${h/972*100}%`});
const bubbles=[[120,820,14,0],[210,800,9,-2.5],[420,810,12,-4.2],[500,830,16,-1.3],[300,790,8,-5.6],[80,700,10,-3.3],[550,620,12,-6.4]];
const stars=[[300,40,14,0],[560,230,13,-1.1],[14,330,12,-.5],[604,700,12,-1.7],[12,740,11,-2.2],[160,90,10,-.9],[470,110,10,-1.9]];
export default function SaintNectaireCard({card,side='front'}:{card:Card;side?:CardSide}){
 const uid=useId().replace(/[^a-zA-Z0-9]/g,'');
 const back=side==='back',title=cardTitle(card.name),description=cardDescription(card.description),height=972*360/630;
 return <div className={`atlas-card-face nectaire-card ${back?'nectaire-back':''}`} data-side={side} data-layout="nectaire-supreme" data-design-model="FRO-025" role="img" aria-description={back?`${card.category}. ${card.description}`:undefined} aria-label={`${card.name} — Suprême — ${back?'Verso':'Recto'}`} style={{fontFamily:CARD_FONT}}>
  <div className="nectaire-ly nectaire-rim"/><div className="nectaire-bd nectaire-sw"/><div className="nectaire-bd nectaire-sv"/><div className="nectaire-ly nectaire-gw"/>
  {!back&&<><div className="nectaire-photo" style={box(38,38,554,896)}><div className="nectaire-ly nectaire-photo-shade"/><div className="nectaire-ly nectaire-gf"/>{[[520,0,1],[690,-7,.8],[300,-12,.5]].map(([y,delay,opacity],i)=><div key={i} className="nectaire-ms" style={{top:`${y/896*100}%`,animationDelay:`${delay}s`,opacity}}/>)}</div>
   {bubbles.map(([x,y,size,delay],i)=><div key={i} className="nectaire-bub" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
   {[[60,380,0],[380,640,-3.4],[200,860,-1.7]].map(([x,y,delay],i)=><div key={i} className="nectaire-sh" style={{...box(x,y,80,3),animationDelay:`${delay}s`}}/>)}
   <div className="nectaire-name-bg" style={box(158,832,314,70)}/></>}
  {back&&<div className="nectaire-back-panel" style={{left:`${BACK_TEXT_AREA.x/360*100}%`,top:`${BACK_TEXT_AREA.y/height*100}%`,width:`${BACK_TEXT_AREA.width/360*100}%`,height:`${BACK_TEXT_AREA.height/504*100}%`}}/>}
  {[18,562].map(x=><div key={x} className="nectaire-mg" style={box(x+1,462,48,48)}/>)}
  <div className="nectaire-wh"/>
  {[[14,28],[572,28]].map(([x,y],i)=><svg key={i} className="nectaire-bl" viewBox="0 0 32 40" aria-hidden="true" style={{...box(x,y,44,55),animationDelay:`${-.7*i}s`}}><defs><linearGradient id={`${uid}bell${i}`} x1="0" x2="1"><stop offset="0" stopColor="#7a4c0c"/><stop offset=".35" stopColor="#ffe9a0"/><stop offset=".6" stopColor="#e0a73a"/><stop offset="1" stopColor="#6a3e08"/></linearGradient></defs><path d="M6,31 Q6,13 16,9 Q26,13 26,31 L29.5,34 L2.5,34 Z" fill={`url(#${uid}bell${i})`} stroke="#5a3606" strokeWidth=".8"/><circle cx="16" cy="6" r="3.2" fill="none" stroke="#e0a73a" strokeWidth="1.6"/><circle cx="16" cy="36.5" r="3" fill="#c88a28" stroke="#5a3606" strokeWidth=".6"/></svg>)}
  <img className="nectaire-ly nectaire-frame" src="/designs/nectaire/frame.png" alt=""/>
  {!back?<div className="nectaire-caption" style={box(158,832,314,70)}><div className="nectaire-gt nectaire-title" data-card-name="true">Saint-Nectaire</div><div className="nectaire-divider"><i/><b/><i/></div><div className="nectaire-motto">FROMAGE DES VOLCANS</div></div>:<svg className="nectaire-back-text" viewBox={`0 0 360 ${height}`} role="presentation">
   <rect data-back-text-area="true" x={BACK_TEXT_AREA.x} y={BACK_TEXT_AREA.y} width={BACK_TEXT_AREA.width} height={BACK_TEXT_AREA.height*height/504} rx="8" fill="none"/>
   <g fill="#f1deaa"><text x="30" y="77" fontSize={Math.min(20,title.size)} fontWeight="750">{title.lines.map((line,i)=><tspan key={i} x="30" dy={i?23:0}>{line}</tspan>)}</text><text x="30" y="126" fontSize="10" fontWeight="600" fill="#e8c260">{textLines(card.category,10,284).slice(0,2).map((line,i)=><tspan key={i} x="30" dy={i?13:0}>{line}</tspan>)}</text><text data-card-description="true" x="32" y="157" fontSize={description.size}>{description.lines.map((line,i)=><tspan key={i} x="32" dy={i?description.size*1.48:0}>{line}</tspan>)}</text><text x="330" y={height-18} textAnchor="end" fontSize="8">{card.code}</text></g>
  </svg>}
  {stars.map(([x,y,size,delay],i)=><div key={i} className="nectaire-st" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  <div className="nectaire-ly nectaire-ho"/><div className="nectaire-ly nectaire-gl"/><div className="nectaire-ly nectaire-g2"/>
 </div>;
}
