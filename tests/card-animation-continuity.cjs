const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),ts=require('typescript');
// Isolated test dependency: npm install --prefix .sites-runtime/animation-dom-test --no-save --package-lock=false --ignore-scripts jsdom
const {JSDOM}=require(path.resolve('.sites-runtime/animation-dom-test/node_modules/jsdom'));
const dom=new JSDOM('<!DOCTYPE html><div id="root"></div>',{url:'https://atlas.test'});global.window=dom.window;global.document=dom.window.document;global.HTMLElement=dom.window.HTMLElement;global.cancelAnimationFrame=()=>{};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
const React=require('react'),{createRoot}=require('react-dom/client'),{flushSync}=require('react-dom'),{default:Card}=require(path.resolve('app/components/card-visual.tsx'));
const root=createRoot(document.getElementById('root'));
const designs=Object.assign({},...['archive-supreme','special-edition','nba-supreme','halloween','october-supreme','saint-pierre','remaining-supreme','halloween-walter-rick','fauna-history','champion-jaylen','comics-edition','oct30-provided','oct31-provided'].map(name=>JSON.parse(fs.readFileSync('app/content/'+name+'-designs.json','utf8'))));
let resets=0,writes=0;const descriptor=Object.getOwnPropertyDescriptor(dom.window.Element.prototype,'innerHTML');Object.defineProperty(dom.window.Element.prototype,'innerHTML',{...descriptor,set(value){if(this.classList.contains('archive-native-canvas'))writes++;descriptor.set.call(this,value)}});
const cards=Object.entries(designs).map(([code,d])=>({id:code,code,name:d.slug,universe:d.universe,rarity:d.rarity||'Suprême',rarityStatus:'validated',category:'Animal',description:'Texte conservé'}));
function tick(clock){flushSync(()=>root.render(React.createElement('section',{'data-clock':clock},cards.map(c=>React.createElement(Card,{key:c.id,card:{...c},effects:'animated'})))))}
tick(0);const nodes=[...document.querySelectorAll('.archive-native-canvas')].map(n=>n.firstElementChild);const initialWrites=writes;
for(let t=1;t<=10;t++){tick(t);const current=[...document.querySelectorAll('.archive-native-canvas')];for(let i=0;i<nodes.length;i++)if(current[i].firstElementChild!==nodes[i])resets++}
console.log(JSON.stringify({models:cards.length,clockUpdates:10,initialWrites,repeatedHTMLWrites:writes-initialWrites,restartedArtworkNodes:resets}));
if(process.argv.includes('--expect-reset'))assert(resets>0,'Original implementation must reproduce animation resets');else{assert.equal(resets,0,'Clock and cloned server records must not recreate animated layers');assert.equal(writes,initialWrites,'Unchanged artwork must not rewrite innerHTML');}
flushSync(()=>root.unmount());dom.window.close();
