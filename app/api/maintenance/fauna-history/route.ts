import {env} from 'cloudflare:workers';
import {protectWrite,errorResponse,HttpError} from '../../../server';
import {applyFaunaHistoryMigration,faunaHistoryStatus} from '../../../fauna-history-migration';
export const dynamic='force-dynamic';
async function allowed(request:Request){const expected=env.ATLAS_FAUNA_HISTORY_IMPORT_KEY,supplied=request.headers.get('X-Atlas-Content-Key');if(!expected||!supplied)return false;const digest=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));const [a,b]=await Promise.all([digest(expected),digest(supplied)]);let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;}
export async function POST(request:Request){try{protectWrite(request);if(!await allowed(request))throw new HttpError(404,'Opération indisponible.');await applyFaunaHistoryMigration();return Response.json(await faunaHistoryStatus(),{headers:{'Cache-Control':'no-store'}});}catch(e){return errorResponse(e);}}
export async function GET(request:Request){try{if(!await allowed(request))throw new HttpError(404,'Opération indisponible.');return Response.json(await faunaHistoryStatus(),{headers:{'Cache-Control':'no-store'}});}catch(e){return errorResponse(e);}}
