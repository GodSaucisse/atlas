import {type CSSProperties} from 'react';
import {displayRarity,type Card} from '../model';
import {CARD_FONT,BACK_TEXT_AREA,cardTitle,cardDescription,textLines,type CardSide} from './card-layout';
export function isReefSupreme(card:Card){return card.code==='GEO-069'&&card.universe==='Géographie'&&displayRarity(card)==='Suprême';}
const box=(x:number,y:number,w:number,h:number):CSSProperties=>({left:`${x/630*100}%`,top:`${y/972*100}%`,width:`${w/630*100}%`,height:`${h/972*100}%`});
const bubbles=[[120,820,14,0],[210,800,9,-2.5],[420,810,12,-4.2],[500,830,16,-1.3],[300,790,8,-5.6],[80,700,10,-3.3],[550,620,12,-6.4]];
const stars=[[300,40,14,0],[560,230,13,-1.1],[14,330,12,-.5],[604,700,12,-1.7],[12,740,11,-2.2],[160,90,10,-.9],[470,110,10,-1.9]];
const fish=[[0,210,46,22,19,-3,0,0],[1,380,56,26,24,-9,1,0],[2,560,50,23,21,-14,0,0],[3,690,44,21,26,-5,1,0],[4,470,40,19,17,-1,1,0],[2,120,36,17,28,-18,0,0],[0,780,42,20,23,-12,0,0],[1,290,34,16,31,-22,0,1]];
function ReefFish({kind}:{kind:number}){
 const colors=[['#ff9a40','#ff9a40','#ff7a1c'],['#ffd21a','#2a8bff','#1f6bff'],['#ffe85a','#ffe85a','#ffd91a'],['#ff86c4','#ff86c4','#ff4fa8'],['#7ff0ff','#7ff0ff','#25d6e8']][kind];
 return <svg viewBox="0 0 64 30" width="100%" height="100%" aria-hidden="true"><path d="M2 15 L16 5 L16 25 Z" fill={colors[0]}/><path d="M18 6 q14-8 24 0 l-6 4 z" fill={colors[1]}/><ellipse cx="32" cy="15" rx="22" ry="11" fill={colors[2]}/>{kind===0?<path d="M22 5 q-3 10 0 20 M38 7 q-2 8 0 16" stroke="#fff" strokeWidth="3.2" fill="none"/>:kind===1?<path d="M14 15 q16-9 30-2" stroke="#0a1a5a" strokeWidth="3" fill="none"/>:kind===2?<path d="M36 4 v22" stroke="#222" strokeWidth="2.4"/>:kind===3?<path d="M26 5 q-4 10 0 20" stroke="#8b2bd6" strokeWidth="4" fill="none"/>:<path d="M20 15 h24" stroke="#fff" strokeWidth="2" opacity=".7"/>}<ellipse cx="32" cy="10" rx="14" ry="4" fill="#fff" opacity=".28"/><circle cx="47" cy="12.5" r="2.6" fill="#fff"/><circle cx="47.6" cy="12.6" r="1.3" fill="#111"/></svg>;
}
export default function ReefCard({card,side='front'}:{card:Card;side?:CardSide}){
 const back=side==='back',title=cardTitle(card.name),description=cardDescription(card.description),height=972*360/630;
 return <div className={`atlas-card-face reef-card ${back?'reef-back':''}`} data-side={side} data-layout="reef-supreme" data-design-model="GEO-069" role="img" aria-description={back?`${card.category}. ${card.description}`:undefined} aria-label={`${card.name} — Suprême — ${back?'Verso':'Recto'}`} style={{fontFamily:CARD_FONT}}>
  <div className="reef-ly reef-rim"/><div className="reef-bd reef-sw"/><div className="reef-bd reef-sv"/><div className="reef-ly reef-gw"/>
  {!back&&<><div className="reef-photo" style={box(38,38,554,896)}><div className="reef-ly reef-photo-shade"/><div className="reef-ly reef-gf"/><div className="reef-cs"/><div className="reef-cs reef-cs2"/><div className="reef-lr"/></div>
   {bubbles.map(([x,y,size,delay],i)=><div key={i} className="reef-bub" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
   {[[60,380,0],[380,640,-3.4],[200,860,-1.7]].map(([x,y,delay],i)=><div key={i} className="reef-sh" style={{...box(x,y,80,3),animationDelay:`${delay}s`}}/>)}
   <div className="reef-name-bg" style={box(158,832,314,70)}/></>}
  {back&&<div className="reef-back-panel" style={{left:`${BACK_TEXT_AREA.x/360*100}%`,top:`${BACK_TEXT_AREA.y/height*100}%`,width:`${BACK_TEXT_AREA.width/360*100}%`,height:`${BACK_TEXT_AREA.height/504*100}%`}}/>}
  {[18,562].map(x=><div key={x} className="reef-mg" style={box(x+1,462,48,48)}/>)}
  <div className="reef-wh"/>
  {!back&&fish.map(([kind,y,w,h,d,delay,reverse,front],i)=><div key={i} className={`reef-fw ${reverse?'reef-rv':''} ${front?'reef-f12':''}`} style={{top:`${y/972*100}%`,width:`${w/630*100}%`,height:`${h/972*100}%`,'--reef-duration':`${d}s`,animationDelay:`${delay}s`} as CSSProperties}><ReefFish kind={kind}/></div>)}
  <img className="reef-ly reef-frame" src="/designs/reef/frame.png" alt=""/>
  {!back?<div className="reef-caption" style={box(158,832,314,70)}><div className="reef-gt reef-title" data-card-name="true">Grande Barrière de Corail</div><div className="reef-divider"><i/><b/><i/></div><div className="reef-motto">MERVEILLE DU PACIFIQUE</div></div>:<svg className="reef-back-text" viewBox={`0 0 360 ${height}`} role="presentation">
   <rect data-back-text-area="true" x={BACK_TEXT_AREA.x} y={BACK_TEXT_AREA.y} width={BACK_TEXT_AREA.width} height={BACK_TEXT_AREA.height*height/504} rx="8" fill="none"/>
   <g fill="#c9f6ff"><text x="30" y="77" fontSize={Math.min(20,title.size)} fontWeight="750">{title.lines.map((line,i)=><tspan key={i} x="30" dy={i?23:0}>{line}</tspan>)}</text><text x="30" y="126" fontSize="10" fontWeight="600" fill="#9ff0ff">{textLines(card.category,10,284).slice(0,2).map((line,i)=><tspan key={i} x="30" dy={i?13:0}>{line}</tspan>)}</text><text data-card-description="true" x="32" y="157" fontSize={description.size}>{description.lines.map((line,i)=><tspan key={i} x="32" dy={i?description.size*1.48:0}>{line}</tspan>)}</text><text x="330" y={height-18} textAnchor="end" fontSize="8">{card.code}</text></g>
  </svg>}
  {stars.map(([x,y,size,delay],i)=><div key={i} className="reef-st" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  <div className="reef-ly reef-ho"/><div className="reef-ly reef-gl"/><div className="reef-ly reef-g2"/>
 </div>;
}
