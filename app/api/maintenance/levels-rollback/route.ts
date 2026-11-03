import {env} from 'cloudflare:workers';
import {db,protectWrite,errorResponse,HttpError} from '../../../server';
import {migrateEconomyPlayers,economyStatus} from '../../../economy-store';
export const dynamic='force-dynamic';
async function allowed(request:Request){const supplied=request.headers.get('X-Atlas-Lottery-Service'),expected=env.ATLAS_LOTTERY_SERVICE_TOKEN;if(!supplied||!expected)return false;const digest=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));const [a,b]=await Promise.all([digest(supplied),digest(expected)]);let different=0;for(let i=0;i<a.length;i++)different|=a[i]^b[i];return different===0;}
export async function GET(request:Request){try{if(!await allowed(request))throw new HttpError(404,'Opération indisponible.');return Response.json(await economyStatus(db()),{headers:{'Cache-Control':'no-store'}});}catch(e){return errorResponse(e);}}
// User-requested rollback only: restore old levels and recover V2 level currency.
// No account creation, XP removal, inventory deletion or booster-price change.
export async function POST(request:Request){try{protectWrite(request);if(!await allowed(request))throw new HttpError(404,'Opération indisponible.');return Response.json({operation:'rollback-level-economy',...await migrateEconomyPlayers(db()),...await economyStatus(db())},{headers:{'Cache-Control':'no-store'}});}catch(e){return errorResponse(e);}}
