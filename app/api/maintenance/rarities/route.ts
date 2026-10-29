import {env} from 'cloudflare:workers';
import {protectWrite,errorResponse,HttpError} from '../../../server';
import {applyOfficialPolicy} from '../../../policy';
export const dynamic='force-dynamic';
// Single-purpose operation for this explicitly approved policy, with a separate
// runtime secret. No visitor identity headers, body, SQL or arbitrary changes.
export async function POST(request:Request){try{
 protectWrite(request);const expected=env.ATLAS_POLICY_UPDATE_KEY;const supplied=request.headers.get('X-Atlas-Policy-Key');
 if(!expected||!supplied||expected.length!==supplied.length)throw new HttpError(404,'Opération indisponible.');let mismatch=0;for(let i=0;i<expected.length;i++)mismatch|=expected.charCodeAt(i)^supplied.charCodeAt(i);if(mismatch)throw new HttpError(404,'Opération indisponible.');
 return Response.json(await applyOfficialPolicy(),{headers:{'Cache-Control':'no-store'}});
}catch(e){return errorResponse(e);}}
