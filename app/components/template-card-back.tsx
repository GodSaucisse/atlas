import {useId} from 'react';
import {displayRarity,type Card} from '../model';
import {BACK_TEXT_AREA,CARD_FONT,cardTitle,cardDescription,textLines} from './card-layout';
const THEMES:Record<string,{asset:string;paper:string;ink:string;textureY:number}>={
 Courante:{asset:'common',paper:'#bcc8cf',ink:'#16232b',textureY:777},
 Inhabituelle:{asset:'uncommon',paper:'#044f42',ink:'#f4fff9',textureY:769},
 Rare:{asset:'rare',paper:'#244e82',ink:'#f4f8ff',textureY:771},
 Précieuse:{asset:'precious',paper:'#eee0f5',ink:'#352462',textureY:799},
 Légendaire:{asset:'legendary',paper:'#1b090f',ink:'#fff5f3',textureY:769},
};
export function hasTemplateBack(rarity:string|null){return Boolean(rarity&&THEMES[rarity]);}
// Reuse the recto artwork in edge slices, without its photograph or caption layout.
export default function TemplateCardBack({card}:{card:Card}){
 const rarity=displayRarity(card)||'Courante',theme=THEMES[rarity];const id='back'+useId().replace(/[^a-zA-Z0-9]/g,'');
 const height=972*360/630,title=cardTitle(card.name||'Nom de la carte'),description=cardDescription(card.description||'La description de cette découverte apparaîtra ici.');
 const asset=`/templates/${theme.asset}-v1.png`,url=(s:string)=>`url(#${id}${s})`;
 const slice=(box:string,x:number,y:number,width:number,h:number)=><svg x={x} y={y} width={width} height={h} viewBox={box} preserveAspectRatio="none" overflow="hidden"><image href={asset} width="630" height="972"/></svg>;
 return <svg className="atlas-card-face atlas-template-back" viewBox={`0 0 360 ${height}`} xmlns="http://www.w3.org/2000/svg" role="img" data-side="back" data-layout="text" data-rarity={rarity} aria-labelledby={`${id}title ${id}desc`} fontFamily={CARD_FONT}>
  <title id={`${id}title`}>{`${card.name} — ${rarity} — Verso`}</title><desc id={`${id}desc`}>{`ATLAS. ${rarity.toLocaleUpperCase('fr')}. ${card.category}. ${card.description}`}</desc>
  <defs>
   <clipPath id={`${id}jewel`}>{theme.asset==='uncommon'?<circle cx="180" cy="34" r="17"/>:theme.asset==='precious'?<path d="M180 15L193 34L180 59L167 34Z"/>:<rect x="167" y="21" width="26" height="29" rx="7"/>}</clipPath>
   <clipPath id={`${id}outer`}><rect width="360" height={height} rx="17"/></clipPath>
   <pattern id={`${id}texture`} width="360" height="9" patternUnits="userSpaceOnUse"><svg width="360" height="9" viewBox={`110 ${theme.textureY} 410 8`} preserveAspectRatio="none"><image href={asset} width="630" height="972"/></svg></pattern>
   <linearGradient id={`${id}depth`} x2="1" y2="1"><stop stopColor={theme.paper} stopOpacity=".16"/><stop offset=".5" stopColor={theme.paper} stopOpacity=".05"/><stop offset="1" stopColor={theme.paper} stopOpacity=".35"/></linearGradient>
  </defs>
  <g clipPath={url('outer')}>
   <rect width="360" height={height} fill={theme.paper}/>
   <rect width="360" height={height} fill={url('texture')}/>
   <rect width="360" height={height} fill={url('depth')}/>
   <rect data-back-text-area="true" x={BACK_TEXT_AREA.x} y={BACK_TEXT_AREA.y} width={BACK_TEXT_AREA.width} height={BACK_TEXT_AREA.height*height/504} rx="8" fill={theme.paper} fillOpacity=".12"/>
   <g data-back-recto-artwork="true">
    {slice('0 0 630 63',0,0,360,36)}
    {theme.asset!=='common'&&<g clipPath={url('jewel')}><svg x="165.7" y="18" width="28.6" height="41" viewBox="290 31.5 50 71.75" overflow="hidden"><image href={asset} width="630" height="972"/></svg></g>}
    {slice('0 63 30 637',0,36,17.143,height-66)}
    {slice('600 63 30 637',342.857,36,17.143,height-66)}
    {slice('0 733 630 22',0,height-12.57,360,12.57)}
   </g>
   <g fill={theme.ink}>
    <text x="30" y="77" fontSize={Math.min(20,title.size)} fontWeight="750">{title.lines.map((line,i)=><tspan key={i} x="30" dy={i?23:0}>{line}</tspan>)}</text>
    <text x="30" y="126" fontSize="10" fontWeight="600">{textLines(card.category,10,284).slice(0,2).map((line,i)=><tspan key={i} x="30" dy={i?13:0}>{line}</tspan>)}</text>
    <text data-card-description="true" x="32" y="157" fontSize={description.size}>{description.lines.map((line,i)=><tspan key={i} x="32" dy={i?description.size*1.48:0}>{line}</tspan>)}</text>
    <text x="330" y={height-18} textAnchor="end" fontSize="8" fontWeight="600" letterSpacing="1.1">{card.code}</text>
   </g>
  </g>
 </svg>;
}
