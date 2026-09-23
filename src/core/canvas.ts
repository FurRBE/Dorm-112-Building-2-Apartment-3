import Phaser from 'phaser';

/** 贴图超采样倍数：镜头 zoom=2，所以 2 倍分辨率贴图正好 1:1 显示 */
export const SS = 2;

export type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

interface TexDef {
  key: string;
  w: number;
  h: number;
  draw: DrawFn;
}

const defs = new Map<string, TexDef>();

/** 注册一张程序化贴图（宽高为“世界单位”，内部按 SS 倍放大绘制） */
export function define(key: string, w: number, h: number, draw: DrawFn): void {
  defs.set(key, { key, w, h, draw });
}

const sizes = new Map<string, [number, number]>();

/** 贴图的世界尺寸 */
export function sizeOf(key: string): [number, number] {
  const s = sizes.get(key);
  if (!s) return [0, 0];
  return s;
}

export function bakeAllTextures(scene: Phaser.Scene): void {
  for (const d of defs.values()) {
    if (scene.textures.exists(d.key)) scene.textures.remove(d.key);
    const tex = scene.textures.createCanvas(
      d.key,
      Math.ceil(d.w * SS),
      Math.ceil(d.h * SS),
    );
    if (!tex) continue;
    const ctx = tex.getContext();
    ctx.save();
    ctx.scale(SS, SS);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.imageSmoothingEnabled = true;
    d.draw(ctx, d.w, d.h);
    ctx.restore();
    tex.refresh();
    sizes.set(d.key, [d.w, d.h]);
  }
}

/** 按世界尺寸放置一张程序化贴图 */
export function img(
  scene: Phaser.Scene,
  key: string,
  x: number,
  y: number,
  originX = 0.5,
  originY = 0.5,
): Phaser.GameObjects.Image {
  const s = scene.add.image(x, y, key);
  s.setOrigin(originX, originY);
  s.setScale(1 / SS);
  return s;
}

/* ------------------------------------------------------------------ */
/* 颜色工具                                                            */
/* ------------------------------------------------------------------ */

function hex2rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgb2hex(r: number, g: number, b: number): string {
  const f = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${f(r)}${f(g)}${f(b)}`;
}

/** amt > 0 变亮，amt < 0 变暗（-1 ~ 1） */
export function shade(hex: string, amt: number): string {
  const [r, g, b] = hex2rgb(hex);
  if (amt >= 0) {
    return rgb2hex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  }
  const k = 1 + amt;
  return rgb2hex(r * k, g * k, b * k);
}

export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hex2rgb(a);
  const [r2, g2, b2] = hex2rgb(b);
  return rgb2hex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

/** hex -> rgba() 字符串 */
export function rgba(hex: string, a: number): string {
  const [r, g, b] = hex2rgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/** hex -> 0xRRGGBB 数字（给 Phaser 用） */
export function num(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

/* ------------------------------------------------------------------ */
/* 绘图工具                                                            */
/* ------------------------------------------------------------------ */

export function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

export type Paint = string | CanvasGradient | CanvasPattern;

export function fillRr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: Paint,
): void {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}

export type Pt = [number, number];

export function poly(ctx: CanvasRenderingContext2D, pts: Pt[]): void {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
}

export function fillPoly(ctx: CanvasRenderingContext2D, pts: Pt[], color: Paint): void {
  poly(ctx, pts);
  ctx.fillStyle = color;
  ctx.fill();
}

export function fillEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: Paint,
): void {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/** 软阴影：给物件脚底加一圈渐变暗影 */
export function groundShadow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  strength = 0.22,
): void {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
  g.addColorStop(0, `rgba(40,36,28,${strength})`);
  g.addColorStop(0.65, `rgba(40,36,28,${strength * 0.5})`);
  g.addColorStop(1, 'rgba(40,36,28,0)');
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

/** 平面噪声颗粒，让大面积色块不呆板 */
export function grain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  count: number,
  rng: () => number,
  strength = 0.05,
): void {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const px = x + rng() * w;
    const py = y + rng() * h;
    const r = 0.4 + rng() * 1.1;
    ctx.fillStyle = rng() > 0.5 ? `rgba(255,255,255,${strength * rng()})` : `rgba(60,52,38,${strength * rng()})`;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** 确定性随机数，保证每次生成的美术完全一致 */
export function makeRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** 描边工具 */
export function stroke(
  ctx: CanvasRenderingContext2D,
  color: string,
  width: number,
  path: () => void,
): void {
  ctx.save();
  ctx.beginPath();
  path();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}
