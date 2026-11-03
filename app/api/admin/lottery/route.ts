import {authorize,errorResponse,protectWrite,HttpError} from '../../../server';
import {lottery} from '../../../lottery/service';
import {LotteryError} from '../../../lottery/engine';
export const dynamic='force-dynamic';
function fail(e:unknown){if(e instanceof LotteryError)return Response.json({error:e.message},{status:e.status});return errorResponse(e);}
export async function GET(request:Request){try{const a=await authorize(),s=lottery();await s.tick();return Response.json({...await s.snapshot('',true,Number(new URL(request.url).searchParams.get('before'))||undefined),owner:a.slot==='owner',audit:(await s.database.prepare('SELECT at,reason,paused FROM atlas_lottery_admin_audit ORDER BY at DESC LIMIT 100').all()).results},{headers:{'Cache-Control':'no-store'}});}catch(e){return fail(e)}}
export async function POST(request:Request){try{protectWrite(request);const a=await authorize();if(a.slot!=='owner')throw new HttpError(403,'Réservé à l’administrateur principal.');const input=await request.json() as any;if(typeof input.paused!=='boolean')throw new LotteryError(400,'État invalide.');const s=lottery();await s.pause(a.userId,input.paused,input.reason||'');return Response.json({ok:true});}catch(e){return fail(e)}}
