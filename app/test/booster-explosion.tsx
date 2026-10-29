'use client';
import {useId,type CSSProperties} from 'react';
import {Pack} from '../components/booster-studio';
import './booster-explosion.css';

type Point={x:number;y:number};
type Shard={points:Point[];x:number;y:number;z:number;rx:number;ry:number;rz:number;delay:number};
const W=300,H=460,C={x:150,y:230};
const point=(angle:number,fraction:number,jitter=0):Point=>{
 const dx=Math.cos(angle),dy=Math.sin(angle);
 const distance=Math.min((dx>0?W-C.x:C.x)/Math.max(Math.abs(dx),.0001),(dy>0?H-C.y:C.y)/Math.max(Math.abs(dy),.0001));
 return {x:C.x+dx*distance*fraction-dy*jitter,y:C.y+dy*distance*fraction+dx*jitter};
};
// Shared vertices partition the complete wrapper, so fragments keep the original artwork.
const angles=[...Array.from({length:12},(_,i)=>i*Math.PI/6+.065*Math.sin(i*2.7)),...[[0,0],[W,0],[W,H],[0,H]].map(([x,y])=>Math.atan2(y-C.y,x-C.x))].map(a=>(a+Math.PI*2)%(Math.PI*2)).sort((a,b)=>a-b);
const inner=angles.map((a,i)=>point(a,.23+.035*Math.sin(i*2.1),3*Math.cos(i*1.7)));
const middle=angles.map((a,i)=>point(a,.59+.045*Math.cos(i*1.8),5*Math.sin(i*2.3)));
const outside=angles.map(a=>point(a,1));
const triangles:Point[][]=[];
angles.forEach((_,i)=>{
 const next=(i+1)%angles.length;
 triangles.push([C,inner[i],inner[next]]);
 for(const [a,b] of [[inner,middle],[middle,outside]])triangles.push([a[i],b[i],b[next]],[a[i],b[next],a[next]]);
});
const shards:Shard[]=triangles.map((points,i)=>{
 const x=points.reduce((s,p)=>s+p.x,0)/3,y=points.reduce((s,p)=>s+p.y,0)/3;
 const angle=Math.atan2(y-C.y,x-C.x),distance=240+(i*71%260);
 return {points,x:Math.cos(angle)*distance,y:Math.sin(angle)*distance,z:80+(i*43%260),rx:(i%2?1:-1)*(35+i*13%105),ry:(i%3?1:-1)*(25+i*19%120),rz:(i%2?1:-1)*(10+i*7%65),delay:i%7*.012};
});
const polygon=(points:Point[])=>points.map(p=>`${p.x/W*100}% ${p.y/H*100}%`).join(',');
const vertices=(points:Point[])=>points.map(p=>`${p.x},${p.y}`).join(' ');
export const EXPLOSION_READY_MS=2350;
export default function BoosterExplosion({index,label,finished=false}:{index:number;label?:string;finished?:boolean}){
 const id='glass'+useId().replace(/[^a-zA-Z0-9]/g,'');
 if(finished)return null;
 return <div className="fracture-scene" aria-hidden="true">
  <div className="fracture-ambience"/><div className="fracture-flash"/><div className="fracture-pressure"/><div className="fracture-lens"/>
  <div className="fracture-pack-position">
   <div className="fracture-whole"><Pack index={index} label={label}/></div>
   <svg className="fracture-network" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
    <defs><filter id={id} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.1" result="light"/><feMerge><feMergeNode in="light"/><feMergeNode in="light"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${id})`}>
     {angles.map((_,i)=><polyline key={i} className="fracture-ray" pathLength="1" points={vertices([C,inner[i],middle[i],outside[i]])} style={{'--crack-delay':`${.055+i%4*.027}s`} as CSSProperties}/>)}
     {[inner,middle].flatMap((ring,r)=>ring.map((p,i)=><polyline key={`${r}-${i}`} className="fracture-branch" pathLength="1" points={vertices([p,ring[(i+1)%ring.length]])} style={{'--crack-delay':`${.19+r*.07+i%5*.018}s`} as CSSProperties}/>))}
     {inner.map((p,i)=><polyline key={`fork-${i}`} className="fracture-fork" pathLength="1" points={vertices([p,middle[(i+1)%middle.length]])} style={{'--crack-delay':`${.26+i%5*.017}s`} as CSSProperties}/>)}
    </g>
   </svg>
   <div className="fracture-core"/>
   {shards.map((shard,i)=><div key={i} className="fracture-fragment" style={{clipPath:`polygon(${polygon(shard.points)})`,transformOrigin:`${shard.points.reduce((s,p)=>s+p.x,0)/3/W*100}% ${shard.points.reduce((s,p)=>s+p.y,0)/3/H*100}%`,'--shard-x':`${shard.x}px`,'--shard-y':`${shard.y}px`,'--shard-z':`${shard.z}px`,'--shard-rx':`${shard.rx}deg`,'--shard-ry':`${shard.ry}deg`,'--shard-rz':`${shard.rz}deg`,'--shard-delay':`${.59+shard.delay}s`} as CSSProperties}>
    <Pack index={index} label={label}/><svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"><polygon points={vertices(shard.points)} fill="none" stroke="#eaffff" strokeWidth="1.1"/></svg>
   </div>)}
  </div>
  <div className="fracture-sparks">{Array.from({length:44},(_,i)=>{const angle=i*2.399963;const distance=140+i%9*44;return <i key={i} style={{'--spark-x':`${Math.cos(angle)*distance}px`,'--spark-y':`${Math.sin(angle)*distance}px`,'--spark-angle':`${angle}rad`,'--spark-delay':`${.57+i%5*.015}s`} as CSSProperties}/>})}</div>
 </div>;
}
