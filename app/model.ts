export const UNIVERSES = ["Géopolitique", "Géographie", "Histoire", "Animaux", "Militaire", "Aviation", "Fromages", "Chrétienté", "NBA", "Personnages fictifs", "Editions spéciales"] as const;
export {RARITIES,COLORS} from './config/rarities';
export type MotionPreference='system'|'reduced'|'off';
export type RarityFields={rarityStatus:'pending'|'validated';rarityProposal:string|null;rarityProposedBy:string|null;rarityProposedAt:string|null;rarityValidatedBy:string|null;rarityValidatedAt:string|null};
export const EMPTY_RARITY:RarityFields={rarityStatus:'pending',rarityProposal:null,rarityProposedBy:null,rarityProposedAt:null,rarityValidatedBy:null,rarityValidatedAt:null};
export type Card = RarityFields & {id:string;code:string;name:string;universe:string;editionSubjectUniverse?:string;category:string;description:string;learningText?:string;rarity:string|null;imageKey:string;imageFit?:"cover"|"contain";imageCredit:string;imageSource:string;albumIds:string[];status:"draft"|"ready"|"archived"|"deleted";updatedAt:string};
export type Album = {id:string;name:string;universe:string;kind:"general"|"specialized";description:string;status:"active"|"draft"|"deferred"|"deleted";updatedAt:string};
export type Admin = {slot:"owner"|"editor";email:string;userId:string|null;name:string;updatedAt:string};
export type Audit = {id:string;at:string;actorName:string;action:string;entity:string;before:string|null;after:string|null;revision:number};
export type AtlasState = {motion:MotionPreference;boosterPolicy:typeof import('./config/boosters').BOOSTER_POLICY;revision:number;cards:Card[];albums:Album[];admins:Admin[];logs:Audit[];user:{id:string;name:string;email:string;role:"owner"|"editor"}};
export const STATUS:Record<string,string> = {draft:"Brouillon",ready:"Prête",archived:"Archivée",deleted:"Corbeille",active:"Conservé",deferred:"Reporté"};
export const SEEDED = [["AVI-001","Wright Flyer","Légendaire"],["AVI-017","Boeing 747-400","Suprême"],["AVI-026","Airbus A380-800","Suprême"],["AVI-027","Concorde","Suprême"],["AVI-034","Fokker 50","Courante"],["AVI-039","Supermarine Spitfire","Suprême"],["AVI-049","Dassault Mirage III","Légendaire"],["AVI-051","Dassault Rafale","Suprême"],["AVI-054","F-16 Fighting Falcon","Légendaire"],["AVI-072","Boeing B-52","Suprême"],["AVI-094","SR-71 Blackbird","Suprême"],["AVI-098","Robin DR400","Courante"]] as const;
export const SEED_ALBUMS = [["aviation","Aviation","general","active"],["chasse","Avions de chasse","specialized","active"],["ligne","Avions de ligne","specialized","active"],["bombardiers","Bombardiers","specialized","active"],["francais","Avions français","specialized","active"],["helicopteres","Hélicoptères","specialized","active"],["americains","Avions américains","specialized","active"],["sovietiques-russes","Avions soviétiques et russes","specialized","active"],["britanniques","Avions britanniques","specialized","deferred"],["seconde-guerre","Avions de la Seconde Guerre mondiale","specialized","deferred"]] as const;
export function missing(c:Card){return [!c.category&&"catégorie",!c.description&&c.rarity!=="Editions spéciales"&&"description",!c.imageKey&&"illustration",!c.rarity&&"rareté"].filter(Boolean) as string[];}

export function displayRarity(c:Card){return c.rarityStatus==='validated'?c.rarity:c.rarityProposal||c.rarity;}
export function pendingRarity(c:Card){return c.rarityStatus!=='validated'||!!c.rarityProposal;}
export function resolveModelRarity(models:Card[],modelId:string){return displayRarity(models.find(c=>c.id===modelId)||{...EMPTY_RARITY,rarity:null} as Card);}

// Both invited administrators have identical application management rights.
export function canManageAtlas(role:unknown){return role==="owner"||role==="editor";}
