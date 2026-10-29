import {useId,type CSSProperties} from 'react';
import {displayRarity,type Card} from '../model';
import {CARD_FONT,BACK_TEXT_AREA,cardTitle,cardDescription,textLines,type CardSide} from './card-layout';
export function isFranceSupreme(card:Card){return card.code==='GEP-004'&&card.universe==='Géopolitique'&&displayRarity(card)==='Suprême';}
const box=(x:number,y:number,w:number,h:number):CSSProperties=>({left:`${x/630*100}%`,top:`${y/972*100}%`,width:`${w/630*100}%`,height:`${h/972*100}%`});
const bubbles=[[120,820,14,0],[210,800,9,-2.5],[420,810,12,-4.2],[500,830,16,-1.3],[300,790,8,-5.6],[80,700,10,-3.3],[550,620,12,-6.4]];
const stars=[[300,40,14,0],[560,230,13,-1.1],[14,330,12,-.5],[604,700,12,-1.7],[12,740,11,-2.2],[160,90,10,-.9],[470,110,10,-1.9]];
export default function FranceCard({card,side='front'}:{card:Card;side?:CardSide}){
 const uid=useId().replace(/[^a-zA-Z0-9]/g,'');
 const back=side==='back',title=cardTitle(card.name),description=cardDescription(card.description),height=972*360/630;
 return <div className={`atlas-card-face france-card ${back?'france-back':''}`} data-side={side} data-layout="france-supreme" data-design-model="GEP-004" role="img" aria-description={back?`${card.category}. ${card.description}`:undefined} aria-label={`${card.name} — Suprême — ${back?'Verso':'Recto'}`} style={{fontFamily:CARD_FONT}}>
  <div className="france-ly france-rim"/><div className="france-bd france-sw"/><div className="france-bd france-sv"/><div className="france-ly france-gw"/>
  {!back&&<><div className="france-photo" style={box(38,38,554,896)}><div className="france-ly france-photo-shade"/><div className="france-ly france-gf"/>{[[520,0,1],[690,-7,.8],[300,-12,.5]].map(([y,delay,opacity],i)=><div key={i} className="france-ms" style={{top:`${y/896*100}%`,animationDelay:`${delay}s`,opacity}}/>)}</div>
   {Array.from({length:12},(_,i)=><img key={i} className="france-lily-fall" src="/designs/france/lily.png" alt="" style={{...box(55+(i*89)%500,-30,14,20),animationDuration:`${15+i}s`,animationDelay:`${-i*1.8}s`}}/>)}
   <div className="france-boat"><i/><b/><u/></div><div className="france-reflections"/>
   {[0,1].map(i=><div key={i} className="france-firework" style={{left:`${25+i*48}%`,top:`${22+i*10}%`,animationDelay:`${-i*3}s`}}>{Array.from({length:18},(_,j)=><i key={j} style={{'--x':`${Math.cos(j*Math.PI/9)*10}cqw`,'--y':`${Math.sin(j*Math.PI/9)*10}cqw`,background:['#2f6bff','#fff','#ff3b4a'][j%3] } as CSSProperties}/>)}</div>)}
   <div className="france-name-bg" style={box(158,789,314,82)}/></>}
  {back&&<div className="france-back-panel" style={{left:`${BACK_TEXT_AREA.x/360*100}%`,top:`${BACK_TEXT_AREA.y/height*100}%`,width:`${BACK_TEXT_AREA.width/360*100}%`,height:`${BACK_TEXT_AREA.height/504*100}%`}}/>}

  <div className="france-wh"/>
  {[[96,60],[490,60]].map(([x,y],i)=><div key={i} className="france-banner" style={{...box(x,y,44,72),animationDelay:`${-1.9*i}s`,background:i?'#c4182a':'#143fc4'}}><img src="/designs/france/lily.png" alt=""/></div>)}
  <img className="france-ly france-frame" src="/designs/france/frame.png" alt=""/>
  {!back?<div className="france-caption" style={box(158,789,314,82)}><div className="france-gt france-title" data-card-name="true">France</div><div className="france-divider"><i/><img src="/designs/france/lily.png" alt=""/><i/></div><div className="france-motto">FILLE AÎNÉE DE L’ÉGLISE</div></div>:<svg className="france-back-text" viewBox={`0 0 360 ${height}`} role="presentation">
   <rect data-back-text-area="true" x={BACK_TEXT_AREA.x} y={BACK_TEXT_AREA.y} width={BACK_TEXT_AREA.width} height={BACK_TEXT_AREA.height*height/504} rx="8" fill="none"/>
   <g fill="#f1deaa"><text x="30" y="77" fontSize={Math.min(20,title.size)} fontWeight="750">{title.lines.map((line,i)=><tspan key={i} x="30" dy={i?23:0}>{line}</tspan>)}</text><text x="30" y="126" fontSize="10" fontWeight="600" fill="#e8c260">{textLines(card.category,10,284).slice(0,2).map((line,i)=><tspan key={i} x="30" dy={i?13:0}>{line}</tspan>)}</text><text data-card-description="true" x="32" y="157" fontSize={description.size}>{description.lines.map((line,i)=><tspan key={i} x="32" dy={i?description.size*1.48:0}>{line}</tspan>)}</text><text x="330" y={height-18} textAnchor="end" fontSize="8">{card.code}</text></g>
  </svg>}
  {stars.map(([x,y,size,delay],i)=><div key={i} className="france-st" style={{...box(x,y,size,size),animationDelay:`${delay}s`}}/>)}
  <div className="france-ly france-ho"/><div className="france-ly france-gl"/><div className="france-ly france-g2"/>
 </div>;
}
