import {COLORS} from '../config/rarities';
import {pendingRarity,type Card} from '../model';
export function RarityBadge({value}:{value:string|null}){return <span className="rarity" data-rarity={value||'unset'} style={{'--rarity':COLORS[value||'']||'var(--rarity-common)'} as React.CSSProperties}><i/>{value||'À définir'}</span>;}
export function RarityValidation({card}:{card:Card}){const pending=pendingRarity(card);return <span className={`validation-badge ${pending?'pending':'validated'}`} title={card.rarityProposal?'Une proposition attend la validation d’un administrateur':card.rarityValidatedAt?`Validée le ${new Date(card.rarityValidatedAt).toLocaleString('fr-FR')}`:'Cette rareté n’est pas encore validée'}>{pending?'À valider':'Validée'}</span>;}
