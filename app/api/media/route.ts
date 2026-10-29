import {env} from "cloudflare:workers";
import {authorize,errorResponse,protectWrite,HttpError} from "../../server";
export const dynamic="force-dynamic";
export async function POST(request:Request){try{
  protectWrite(request);await authorize();if(Number(request.headers.get("content-length")||0)>8500000)throw new HttpError(413,"Image trop volumineuse (8 Mo maximum).");
  const data=await request.formData();const file=data.get("image");if(!(file instanceof File)||file.size>8000000||file.size<12)throw new HttpError(400,"Choisissez une image de moins de 8 Mo.");
  const bytes=new Uint8Array(await file.arrayBuffer());let mime="";let ext="";
  if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71){mime="image/png";ext="png";}else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255){mime="image/jpeg";ext="jpg";}else if(new TextDecoder().decode(bytes.slice(0,4))==="RIFF"&&new TextDecoder().decode(bytes.slice(8,12))==="WEBP"){mime="image/webp";ext="webp";}else if(new TextDecoder().decode(bytes.slice(0,3))==="GIF"){mime="image/gif";ext="gif";}else throw new HttpError(400,"Formats acceptés : JPG, PNG, WebP ou GIF.");
  if(!env.BUCKET)throw new HttpError(503,"Le stockage d’images n’est pas encore disponible.");const key=`${crypto.randomUUID()}.${ext}`;await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:mime}});return Response.json({key},{headers:{"Cache-Control":"no-store"}});
}catch(e){return errorResponse(e);}}
