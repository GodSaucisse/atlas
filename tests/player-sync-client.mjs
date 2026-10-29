import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const original={fetch:globalThis.fetch,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout,navigator:Object.getOwnPropertyDescriptor(globalThis,'navigator')};
const timers=new Map(),events=new Map(),cleanups=[];let timerId=0,requests=0,concurrent=0,maxConcurrent=0,hold=false,release,backend={game:'g1',hub:'h1'},gameRefreshes=0,hubRefreshes=0;
const on=(name,fn)=>events.set(name,fn),off=name=>events.delete(name);globalThis.window={addEventListener:on,removeEventListener:off};globalThis.document={visibilityState:'visible',addEventListener:on,removeEventListener:off};Object.defineProperty(globalThis,'navigator',{value:{onLine:true},configurable:true});
globalThis.setTimeout=(fn,delay)=>{const id=++timerId;timers.set(id,{fn,delay});return id;};globalThis.clearTimeout=id=>timers.delete(id);globalThis.__syncHookReact={useRef:v=>({current:v}),useEffect:effect=>cleanups.push(effect())};
globalThis.fetch=async url=>{assert.equal(url,'/api/player-sync');requests++;concurrent++;maxConcurrent=Math.max(maxConcurrent,concurrent);if(hold)await new Promise(resolve=>release=resolve);concurrent--;return {ok:true,json:async()=>({...backend})};};
const flush=async()=>{for(let i=0;i<40;i++)await Promise.resolve();},tick=async()=>{const [id,timer]=timers.entries().next().value||[];assert.ok(timer,'one scheduled poll');timers.delete(id);timer.fn();await flush();};
try{
 let source=await fs.readFile('app/player-sync.ts','utf8');source=source.replace("import {useEffect,useRef} from 'react';","const {useEffect,useRef}=globalThis.__syncHookReact;");const mod=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
 mod.usePlayerSync('game',async()=>{gameRefreshes++;return true;});mod.usePlayerSync('hub',async()=>{hubRefreshes++;return true;});await flush();await tick();assert.equal(gameRefreshes,1);assert.equal(hubRefreshes,1);
 for(let i=0;i<3;i++)await tick();assert.equal(gameRefreshes,1);assert.equal(hubRefreshes,1);assert.ok(requests>=4);backend.hub='h2';await tick();assert.equal(hubRefreshes,2);assert.equal(gameRefreshes,1);
 mod.invalidatePlayerSync('hub');await flush();assert.equal(hubRefreshes,3);assert.equal(gameRefreshes,1);
 document.visibilityState='hidden';const before=requests;await tick();assert.equal(requests,before);document.visibilityState='visible';events.get('visibilitychange')();await flush();assert.equal(requests,before+1);
 hold=true;await tick();assert.equal(concurrent,1);const inFlight=requests;events.get('focus')();events.get('online')();assert.equal(requests,inFlight);hold=false;release();await flush();await tick();assert.equal(maxConcurrent,1);
 for(const cleanup of cleanups)cleanup();assert.equal(timers.size,0);assert.equal(events.size,0);
 console.log('PASS client coordinator: one lightweight poll, unchanged data skips full refreshes, scope-only invalidation, no overlap, hidden pause/resume and complete cleanup.');
 // A lost network response must retry the identical action receipt and payload.
 globalThis.setTimeout=fn=>original.setTimeout(fn,0);globalThis.clearTimeout=original.clearTimeout;let bodies=[];globalThis.fetch=async(url,options)=>{bodies.push(options.body);if(bodies.length===1)throw new TypeError('Response lost');return {ok:true};};const requestSource=await fs.readFile('app/player-request.ts','utf8'),request=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(requestSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));await request.playerRequest('/api/player-hub',{action:'message',to:'fixture-only',text:'Offline fixture'});assert.equal(bodies.length,2);assert.equal(bodies[0],bodies[1]);assert.ok(JSON.parse(bodies[0]).requestId);
 console.log('PASS lost-response retry retains the exact same idempotency key and message body. No live message sent.');
}finally{Object.assign(globalThis,{fetch:original.fetch,setTimeout:original.setTimeout,clearTimeout:original.clearTimeout});if(original.navigator)Object.defineProperty(globalThis,'navigator',original.navigator);delete globalThis.window;delete globalThis.document;delete globalThis.__syncHookReact;}
