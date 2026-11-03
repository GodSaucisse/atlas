import {authorize} from '../server';
import {lottery} from '../lottery/service';
export const dynamic='force-dynamic';
const tools=[{name:'lottery_process_due',description:'Traiter les tirages ATLAS échus, attribuer une seule fois les lots et ouvrir les éditions suivantes. Ne change aucune probabilité ni résultat existant.',inputSchema:{type:'object',properties:{},additionalProperties:false}},{name:'lottery_scheduler_status',description:'Vérifier le dernier passage du planificateur et les échéances officielles ATLAS.',inputSchema:{type:'object',properties:{},additionalProperties:false}}];
export async function POST(request:Request){const body=await request.json() as any;const answer=(result:any)=>Response.json({jsonrpc:'2.0',id:body.id??null,result});try{
 if(body.method==='server/discover')return answer({supportedVersions:['2026-07-28'],capabilities:{tools:{}}});
 if(body.method==='initialize')return answer({protocolVersion:'2026-07-28',capabilities:{tools:{}},serverInfo:{name:'ATLAS Loteries',version:'1.0.0'}});
 if(body.method==='tools/list')return answer({tools});if(body.method==='notifications/initialized')return new Response(null,{status:204});
 if(body.method==='tools/call'){const a=await authorize();if(a.slot!=='owner')throw Error('Traitement réservé au propriétaire ATLAS.');const s=lottery();let result:any;if(body.params?.name==='lottery_process_due')result=await s.tick(true);else if(body.params?.name==='lottery_scheduler_status'){await s.ensure();result={control:await s.database.prepare('SELECT paused,reason,scheduler_at FROM atlas_lottery_control WHERE id=1').first(),editions:(await s.database.prepare('SELECT id,kind,closes_at,status,anomaly,processed_at FROM atlas_lottery_editions ORDER BY closes_at DESC LIMIT 6').all()).results};}else throw Error('Outil inconnu.');return answer({content:[{type:'text',text:JSON.stringify(result)}]});}
 return Response.json({jsonrpc:'2.0',id:body.id,error:{code:-32601,message:'Méthode inconnue'}});
 }catch(e){return answer({isError:true,content:[{type:'text',text:e instanceof Error?e.message:'Traitement indisponible'}]});}}
