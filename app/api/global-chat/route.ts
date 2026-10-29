import {authorizePlayer,protectWrite,errorResponse,HttpError} from '../../server';
import {globalMessages,sendGlobalMessage} from '../../global-chat';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function GET(req:Request){try{const actor=await authorizePlayer(req);return Response.json({me:actor.userId,messages:await globalMessages()},{headers})}catch(e){return errorResponse(e)}}
export async function POST(req:Request){try{protectWrite(req);const actor=await authorizePlayer(req);if(!req.headers.get('content-type')?.includes('application/json'))throw new HttpError(415,'Format JSON attendu.');const raw=await req.text();if(raw.length>8000)throw new HttpError(413,'Message trop volumineux.');let input;try{input=JSON.parse(raw)}catch{throw new HttpError(400,'JSON invalide.')}await sendGlobalMessage(actor.userId,input);return Response.json({me:actor.userId,messages:await globalMessages()},{headers})}catch(e){return errorResponse(e)}}
