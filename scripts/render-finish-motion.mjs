// Vector QA: sample the actual CSS keyframes against the production SVG layers.
// This is a deterministic animated material proof, not a browser recording.
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),wr=createRequire(require.resolve('wrangler/package.json')),mf=createRequire(wr.resolve('miniflare')),sharp=mf('sharp');
const css=await fs.readFile('app/components/card-finishes.css','utf8');
const svg=await fs.readFile('outputs/concorde-design.svg','utf8');
function blockAt(text,start){let depth=1,i=start;while(depth&&i<text.length){if(text[i]==='{')depth++;if(text[i]==='}')depth--;i++;}return text.slice(start,i-1);}
function declarations(text){return Object.fromEntries([...text.matchAll(/([\w-]+)\s*:\s*([^;{}]+)/g)].map(m=>[m[1],m[2].trim()]));}
const frames={};for(const match of css.matchAll(/@keyframes\s+([\w-]+)\s*\{/g)){const body=blockAt(css,match.index+match[0].length);const list=[];for(const m of body.matchAll(/([^{}]+)\{([^{}]+)\}/g)){const d=declarations(m[2]);for(const p of m[1].split(',')){list.push({at:p.trim()==='from'?0:p.trim()==='to'?1:parseFloat(p)/100,...d});}}frames[match[1]]=list.sort((a,b)=>a.at-b.at);}
const animations=[];for(const m of css.matchAll(/\.atlas-card\[data-material="supreme"\] \.(finish-[\w-]+)\{animation:([^}]+)\}/g)){const parts=m[2].trim().split(/\s+/);animations.push({className:m[1],name:parts[0],seconds:parseFloat(parts[1]),reverse:parts.includes('alternate-reverse'),alternate:parts.some(p=>p.startsWith('alternate')),timing:m[2].includes('cubic-bezier')?'cubic':'ease'});}
function ease(t,kind){const x1=kind==='cubic'?.4:.42,y1=0,x2=kind==='cubic'?.3:.58,y2=1;const b=(p,a,b)=>3*(1-p)*(1-p)*p*a+3*(1-p)*p*p*b+p*p*p;let lo=0,hi=1;for(let i=0;i<18;i++){const mid=(lo+hi)/2;if(b(mid,x1,x2)<t)lo=mid;else hi=mid;}return b((lo+hi)/2,y1,y2);}
function mixValue(a,b,t){if(a===undefined)return b;if(b===undefined)return a;let index=0;const nums=[...b.matchAll(/-?\d*\.?\d+/g)].map(m=>Number(m[0]));return a.replace(/-?\d*\.?\d+/g,n=>String(Number(n)+(nums[index++]-Number(n))*t));}
function attrsAt(animation,time){let cycle=Math.floor(time/animation.seconds),p=time/animation.seconds-cycle;const backward=animation.alternate&&cycle%2===1;if(backward!==animation.reverse)p=1-p;const list=frames[animation.name];let left=list[0],right=list.at(-1);for(let i=0;i<list.length-1;i++){if(p>=list[i].at&&p<=list[i+1].at){left=list[i];right=list[i+1];break;}}const ratio=ease((p-left.at)/(right.at-left.at||1),animation.timing);return {opacity:mixValue(left.opacity,right.opacity,ratio),transform:mixValue(left.transform,right.transform,ratio)};}
function staticFrame(time){let result=svg;for(const animation of animations){const a=attrsAt(animation,time);result=result.replace(new RegExp(`<(g|rect)([^>]*class="${animation.className}"[^>]*)>`),(all,tag,attrs)=>{attrs=attrs.replace(/\s(?:opacity|transform)="[^"]*"/g,'');if(a.opacity!==undefined)attrs+=` opacity="${a.opacity}"`;if(a.transform){const svgTransform=a.transform.replaceAll('px','').replaceAll('deg','');attrs+=` transform="translate(180 252) ${svgTransform} translate(-180 -252)"`;}return `<${tag}${attrs}>`;});}return result;}
const width=360,height=504,count=96,step=1/8;const buffers=[];
for(let i=0;i<count;i++){buffers.push(await sharp(Buffer.from(staticFrame(i*step))).resize(width,height).ensureAlpha().raw().toBuffer());if(i%24===0)console.log(`Material vector frame ${i}/${count}`);}
await sharp(Buffer.concat(buffers),{raw:{width,height:height*count,channels:4,pageHeight:height}}).gif({loop:0,delay:125,effort:3,colours:128,dither:.25}).toFile('outputs/supreme-animated.gif');
const stills=await Promise.all([0,3,6,9].map(async(t,i)=>({input:await sharp(Buffer.from(staticFrame(t))).resize(270,378).png().toBuffer(),left:i*290+20,top:20})));
await sharp({create:{width:1160,height:418,channels:4,background:'#eceee6'}}).composite(stills).png().toFile('outputs/supreme-motion-phases.png');
const first=buffers[0],later=buffers[48];let sum=0;for(let i=0;i<first.length;i+=4)sum+=Math.abs(first[i]-later[i])+Math.abs(first[i+1]-later[i+1])+Math.abs(first[i+2]-later[i+2]);
if(sum<100000)throw Error('Motion proof has no perceptible color change');
// The full photograph is above every animated body layer, therefore byte-identical at all phases.
let photoDiff=0;for(let y=90;y<293;y++)for(let x=21;x<339;x++){const p=(y*width+x)*4;for(let c=0;c<3;c++)photoDiff+=Math.abs(first[p+c]-later[p+c]);}
if(photoDiff!==0)throw Error(`Photograph changed under foil: ${photoDiff}`);
console.log(JSON.stringify({animations:animations.length,frames:count,colorDelta:sum,photographDelta:photoDiff,output:'outputs/supreme-animated.gif',note:'SVG/CSS keyframe sampling; not a browser recording'}));
