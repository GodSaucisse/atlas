import {catalogAsset} from '../../../catalog-assets';
import {env} from "cloudflare:workers";
import {authorize,authorizePlayer,errorResponse,HttpError} from "../../../server";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{key:string}>}){try{try{await authorizePlayer(_request)}catch{await authorize()}const {key}=await params;if(!/^[a-f0-9-]{36}\.(png|jpg|webp|gif)$/.test(key))throw new HttpError(404,"Image introuvable.");const edition=catalogAsset(key);if(edition)return Response.redirect(new URL(edition.asset,_request.url).href,302);const image=await env.BUCKET?.get(key);if(!image)throw new HttpError(404,"Image introuvable.");return new Response(image.body,{headers:{"Content-Type":image.httpMetadata?.contentType||"application/octet-stream","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});}catch(e){return errorResponse(e);}}
