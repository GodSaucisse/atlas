import type {Album,Card} from './model';
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const epochs:Record<string,number[]>={
'Antiquité':[2,3,4,5,12,13,30,31,32,33,34,42,43,49,50,52,53,54,55,62,69,75,76,77,78,79],
'Moyen Âge':[6,9,10,11,24,28,35,36,37,39,40,41,44,46,47,48,58,59,61,63,64,66,71,73,80,81,82,83],
'Époque moderne':[7,8,14,15,23,25,26,38,45,56,57,60,65,67,72,84,85,86,87,88],
'Époque contemporaine':[1,16,17,18,19,20,21,22,27,29,51,68,70,74,89,90,91,92,93,94,95,96,97,98,99,100]};
export function belongs(c:Card,a:Album){if(c.universe!==a.universe||c.status==='deleted'||c.status==='archived')return false;const cat=norm(c.category),text=norm(c.name+' '+c.category+' '+c.description),name=a.name;
if(a.universe==='Animaux')return norm(a.name)===cat;
const patterns:Record<string,RegExp>={
'États et puissances':/etat et puissance/,'Organisations internationales':/organisation internationale/,'Alliances et blocs':/alliance et bloc/,'Traités et accords':/traite et accord/,'Territoires disputés':/territoire et souverainete/,'Renseignement et espionnage':/renseignement|espionnage/,'Ressources stratégiques':/ressource et axe/,'Conflits et crises':/conflit et crise/,
'Montagnes et sommets':/montagne|massif|collines/,'Volcans':/volcan/,'Fleuves et lacs':/fleuve|\blac|chute|cascade/,'Déserts':/desert|dune/,'Îles et archipels':/ile|archipel/,'Mers et océans':/mer|ocean|baie|fjord|lagon|recif/,'Merveilles naturelles':/canyon|gorge|karst|recif|terrasse|foret|glacier|calotte|formation|piliers|falaise|amphitheatre|plateau/,
'Souverains et dirigeants':/souverain|dirigeant|conquerant/,'Monuments historiques':/batiment/,'Grandes batailles':/bataille|siege|operation militaire/,
'Unités militaires':/unite militaire/,'Armes à feu':/arme a feu/,'Chars de combat':/^char$/,'Défense sol-air':/sol-air/,
'Personnages de films':/cinema/,'Personnages de séries':/^serie$/,'Personnages de jeux vidéo':/jeu video/,'Personnages de bande dessinée':/bande dessinee/,'Personnages de littérature':/livre/,'Personnages de manga et animé':/manga|anime/,
'Joueurs actuels NBA':/^joueur nba actuel$/,'Anciens joueurs NBA':/^ancien joueur nba$/,'Équipes NBA':/equipe|franchise/};
if(a.universe==='Histoire'&&epochs[name])return /^HIS-\d+$/.test(c.code)?epochs[name].includes(Number(c.code.split('-')[1])):c.albumIds.includes(a.id);
if(name==='Artillerie')return /caesar|pzh 2000|himars|m270|obusier|lance-roquettes/.test(text);
if(name==='Véhicules blindés')return /vehicule militaire/.test(cat)&&!/caesar|pzh 2000|himars|m270|humvee|jltv/.test(norm(c.name));
if(name==='Forces spéciales')return /unite militaire/.test(cat)&&/forces speciales|operations speciales/.test(text);
if(a.universe==='NBA') {if(name==='Meneurs')return /meneur/.test(text);if(name==='Arrières')return /arriere/.test(text);if(name==='Ailiers forts')return /ailier fort|interieur/.test(text);if(name==='Ailiers')return /ailier/.test(text)&&!/ailier fort/.test(text);if(name==='Pivots')return /pivot/.test(text);}
if(patterns[name])return patterns[name].test(['Renseignement et espionnage','Grandes batailles'].includes(name)?text:cat);
return c.albumIds.includes(a.id);
}
