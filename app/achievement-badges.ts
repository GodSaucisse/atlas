export const ACHIEVEMENT_BADGES:Record<string,string>={
 'all-universes':'tous-les-univers-explores','first-album':'premier-album-complete','first-pack':'premiere-ouverture','first-supreme':'premiere-supreme','level-50':'legende-atlas',explorer:'explorateur','ten-trades':'dix-echanges-finalises','100-cards':'100-cartes-booster','500-cards':'500-cartes-booster','five-albums':'5-albums-completes',
};
export function achievementBadgePath(id:string,unlocked:boolean){const stem=ACHIEVEMENT_BADGES[id];return stem?`/badges/${stem}${unlocked?'':'-locked'}.png`:null}
