import {authorize,protectWrite,HttpError,errorResponse} from '../../server';
import {importMilitaryCard} from '../../military-import';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{
 protectWrite(request);const actor=await authorize();
 if(!request.headers.get('content-type')?.includes('application/json'))throw new HttpError(415,'Format JSON attendu.');
 const text=await request.text();if(text.length>1000)throw new HttpError(413,'Requête trop volumineuse.');
 let body;try{body=JSON.parse(text);}catch{throw new HttpError(400,'JSON invalide.');}
 if(!body||typeof body!=='object'||Array.isArray(body))throw new HttpError(400,'Requête invalide.');
 return Response.json(await importMilitaryCard(actor,body.index,body.dryRun===true,body.repairImages===true),{headers:{'Cache-Control':'no-store'}});
}catch(e){return errorResponse(e);}}
