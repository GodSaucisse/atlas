import {authorizePlayer,protectWrite,errorResponse} from '../../server';
import {wheels} from '../../wheels/service';
import {WheelError} from '../../wheels/engine';
import type {WheelKind} from '../../wheels/rules';
export const dynamic='force-dynamic';
const reply=(data:unknown)=>Response.json(data,{headers:{'Cache-Control':'no-store'}});
function fail(e:unknown){return e instanceof WheelError?Response.json({error:e.message},{status:e.status,headers:{'Cache-Control':'no-store',...(e.status===429?{'Retry-After':'2'}:{})}}):errorResponse(e);}
export async function GET(request:Request){try{const actor=await authorizePlayer(request),url=new URL(request.url);return reply(await wheels().snapshot(actor.userId,url.searchParams.get('cursor')||undefined,url.searchParams.get('requestId')||undefined));}catch(error){return fail(error)}}
export async function POST(request:Request){try{protectWrite(request);const actor=await authorizePlayer(request),input=await request.json() as any,service=wheels();let spin;if(input.action==='spin')spin=await service.spin(actor.userId,input.wheel as WheelKind,input.requestId);else if(input.action==='claim')spin=await service.claim(actor.userId,input.spinId,input.theme,input.requestId);else throw new WheelError(400,'Action inconnue.');const {game}=await service.wallet(actor.userId);return reply({spin,balance:game.shards,revision:game.revision});}catch(error){return fail(error)}}
