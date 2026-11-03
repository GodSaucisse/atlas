import {env} from 'cloudflare:workers';
import {protectWrite,errorResponse,HttpError} from '../../../server';
import {applyOct30ProvidedMigration,oct30ProvidedStatus} from '../../../oct30-provided-migration';
export const dynamic='force-dynamic';
// Fixed, idempotent import of the four user-provided models. Reuse the existing
// private service credential; no arbitrary input, account changes or settings.
async function allowed(request:Request){const supplied=request.headers.get('X-Atlas-Content-Key'),expected=env.ATLAS_LOTTERY_SERVICE_TOKEN;if(!supplied||!expected)return false;const digest=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));const [a,b]=await Promise.all([digest(supplied),digest(expected)]);let different=0;for(let i=0;i<a.length;i++)different|=a[i]^b[i];return different===0;}
export async function POST(request:Request){try{protectWrite(request);if(!await allowed(request))throw new HttpError(404,'Opération indisponible.');await applyOct30ProvidedMigration();return Response.json(await oct30ProvidedStatus(),{headers:{'Cache-Control':'no-store'}});}catch(e){return errorResponse(e);}}
export async function GET(request:Request){try{if(!await allowed(request))throw new HttpError(404,'Opération indisponible.');return Response.json(await oct30ProvidedStatus(),{headers:{'Cache-Control':'no-store'}});}catch(e){return errorResponse(e);}}
