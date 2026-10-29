import {Trophy,LockKeyhole} from 'lucide-react';
import {achievementBadgePath} from '../achievement-badges';
import {ACHIEVEMENTS} from '../progression';
export default function AchievementBadge({id,unlocked=true}:{id:string;unlocked?:boolean}){const src=achievementBadgePath(id,unlocked);return src?<img className="achievement-art" src={src} alt={`${ACHIEVEMENTS[id]} — ${unlocked?'débloqué':'verrouillé'}`} loading="lazy" width={160} height={160}/>:unlocked?<Trophy aria-label={ACHIEVEMENTS[id]}/>:<LockKeyhole aria-label={`${ACHIEVEMENTS[id]} — verrouillé`}/>}
