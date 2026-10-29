import {useId,type CSSProperties} from 'react';
import {displayRarity,type Card} from '../model';
import {CARD_FONT,BACK_TEXT_AREA,cardTitle,cardDescription,textLines,type CardSide} from './card-layout';
export function isCharlemagneSupreme(card:Card){return card.code==='HIS-006'&&card.universe==='Histoire'&&displayRarity(card)==='Suprême';}
const box=(x:number,y:number,w:number,h:number):CSSProperties=>({left:`${x/630*100}%`,top:`${y/972*100}%`,width:`${w/630*100}%`,height:`${h/972*100}%`});
const bubbles=[[120,820,14,0],[210,800,9,-2.5],[420,810,12,-4.2],[500,830,16,-1.3],[300,790,8,-5.6],[80,700,10,-3.3],[550,620,12,-6.4]];
const stars=[[300,40,14,0],[560,230,13,-1.1],[14,330,12,-.5],[604,700,12,-1.7],[12,740,11,-2.2],[160,90,10,-.9],[470,110,10,-1.9]];
export default function CharlemagneCard({card,side='front'}:{card:Card;side?:CardSide}){
 const uid=useId().replace(/[^a-zA-Z0-9]/g,'');
 const back=side==='back',title=cardTitle(card.name),description=cardDescription(card.description),height=972*360/630;
 return <div className={`atlas-card-face charlemagne-card ${back?'charlemagne-back':''}`} data-side={side} data-layout="charlemagne-supreme" data-design-model="HIS-006" role="img" aria-description={back?`${card.category}. ${card.description}`:undefined} aria-label={`${card.name} — Suprême — ${back?'Verso':'Recto'}`} style={{fontFamily:CARD_FONT}}>
  <div className="charlemagne-ly charlemagne-rim"/><div className="charlemagne-bd charlemagne-sw"/><div className="charlemagne-bd charlemagne-sv"/><div className="charlemagne-ly charlemagne-gw"/>
  {!back&&<><div className="charlemagne-photo" style={box(38,38,554,896)}><div className="charlemagne-ly charlemagne-photo-shade"/><div className="charlemagne-ly charlemagne-gf"/>{[[520,0,1],[690,-7,.8],[300,-12,.5]].map(([y,delay,opacity],i)=><div key={i} className="charlemagne-ms" style={{top:`${y/896*100}%`,animationDelay:`${delay}s`,opacity}}/>)}</div>
   {Array.from({length:14},(_,i)=><i key={i} className="charlemagne-ember" style={{...box(65+(i*79)%490,600+(i*37)%290,6,6),animationDelay:`${-i*.6}s`}}/>)}
   <div className="charlemagne-name-bg" style={box(159,787,312,84)}/></>}
  {back&&<div className="charlemagne-back-panel" style={{left:`${BACK_TEXT_AREA.x/360*100}%`,top:`${BACK_TEXT_AREA.y/height*100}%`,width:`${BACK_TEXT_AREA.width/360*100}%`,height:`${BACK_TEXT_AREA.height/504*100}%`}}/>}

  <div className="charlemagne-wh">✠</div>
  {[[92,58],[494,58]].map(([x,y],i)=><img key={i} className="charlemagne-banner" src="/designs/charlemagne/banner.svg" alt="" style={{...box(x,y,44,72),animationDelay:`${-1.9*i}s`}}/>)}
  {!back&&<img className="charlemagne-crown" src="/designs/charlemagne/crown.svg" alt="" style={box(205,658,220,120)}/>}
  <img className="charlemagne-ly charlemagne-frame" src="/designs/charlemagne/frame.png" alt=""/>
  {!back?<div className="charlemagne-caption" style={box(159,787,312,84)}><div className="charlemagne-gt charlemagne-title" data-card-name="true">Charlemagne</div><div className="charlemagne-divider"><i/><b/><i/></div><div className="charlemagne-motto">PÈRE DE L’EUROPE</div></div>:<svg className="charlemagne-back-text" viewBox={`0 0 360 ${height}`} role="presentation">
   <rect data-back-text-area="true" x={BACK_TEXT_AREA.x} y={BACK_TEXT_AREA.y} width={BACK_TEXT_AREA.width} height={BACK_TEXT_AREA.height*height/504} rx="8" fill="none"/>
   <g fill="#f1deaa"><text x="30" y="77" fontSize={Math.min(20,title.size)} fontWeight="750">{title.lines.map((line,i)=><tspan key={i} x="30" dy={i?23:0}>{line}</tspan>)}</text><text x="30" y="126" fontSize="10" fontWeight="600" fill="#e8c260">{textLines(card.category,10,284).slice(0,2).map((line,i)=><tspan key={i} x="30" dy={i?13:0}>{line}</tspan>)}</text><text data-card-description="true" x="32" y="157" fontSize={description.size}>{description.lines.map((line,i)=><tspan key={i} x="32" dy={i?description.size*1.48:0}>{line}</tspan>)}</text><text x="330" y={height-18} textAnchor="end" fontSize="8">{card.code}</text></g>
  </svg>}
  {stars.map(([x,y,size,delay],i)=><div key={i} className="charlemagne-st" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  <div className="charlemagne-ly charlemagne-ho"/><div className="charlemagne-ly charlemagne-gl"/><div className="charlemagne-ly charlemagne-g2"/>
 </div>;
}
