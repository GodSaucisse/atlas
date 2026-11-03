import {authorizePlayer,errorResponse,protectWrite} from '../../server';
import {lottery} from '../../lottery/service';
import {LotteryError,type Kind} from '../../lottery/engine';
export const dynamic='force-dynamic';
const reply=(data:unknown)=>Response.json(data,{headers:{'Cache-Control':'no-store'}});
function fail(e:unknown){if(e instanceof LotteryError)return Response.json({error:e.message},{status:e.status});return errorResponse(e);}
export async function GET(request:Request){try{const a=await authorizePlayer(request),s=lottery();await s.tick();return reply(await s.snapshot(a.userId,false,Number(new URL(request.url).searchParams.get('before'))||undefined));}catch(e){return fail(e)}}
export async function POST(request:Request){try{protectWrite(request);const a=await authorizePlayer(request),input=await request.json() as any,s=lottery();await s.tick();if(input.action==='buy'){if(!['daily','grand'].includes(input.kind))throw new LotteryError(400,'Ticket invalide.');await s.purchase(a.userId,input.kind as Kind,input.requestId);}else if(input.action==='reserve'){await s.reserve(a.userId,input.editionId,input.number,input.requestId);}else throw new LotteryError(400,'Action inconnue.');return reply(await s.snapshot(a.userId));}catch(e){return fail(e)}}
