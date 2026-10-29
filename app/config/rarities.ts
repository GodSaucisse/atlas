// Official editorial colors and the complete visual material palette. No gameplay weights here.
export const RARITIES=['Courante','Inhabituelle','Rare','Précieuse','Légendaire','Suprême','Editions spéciales'] as const;
export type Rarity=typeof RARITIES[number];
export const RARITY_STYLES={
 Courante:{hex:'#8A929D',shadow:'#464E59',light:'#D7DDE4',accent:'#B0BAC6',secondary:'#697480',token:'common',rank:'I',frame:2,finish:'satin',material:'Argent satiné',cadence:0},
 Inhabituelle:{hex:'#278D60',shadow:'#103C2C',light:'#76DEAD',accent:'#53BA87',secondary:'#196747',token:'uncommon',rank:'II',frame:2.6,finish:'emerald',material:'Émeraude polie',cadence:18},
 Rare:{hex:'#347FD0',shadow:'#102D60',light:'#9FD8FF',accent:'#69B8EE',secondary:'#244E9B',token:'rare',rank:'III',frame:3.2,finish:'sapphire',material:'Saphir lumineux',cadence:12},
 Précieuse:{hex:'#9050BF',shadow:'#35134F',light:'#E2AAFF',accent:'#CB85EB',secondary:'#713B9F',token:'precious',rank:'IV',frame:3.8,finish:'amethyst',material:'Améthyste irisée',cadence:10},
 Légendaire:{hex:'#C89B3C',shadow:'#50310F',light:'#FFE7A0',accent:'#E7C576',secondary:'#A16B25',token:'legendary',rank:'V',frame:5,finish:'gold',material:'Or vivant',cadence:8},
 Suprême:{hex:'#C63947',shadow:'#49081F',light:'#FF899D',accent:'#E86AAE',secondary:'#B870EC',spark:'#FFD0E0',token:'supreme',rank:'VI',frame:6,finish:'ruby',material:'Rubis holographique',cadence:7},
 'Editions spéciales':{hex:'#E7C57A',shadow:'#242040',light:'#FFF1C5',accent:'#D8B4FE',secondary:'#AA68D8',spark:'#FFF8E8',token:'special-edition',rank:'É',frame:6,finish:'edition',material:'Édition spéciale',cadence:7},
} as const;
export const COLORS:Record<string,string>=Object.fromEntries(RARITIES.map(r=>[r,RARITY_STYLES[r].hex]));
export function mixHex(a:string,b:string,amount:number){const aa=a.replace('#',''),bb=b.replace('#','');return '#'+[0,2,4].map(i=>Math.round(parseInt(aa.slice(i,i+2),16)*(1-amount)+parseInt(bb.slice(i,i+2),16)*amount).toString(16).padStart(2,'0')).join('');}
export function rarityVariables(){return Object.fromEntries(RARITIES.map(r=>[`--rarity-${RARITY_STYLES[r].token}`,RARITY_STYLES[r].hex]));}
