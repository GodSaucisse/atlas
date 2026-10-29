import type {CSSProperties} from 'react';
import dimensions from './button-dimensions.json';
import {Compass} from 'lucide-react';
import './album-buttons.css';
const art:Record<string,[string,number,number?]>={
'Aviation':['Aviation',.62],'Catholicisme':['Catholicisme',.665],'Chrétienté':['Catholicisme',.665],'Fromages':['Fromages',.64],'Géographie':['Geographie',.67],'Géopolitique':['Geopolitique',.675],'Militaire':['Militaire',.69],'NBA':['NBA',.60],'Personnages fictifs':['Personnages_fictifs',.775],
'Histoire':['Histoire',.63],'Moyen Âge':['Moyen_Age',.72],'Avions français':['Avions_francais',1],'Bombardiers':['Bombardiers',1],'Hélicoptères':['Helicopteres',1],'Avions américains':['Avions_americains',1],'Avions de ligne':['Avions_de_ligne',1],'Avions de chasse':['Avions_de_chasse',1],'Avions soviétiques et russes':['Avions_sovietiques_et_russes',1],
'Antiquité':['Antiquite',.71],'Époque moderne':['Epoque_moderne',.76],'Époque contemporaine':['Epoque_contemporaine',.81],'Grandes batailles':['Grandes_batailles',.76],'Monuments historiques':['Monuments_historiques',.78],'Souverains et dirigeants':['Souverains_et_dirigeants',.79],'Toutes les cartes':['Toutes_les_cartes',1],
'Traités et accords':['Geopo-Traites_et_accords',1,420],
'Territoires disputés':['Geopo-Territoires_disputes',1,420],
'Ressources stratégiques':['Geopo-Ressources_strategiques',1,420],
'Renseignement et espionnage':['Geopo-Renseignements_et_espionnage',1,414],
'Renseignements et espionnage':['Geopo-Renseignements_et_espionnage',1,414],
'Alliances et blocs':['Geopo-Alliance_et_blocs',1,420],
'Alliance et blocs':['Geopo-Alliance_et_blocs',1,420],
'Conflits et crises':['Geopo-Conflits_et_crises',1,420],
'Organisations internationales':['Geopo-Organisations_internationales',1,420],
'États et puissances':['Geopo-Etats_et_puissances',1,420],
'Volcans':['Volcans',1,420],
'Mers et océans':['Mers_et_oceans',1,420],
'Merveilles naturelles':['Merveilles_naturelles',1,420],
'Montagnes et sommets':['Montagnes_et_sommets',1,420],
'Fleuves et lacs':['Fleuves_et_lacs',1,420],
'Déserts':['Deserts',1,420],
'Saints':['Saints',1,420],
'Saints et saintes':['Saints',1,420],
'Fêtes chrétiennes':['Fetes_chretiennes',1,420],
'Bâtiments catholiques':['Batiments_catholiques',1,420],
'Édifices religieux':['Batiments_catholiques',1,420],
'Objets divins':['Objets_divins',1,420],
'Objets Divin':['Objets_divins',1,420],
'Objets et symboles':['Objets_divins',1,420],
'Fromages à pâtes dures':['Fromages_a_pates_dures',1,420],
'Fromage à pates dur':['Fromages_a_pates_dures',1,420],
'Fromages à pâte dure':['Fromages_a_pates_dures',1,420],
'Fromages de chèvre':['Fromages_de_chevre',1,420],
'Fromage de Chèvre':['Fromages_de_chevre',1,420],
"Personnages de manga et animé":["Fictif-Personnages_de_manga_et_anime",1,404],
"Personnages de séries":["Fictif-Personnages_de_series",1,420],
"Personnages de films":["Fictif-Personnages_de_films",1,420],
"Personnages de bande dessinée":["Fictif-Personnages_de_bande_dessinee",1,404],
"Personnages de littérature":["Fictif-Personnages_de_litterature",1,420],
"Personnages de jeux vidéo":["Fictif-Personnages_de_jeux_video",1,420],
"Arrières":["NBA-Arrieres",1,420],
"Pivots":["NBA-Pivots",1,420],
"Meneurs":["NBA-Meneurs",1,420],
"Joueurs actuels NBA":["NBA-Joueurs_actuels_NBA",1,420],
"Ailiers":["NBA-Ailiers",1,420],
"Anciens joueurs NBA":["NBA-Anciens_joueurs_NBA",1,420],
"Équipes NBA":["NBA-Equipes_NBA",1,420],
"Ailiers forts":["NBA-Ailiers_forts",1,420],
"Défense sol-air":["Mili-Defense_sol_air",1,420],
"Véhicules blindés":["Mili-Vehicules_blindes",1,420],
"Forces spéciales":["Mili-Forces_speciales",1,420],
"Unités militaires":["Mili-Unites_militaires",1,420],
"Artillerie":["Mili-Artillerie",1,420]};
const normalize=(name:string)=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').replace(/[-‐‑–—]/g,' ').trim().replace(/\s+/g,' ');
const normalizedArt=Object.fromEntries(Object.entries(art).map(([name,entry])=>[normalize(name),entry]));
const tones:Record<string,string>={Aviation:'#66dcff',Catholicisme:'#ffe0a0',Fromages:'#ffce69',Geographie:'#60e7d3',Geopolitique:'#d98bff',Militaire:'#9ddd7a',NBA:'#ffad71',Personnages_fictifs:'#c592ff',Histoire:'#ffcf75',Volcans:'#ff9168',Mers_et_oceans:'#85c8ff',Merveilles_naturelles:'#dda4ff',Montagnes_et_sommets:'#9ccaff',Fleuves_et_lacs:'#80dafa',Deserts:'#ffd16d',Saints:'#ffdf88',Fetes_chretiennes:'#ffc08b',Batiments_catholiques:'#bda4ff',Objets_divins:'#f6b9ae',Fromages_a_pates_dures:'#ffdc78',Fromages_de_chevre:'#88e0db'};
const labels:Record<string,string>={Catholicisme:'Catholicisme',Batiments_catholiques:'Bâtiments catholiques',Objets_divins:'Objets divins',Fromages_a_pates_dures:'Fromages à pâtes dures',Fromages_de_chevre:'Fromages de chèvre',Fetes_chretiennes:'Fêtes chrétiennes'};
function tone(file:string){if(tones[file])return tones[file];if(/manga/.test(file))return '#ff8fce';if(/films|Meneurs|Artillerie|Joueurs_actuels/.test(file))return '#ffad7e';if(/litterature|bande_dessinee|Anciens|Ailiers_forts|Traites/.test(file))return '#ffdb8c';if(/series|Pivots|Equipes|Defense|Organisations/.test(file))return '#9bbaff';if(/jeux_video|Arrieres|Forces_speciales|Alliance|Renseignements/.test(file))return '#c39aff';if(/Unites|Vehicules/.test(file))return '#aadd78';if(/Ailiers|Ressources/.test(file))return '#81e5d9';return '#a9c7ff'}
export function AlbumArtwork({name,count,total}:{name:string;count?:number;total?:number}){
 const entry=normalizedArt[normalize(name)],file=entry?.[0],height=entry?.[2]||420,width=file?dimensions[file as keyof typeof dimensions]||1400:1400,scale=height/420;
 const label=file?labels[file]||name:name;
 return <span className="album-art unified-album-art" data-artwork={file||'fallback'} style={{'--album-tone':tone(file||'')} as CSSProperties}>
  <span className="unified-album-icon" aria-hidden="true">{file?<svg viewBox={`${130*scale} ${110*scale} ${190*scale} ${200*scale}`} preserveAspectRatio="xMidYMid meet" focusable="false"><image href={`/buttons/Bouton_ATLAS_${file}.png`} width={width} height={height}/></svg>:<Compass/>}</span>
  <span className="unified-album-title" aria-hidden="true">{label}</span>
  {count!==undefined&&<span className="unified-album-count" aria-hidden="true">{count}<span>/</span>{total??0}</span>}
  <span className="sr-only">{label}{count!==undefined?` · ${count}/${total??0}`:''}</span>
 </span>;
}
export function ActionArtwork({name}:{name:'Vendre'|'Echanger'|'Recycler'}){return <span className="action-art"><img src={`/buttons/Bouton_ATLAS_${name}.png`} alt={name==='Echanger'?'Échanger':name}/></span>}
