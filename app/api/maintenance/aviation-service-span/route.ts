import {env} from 'cloudflare:workers';
import {protectWrite,errorResponse,HttpError} from '../../../server';
import {correctMilitaryServiceDates} from '../../../aviation-service-span';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{
 protectWrite(request);
 const expected=env.ATLAS_AVIATION_SERVICE_SPAN_KEY,supplied=request.headers.get('X-Atlas-Content-Key');
 if(!expected||!supplied||expected.length!==supplied.length)throw new HttpError(404,'Opération indisponible.');
 let mismatch=0;for(let i=0;i<expected.length;i++)mismatch|=expected.charCodeAt(i)^supplied.charCodeAt(i);if(mismatch)throw new HttpError(404,'Opération indisponible.');
 return Response.json(await correctMilitaryServiceDates(Number(((await request.json()) as {batch?:unknown}).batch)),{headers:{'Cache-Control':'no-store'}});
}catch(e){return errorResponse(e);}}
