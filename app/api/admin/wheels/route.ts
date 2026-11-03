import {authorize,errorResponse,HttpError} from '../../../server';
import {wheels} from '../../../wheels/service';
export const dynamic='force-dynamic';
export async function GET(){try{const actor=await authorize();if(actor.slot!=='owner')throw new HttpError(403,'Statistiques réservées à l’administrateur principal.');return Response.json(await wheels().statistics(),{headers:{'Cache-Control':'no-store'}});}catch(error){return errorResponse(error)}}
