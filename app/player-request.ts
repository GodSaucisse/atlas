/** Retry a lost response using the same idempotency key; never create a second action. */
export async function playerRequest(url:string,input:Record<string,unknown>){const body=JSON.stringify({...input,requestId:input.requestId||crypto.randomUUID()});let failure:unknown;
 for(let attempt=0;attempt<3;attempt++){try{return await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body});}catch(error){failure=error;if(attempt<2)await new Promise(resolve=>setTimeout(resolve,250*(attempt+1)));}}
 throw failure;
}
