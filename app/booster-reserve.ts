import type {TestGame} from './test-game-engine';
type Pack=TestGame['packs'][number];
export function isFreeRelay(pack:Pack){return pack.type==='relais'&&pack.source!=='wheel';}
export function freeRelayCount(game:Pick<TestGame,'packs'>){return game.packs.filter(isFreeRelay).length;}
export function packGroupKey(pack:Pack){return pack.type+(pack.type==='relais'&&pack.source==='wheel'?':Gains':pack.theme?':'+pack.theme:'');}
