import {authorize,stateFor,errorResponse} from "../../server";
export const dynamic="force-dynamic";
export async function GET(){try{const state=await stateFor(await authorize(),true);return Response.json({format:"atlas-v1",exportedAt:new Date().toISOString(),revision:state.revision,cards:state.cards,albums:state.albums,history:state.logs,boosterPolicy:state.boosterPolicy},{headers:{"Cache-Control":"no-store","Content-Disposition":`attachment; filename="atlas-catalogue-${new Date().toISOString().slice(0,10)}.json"`}});}catch(e){return errorResponse(e);}}
