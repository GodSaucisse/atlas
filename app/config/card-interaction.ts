// Pointer geometry is independent of React and never changes card/catalogue data.
export function cardLightPosition(x:number,y:number,width:number,height:number){
 const clamp=(v:number)=>Math.max(-1,Math.min(1,v));
 const nx=clamp(x/Math.max(width,1)*2-1),ny=clamp(y/Math.max(height,1)*2-1);
 return {rotateX:-ny*5,rotateY:nx*7,lightX:nx*64,lightY:ny*82};
}
