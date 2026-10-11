import type { HandoutPage, PaperTextureConfig } from "./schema";
import { PX_PER_IN } from "./schema";

export const TEXTURE_DPI = 150;
export const PAPER_PRESETS: Record<string, { background: string; config: Omit<PaperTextureConfig,"version"|"seed"> }> = {
  "Clean Paper": { background:"#fffdf6", config:{grain:.2,ageing:0,water:0,edgeWear:0} },
  "Cream Stationery": { background:"#f6edda", config:{grain:.28,ageing:.08,water:0,edgeWear:.04} },
  "Aged Parchment": { background:"#ead8b0", config:{grain:.44,ageing:.55,water:.08,edgeWear:.28} },
  "Old Archive Document": { background:"#e4d2ad", config:{grain:.58,ageing:.76,water:.17,edgeWear:.45} },
  "Water-Damaged Paper": { background:"#eee1c5", config:{grain:.42,ageing:.28,water:.78,edgeWear:.2} },
  "Soot and Grime": { background:"#e8dfce", config:{grain:.5,ageing:.32,water:.1,edgeWear:.78} }
};
export function textureConfigForPage(page: Pick<HandoutPage,"id"|"texture"|"textureConfig">): PaperTextureConfig | null {
  if (page.textureConfig) return normalizeTextureConfig(page.textureConfig);
  if (page.texture !== "aged" && page.texture !== "parchment") return null;
  const seed = hashSeed(page.id);
  return { version:1, seed, grain:.32, ageing:page.texture === "aged" ? .62 : .35, water:0, edgeWear:page.texture === "aged" ? .18 : .06 };
}
export function normalizeTextureConfig(value: Partial<PaperTextureConfig> | null | undefined): PaperTextureConfig {
  const clamp=(v:unknown, fallback:number):number=> typeof v === "number" && Number.isFinite(v) ? Math.max(0,Math.min(1,v)) : fallback;
  return { version:1, seed:Number.isFinite(value?.seed)?(value!.seed!>>>0):1, grain:clamp(value?.grain,.25), ageing:clamp(value?.ageing,0), water:clamp(value?.water,0), edgeWear:clamp(value?.edgeWear,0) };
}
function hashSeed(value:string):number { let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0; }
function rng(seed:number):()=>number { let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;}; }
const cache = new Map<string, HTMLCanvasElement>();
export function clearPaperTextureCache():void { cache.clear(); }
export function createPaperTexture(page: Pick<HandoutPage,"id"|"widthIn"|"heightIn"|"background"|"texture"|"textureConfig">, dpi=TEXTURE_DPI):HTMLCanvasElement|null {
  const config=textureConfigForPage(page);if(!config)return null;
  // Bound memory for unusually large custom sheets while keeping ordinary pages at print-quality 150 DPI.
  const renderDpi=Math.min(dpi,Math.sqrt(8_000_000/(page.widthIn*page.heightIn)),6000/Math.max(page.widthIn,page.heightIn));
  const width=Math.max(1,Math.round(page.widthIn*renderDpi)),height=Math.max(1,Math.round(page.heightIn*renderDpi));
  const key=JSON.stringify([page.background,width,height,renderDpi,config]);const hit=cache.get(key);if(hit)return hit;
  const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas texture rendering is unavailable.");
  ctx.fillStyle=page.background;ctx.fillRect(0,0,width,height);const random=rng(config.seed);const scale=renderDpi/PX_PER_IN;
  // Multi-scale luminance grain is generated in document space, so zoom cannot affect it.
  if(config.grain>0){const image=ctx.createImageData(width,height);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;const n=(random()-.5)*config.grain*22;image.data[i]=n<0?0:255;image.data[i+1]=n<0?0:255;image.data[i+2]=n<0?0:255;image.data[i+3]=Math.min(255,Math.abs(n)*8);}const grainCanvas=document.createElement("canvas");grainCanvas.width=width;grainCanvas.height=height;grainCanvas.getContext("2d")!.putImageData(image,0,0);ctx.globalCompositeOperation="soft-light";ctx.drawImage(grainCanvas,0,0);ctx.globalCompositeOperation="source-over";
    const fibers=Math.round(width*height/5200*config.grain);for(let i=0;i<fibers;i++){const x=random()*width,y=random()*height,len=(1+random()*8)*scale;ctx.strokeStyle=random()>.5?`rgba(92,72,48,${.025+random()*.07*config.grain})`:`rgba(255,255,240,${.04+random()*.09*config.grain})`;ctx.lineWidth=Math.max(.35,random()*scale*.65);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(random()*Math.PI)*len,y+Math.sin(random()*Math.PI)*len);ctx.stroke();}}
  if(config.ageing>0){const spots=Math.round(width*height/68000*config.ageing);for(let i=0;i<spots;i++){const x=random()*width,y=random()*height,r=(.25+random()*1.6)*scale;ctx.fillStyle=`rgba(104,61,29,${(.06+random()*.23)*config.ageing})`;ctx.beginPath();ctx.ellipse(x,y,r*(.7+random()),r*(.5+random()),random()*Math.PI,0,Math.PI*2);ctx.fill();}const wash=ctx.createLinearGradient(width*.1,0,width*.9,height);wash.addColorStop(0,`rgba(152,104,45,${.025*config.ageing})`);wash.addColorStop(.5,"rgba(180,130,62,0)");wash.addColorStop(1,`rgba(126,77,33,${.07*config.ageing})`);ctx.fillStyle=wash;ctx.fillRect(0,0,width,height);}
  if(config.water>0){const count=Math.max(2,Math.round(3+config.water*7));for(let i=0;i<count;i++){const cx=random()*width,cy=random()*height,rx=(.07+random()*.2)*width,ry=(.05+random()*.18)*height;ctx.save();ctx.translate(cx,cy);ctx.scale(rx,ry);const grad=ctx.createRadialGradient(0,0,.45,0,0,1);grad.addColorStop(.35,`rgba(107,75,47,${.025*config.water})`);grad.addColorStop(.78,`rgba(125,86,48,${(.09+random()*.08)*config.water})`);grad.addColorStop(.9,`rgba(145,101,55,${.12*config.water})`);grad.addColorStop(1,"rgba(145,101,55,0)");ctx.fillStyle=grad;ctx.beginPath();for(let j=0;j<=40;j++){const a=j/40*Math.PI*2,wiggle=1+(random()-.5)*.14;const x=Math.cos(a)*wiggle,y=Math.sin(a)*wiggle;j?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.restore();}}
  if(config.edgeWear>0){const edge=ctx.createRadialGradient(width*.5,height*.5,Math.min(width,height)*.28,width*.5,height*.5,Math.max(width,height)*.72);edge.addColorStop(0,"rgba(76,49,27,0)");edge.addColorStop(.65,`rgba(76,49,27,${.025*config.edgeWear})`);edge.addColorStop(1,`rgba(53,37,25,${.24*config.edgeWear})`);ctx.fillStyle=edge;ctx.fillRect(0,0,width,height);for(let i=0;i<Math.round(14*config.edgeWear);i++){const edgeSide=Math.floor(random()*4),x=edgeSide<2?random()*width:edgeSide===2?0:width,y=edgeSide>=2?random()*height:edgeSide===0?0:height,r=(4+random()*28)*scale;const smudge=ctx.createRadialGradient(x,y,0,x,y,r);smudge.addColorStop(0,`rgba(50,38,28,${.13*config.edgeWear})`);smudge.addColorStop(1,"rgba(50,38,28,0)");ctx.fillStyle=smudge;ctx.fillRect(x-r,y-r,r*2,r*2);}}
  if(cache.size>=24)cache.delete(cache.keys().next().value!);cache.set(key,canvas);return canvas;
}
