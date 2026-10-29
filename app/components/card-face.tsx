import ArchiveSupremeCard,{archiveSupremeDesign} from './archive-supreme-card';
import NapoleonCard,{isNapoleonSupreme} from './napoleon-card';
import MossadCard,{isMossadSupreme} from './mossad-card';
import LouisCard,{isLouisSupreme} from './louis-card';
import CesarCard,{isCesarSupreme} from './cesar-card';
import FranceCard,{isFranceSupreme} from './france-card';
import CiaCard,{isCiaSupreme} from './cia-card';
import ChineCard,{isChineSupreme} from './chine-card';
import CharlemagneCard,{isCharlemagneSupreme} from './charlemagne-card';
import SaintNectaireCard,{isSaintNectaireSupreme} from './nectaire-card';
import RoquefortCard,{isRoquefortSupreme} from './roquefort-card';
import EverestCard,{isEverestSupreme} from './everest-card';
import MarieCard,{isMarieSupreme} from './marie-card';
import ReefCard,{isReefSupreme} from './reef-card';
import ComteCard,{isComteSupreme} from './comte-card';
import CamembertCard,{isCamembertSupreme} from './camembert-card';
import SpitfireCard,{isSpitfireSupreme} from './spitfire-card';
import BlackbirdCard,{isBlackbirdSupreme} from './blackbird-card';
import StukaCard,{isStukaSupreme} from './stuka-card';
import {useId} from 'react';
import RafaleCard,{isRafaleSupreme} from './rafale-card';
import ConcordeCard,{isConcordeSupreme} from './concorde-card';
import B747Card,{isB747Supreme} from './b747-card';
import A380Card,{isA380Supreme} from './a380-card';
import TemplateCardBack,{hasTemplateBack} from './template-card-back';
import UncommonCardFace from './uncommon-card-face';
import LegendaryCardFace from './legendary-card-face';
import CommonCardFace from './common-card-face';
import RareCardFace from './rare-card-face';
import PreciousCardFace from './precious-card-face';
import {cardSummary} from './card-summary';
import {displayRarity,type Card} from '../model';
import {RARITY_STYLES,mixHex,type Rarity} from '../config/rarities';
import {BACK_TEXT_AREA,CARD_FONT,cardTitle,cardDescription,textLines,type CardSide} from './card-layout';
// Shared recto and verso. Existing records, illustrations and rarity decisions stay intact.
export default function CardFace({card,imageHref,side='front'}:{card:Card;imageHref?:string;side?:CardSide}){
 const uid=useId().replace(/[^a-zA-Z0-9]/g,'');const rarity=displayRarity(card),v=RARITY_STYLES[rarity as Rarity]||RARITY_STYLES.Courante;
 const supreme=v.token==='supreme',gold=v.token==='legendary',luxury=supreme||gold,back=side==='back';
 const height=back&&(rarity==='Légendaire'||rarity==='Inhabituelle'||rarity==='Courante'||rarity==='Rare'||rarity==='Précieuse')?972*360/630:504,extra=height-504;
 const url=(n:string)=>`url(#${uid}${n})`,dark=mixHex(v.shadow,'#070b15',.4),ink=mixHex(v.light,'#ffffff',.88);
 const title=cardTitle(card.name||'Nom de la carte'),description=cardDescription(card.description||'La description de cette découverte apparaîtra ici.');
 const photo=imageHref||(card.imageKey?`/api/media/${card.imageKey}`:'');
 const rim=supreme?'M17 3H343L357 17V487L343 501H17L3 487V17Z':`M16 3H344Q357 3 357 16V${488+extra}Q357 ${501+extra} 344 ${501+extra}H16Q3 ${501+extra} 3 ${488+extra}V16Q3 3 16 3Z`;
 const px=14,py=supreme?12:gold?48:80,pw=332,ph=supreme?480:gold?378:206.45;
 const keepWhole=card.imageFit==='contain';
 const summary=cardSummary(card);let miniSize=luxury?10:12;while(miniSize>8&&textLines(summary,miniSize,294).length>2)miniSize-=.5;const miniLines=textLines(summary,miniSize,294).slice(0,2);
 if(archiveSupremeDesign(card))return <ArchiveSupremeCard card={card} side={side}/>;
 if(isNapoleonSupreme(card))return <NapoleonCard card={card} side={side}/>;
 if(isMossadSupreme(card))return <MossadCard card={card} side={side}/>;
 if(isLouisSupreme(card))return <LouisCard card={card} side={side}/>;
 if(isCesarSupreme(card))return <CesarCard card={card} side={side}/>;
 if(isFranceSupreme(card))return <FranceCard card={card} side={side}/>;
 if(isCiaSupreme(card))return <CiaCard card={card} side={side}/>;
 if(isChineSupreme(card))return <ChineCard card={card} side={side}/>;
 if(isCharlemagneSupreme(card))return <CharlemagneCard card={card} side={side}/>;
 if(isSaintNectaireSupreme(card))return <SaintNectaireCard card={card} side={side}/>;
 if(isRoquefortSupreme(card))return <RoquefortCard card={card} side={side}/>;
 if(isEverestSupreme(card))return <EverestCard card={card} side={side}/>;
 if(isMarieSupreme(card))return <MarieCard card={card} side={side}/>;
 if(isReefSupreme(card))return <ReefCard card={card} side={side}/>;
 if(isComteSupreme(card))return <ComteCard card={card} side={side}/>;
 if(isCamembertSupreme(card))return <CamembertCard card={card} side={side}/>;
 if(isSpitfireSupreme(card))return <SpitfireCard card={card} side={side}/>;
 if(isBlackbirdSupreme(card))return <BlackbirdCard card={card} side={side}/>;
 if(isStukaSupreme(card))return <StukaCard card={card} side={side}/>;
 if(isRafaleSupreme(card))return <RafaleCard card={card} side={side}/>;
 if(isConcordeSupreme(card))return <ConcordeCard card={card} side={side}/>;
 if(isB747Supreme(card))return <B747Card card={card} side={side}/>;
 if(isA380Supreme(card))return <A380Card card={card} side={side}/>;
 if(back&&hasTemplateBack(rarity))return <TemplateCardBack card={card}/>;
 if(!back&&rarity==='Inhabituelle')return <UncommonCardFace card={card} imageHref={imageHref}/>;
 if(!back&&rarity==='Légendaire')return <LegendaryCardFace card={card} imageHref={imageHref}/>;
 if(!back&&rarity==='Courante')return <CommonCardFace card={card} imageHref={imageHref}/>;
 if(!back&&rarity==='Précieuse')return <PreciousCardFace card={card} imageHref={imageHref}/>;
 if(!back&&rarity==='Rare')return <RareCardFace card={card} imageHref={imageHref}/>;
 return <svg className="atlas-card-face" viewBox={`0 0 360 ${height}`} xmlns="http://www.w3.org/2000/svg" role="img" data-side={side} data-layout={back?'text':supreme?'full-art':gold?'portrait':'classic'} data-rarity={rarity||'unset'} data-material={v.token} aria-labelledby={`${uid}title ${uid}desc`} fontFamily={CARD_FONT}>
  <title id={`${uid}title`}>{`${card.name||'Carte ATLAS'} — ${rarity||'Rareté à définir'} — ${back?'Verso':'Recto'}`}</title>
  <desc id={`${uid}desc`}>{back?`${card.category}. ${card.description}`:`Illustration et nom de la carte ${card.name}.`}</desc>
  <defs>
   <linearGradient id={`${uid}foil`} x1="0" y1="0" x2="1" y2="1">{[v.shadow,v.hex,v.light,v.hex,v.secondary,'#ffffff',v.hex,v.shadow].map((c,i)=><stop key={i} offset={i/7} stopColor={c}/>)}</linearGradient>
   <linearGradient id={`${uid}body`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={mixHex(v.hex,v.shadow,.35)}/><stop offset=".6" stopColor={v.shadow}/><stop offset="1" stopColor={dark}/></linearGradient>
   <linearGradient id={`${uid}shade`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#080b14" stopOpacity=".04"/><stop offset=".55" stopColor="#080b14" stopOpacity=".05"/><stop offset="1" stopColor="#080b14" stopOpacity=".94"/></linearGradient>
   <linearGradient id={`${uid}topshade`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#080b14" stopOpacity=".85"/><stop offset="1" stopColor="#080b14" stopOpacity="0"/></linearGradient>
   <linearGradient id={`${uid}shine`} x1="0" y1="1" x2="1" y2="0"><stop stopColor={v.light} stopOpacity="0"/><stop offset=".4" stopColor={v.secondary} stopOpacity="0"/><stop offset=".49" stopColor={v.light} stopOpacity=".8"/><stop offset=".52" stopColor="#ffffff" stopOpacity=".8"/><stop offset=".63" stopColor={v.hex} stopOpacity="0"/></linearGradient>
   <pattern id={`${uid}lines`} width="80" height="80" patternUnits="userSpaceOnUse"><path d="M0 80L80 0M-40 80L40 0M40 80L120 0" stroke={v.light} strokeWidth=".5" opacity=".09"/></pattern>
   <clipPath id={`${uid}outer`}><path d={rim}/></clipPath>
   <clipPath id={`${uid}photo`}><rect x={px} y={py} width={pw} height={ph} rx="3"/></clipPath>
   <mask id={`${uid}rimMask`}><path d={rim} stroke="white" strokeWidth="12" fill="none"/><rect x="9" y="9" width="342" height="486" rx="9" stroke="white" strokeWidth="2" fill="none"/></mask>
   <filter id={`${uid}backdrop`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>
  <g clipPath={url('outer')}>
   <path d={rim} fill={url('foil')}/><rect x="10" y="10" width="340" height={484+extra} rx="8" fill={url('body')}/><rect x="10" y="10" width="340" height={484+extra} fill={url('lines')}/>
   {!back&&<>
    <g clipPath={url('photo')} data-photo-format={luxury?'vertical':'landscape'}>
     <rect x={px} y={py} width={pw} height={ph} fill={dark}/>
     {photo?<>{luxury&&keepWhole&&<><image href={photo} x={px-24} y={py-24} width={pw+48} height={ph+48} preserveAspectRatio="xMidYMid slice" filter={url('backdrop')}/><rect x={px} y={py} width={pw} height={ph} fill={v.shadow} opacity=".26"/></>}<image data-main-photo="true" href={photo} x={px} y={py} width={pw} height={ph} preserveAspectRatio={luxury&&!keepWhole?'xMidYMid slice':'xMidYMid meet'}/></>:<text x="180" y={py+ph/2} textAnchor="middle" fontSize="11" fill={ink}>Illustration à ajouter</text>}
     {supreme&&<><rect x={px} y={py+ph*.45} width={pw} height={ph*.55} fill={url('shade')}/><rect x={px} y={py} width={pw} height="82" fill={url('topshade')}/></>}
    </g>
    {!supreme&&<rect x={px} y={py} width={pw} height={ph} rx="3" fill="none" stroke={url('foil')} strokeWidth={gold?3:1.5}/>}
    {!luxury&&<g fill="none" stroke={v.light} opacity=".12"><circle cx="180" cy="416" r="35"/><circle cx="180" cy="416" r="27"/><path d="M180 371V461M135 416H225M155 391L205 441M155 441L205 391"/></g>}
    {!supreme&&<g data-name-panel="true"><rect x="14" y={gold?429:301} width="332" height={gold?63:71} rx="4" fill={dark} fillOpacity=".72"/><path d={`M25 ${gold?432:304}H335`} stroke={v.light} strokeOpacity=".35"/></g>}
    <text data-card-name="true" x="30" y={supreme?(title.lines.length===1?445:419):gold?(title.lines.length===1?452:440):(title.lines.length===1?343:327)} fontSize={gold&&title.lines.length>1?Math.min(title.size,21):title.size} fontWeight="750" letterSpacing="-.55" fill={ink}>{title.lines.map((line,i)=><tspan key={i} x="30" dy={i?(gold&&title.lines.length>1?Math.min(title.size,21):title.size)*1.13:0}>{line}</tspan>)}</text>
    <text data-card-summary="true" x="30" y={supreme?(miniLines.length===1?478:470):gold?(miniLines.length===1?483:477):390} fontSize={miniSize} fill={supreme?'#ffffff':ink}>{miniLines.map((line,i)=><tspan key={i} x="30" dy={i?miniSize*1.25:0}>{line}</tspan>)}</text>
   </>}
   {back&&<>
    <rect data-back-text-area="true" x={BACK_TEXT_AREA.x} y={BACK_TEXT_AREA.y} width={BACK_TEXT_AREA.width} height={BACK_TEXT_AREA.height*height/504} rx="8" fill={dark} fillOpacity=".76" stroke={v.light} strokeOpacity=".16"/>
    <text x="30" y="77" fontSize={Math.min(20,title.size)} fontWeight="750" fill={ink}>{title.lines.map((line,i)=><tspan key={i} x="30" dy={i?23:0}>{line}</tspan>)}</text>
    <text x="30" y="126" fontSize="10" fontWeight="600" fill={v.light}>{textLines(card.category,10,284).slice(0,2).map((line,i)=><tspan key={i} x="30" dy={i?13:0}>{line}</tspan>)}</text>
    <text data-card-description="true" x="32" y="157" fontSize={description.size} fill={ink}>{description.lines.map((line,i)=><tspan key={i} x="32" dy={i?description.size*1.48:0}>{line}</tspan>)}</text>
   </>}
   <g data-card-brand="true" fill={supreme&&!back?'#ffffff':ink}>
    <path d="M24 24l4-7 4 7-4 7Z" fill="none" stroke="currentColor" strokeWidth="1" style={{color:v.light}}/>
    <text x="41" y="28" fontSize="10" fontWeight="650" letterSpacing="3">ATLAS</text>
    <text x="330" y="28" textAnchor="end" fontSize="9" fontWeight="700" letterSpacing="1.4">{rarity?rarity.toLocaleUpperCase('fr'):'À DÉFINIR'}</text>
   </g>
   <text x={!back&&luxury?30:330} y={!back&&luxury?42:486+extra} textAnchor={!back&&luxury?'start':'end'} fontSize="8" fontWeight="600" letterSpacing="1.1" fill={supreme&&!back?'#ffffff':v.light}>{card.code}</text>
   {!back&&card.rarityStatus!=='validated'&&<text x={luxury?330:30} y={luxury?42:486+extra} textAnchor={luxury?'end':'start'} fontSize="7" letterSpacing="1" fill={supreme?'#ffffff':v.light}>À VALIDER</text>}
   <path d={rim} fill="none" stroke={url('foil')} strokeWidth={v.frame}/><rect x="7" y="7" width="346" height={490+extra} rx="8" fill="none" stroke={dark} strokeWidth="1.3"/>
   <path d={`M13 32V14H32M328 14H346V32M13 ${472+extra}V${490+extra}H32M328 ${490+extra}H346V${472+extra}`} fill="none" stroke={v.light} strokeWidth={luxury?1.2:.6}/>
   {luxury&&<g mask={url('rimMask')}><g className="finish-rim-flow"><path d="M-250 504L65 0H460L145 504Z" fill={url('shine')}/></g><g className="finish-prism"><path d={rim} fill="none" stroke={v.secondary} strokeWidth="9" opacity=".3"/></g></g>}
   {supreme&&<><g className="finish-edge" fill="none" stroke={url('shine')} strokeWidth="5"><path d={rim}/></g><g className="finish-glints" fill={v.light}><path d="M12 30l1 7 7 1-7 1-1 7-1-7-7-1 7-1ZM347 449l1 7 7 1-7 1-1 7-1-7-7-1 7-1Z"/></g><path className="finish-reveal-stroke" d={rim} fill="none" stroke={v.light} strokeWidth="3" opacity="0"/></>}
  </g>
 </svg>;
}
