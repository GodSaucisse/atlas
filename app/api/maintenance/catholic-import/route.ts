import {env} from 'cloudflare:workers';
import {protectWrite,HttpError,errorResponse} from '../../../server';
import {importCatholicBatch} from '../../../catholic-import';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{
 protectWrite(request);const key=env.ATLAS_CATHOLIC_IMPORT_KEY,supplied=request.headers.get('X-Atlas-Content-Key');
 if(!key||!supplied||key.length!==supplied.length)throw new HttpError(404,'Opération indisponible.');let mismatch=0;for(let i=0;i<key.length;i++)mismatch|=key.charCodeAt(i)^supplied.charCodeAt(i);if(mismatch)throw new HttpError(404,'Opération indisponible.');
 const text=await request.text();if(new TextEncoder().encode(text).length>2000000)throw new HttpError(413,'Lot limité à 2 Mo.');let body;try{body=JSON.parse(text);}catch{throw new HttpError(400,'JSON invalide.');}
 return Response.json(await importCatholicBatch(body),{headers:{'Cache-Control':'no-store'}});
}catch(e){return errorResponse(e);}}
