import { C } from '../core/palette';
import {
  define,
  fillEllipse,
  fillPoly,
  fillRr,
  groundShadow,
  poly,
  rgba,
  shade,
} from '../core/canvas';
import { DORM } from '../world/layout';

/** 金属管件渐变 */
function metalG(
  ctx: CanvasRenderingContext2D,
  x: number,
  w: number,
  light: string = C.metalLight,
  mid: string = C.metal,
  dark: string = C.metalDark,
): CanvasGradient {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, light);
  g.addColorStop(0.35, mid);
  g.addColorStop(1, dark);
  return g;
}

/* ------------------------------------------------------------------ */
/* 床铺与桌柜：拆成若干“面片”，各自按 y 排序，                    */
/* 这样人坐在床上 / 站在桌边时遮挡关系才是对的。                        */
/* ------------------------------------------------------------------ */

const UW = DORM.rowL.w; // 124
/** 上铺床垫（顶面）——放在最底层，人可以叠在上面 */
define('bunkSlab', UW, 162, (ctx, w, h) => {
  // 床比整排窄一圈，露出地板，一眼能看出是“家具”而不是墙/窗
  const bx = 15;
  const bw = w - 30;
  ctx.save();
  ctx.translate(bx, 0);
  // 床架外侧留一点金属，颜色压暗，避免看起来像窗框
  ctx.fillStyle = metalG(ctx, 0, bw, C.metal, shade(C.metal, -0.14), shade(C.metalDark, -0.2));
  ctx.fillRect(0, 0, bw, h);
  ctx.fillStyle = rgba('#ffffff', 0.16);
  ctx.fillRect(0, 0, bw, 1.6);
  ctx.fillStyle = rgba('#000000', 0.2);
  ctx.fillRect(0, h - 3, bw, 3);

  // 床垫本体：留出边框 + 内侧落影，看起来是一个有厚度的软垫
  ctx.fillStyle = rgba('#4a4132', 0.3);
  fillRr(ctx, 3, 3, bw - 6, h - 6, 8, rgba('#4a4132', 0.3));
  const mg = ctx.createLinearGradient(3, 4, 3, h - 4);
  mg.addColorStop(0, shade(C.clothWhite, 0.06));
  mg.addColorStop(0.45, C.clothWhite);
  mg.addColorStop(1, C.clothWhite2);
  fillRr(ctx, 4, 4, bw - 8, h - 9, 7, mg);
  // 床垫上的一圈绗缝
  ctx.strokeStyle = rgba('#b9b2a0', 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(10, 40);
  ctx.lineTo(bw - 10, 40);
  ctx.stroke();

  // 枕头（窄一点，带褶皱）
  ctx.save();
  ctx.translate(bw / 2, 22);
  ctx.rotate(-0.04);
  fillRr(ctx, -(bw - 46) / 2, -12, bw - 46, 24, 9, C.pillow);
  fillRr(ctx, -(bw - 54) / 2, -9, bw - 54, 8, 4, rgba('#ffffff', 0.5));
  ctx.strokeStyle = rgba('#c9c2ae', 0.6);
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-(bw - 52) / 2, 3);
  ctx.quadraticCurveTo(0, 6, (bw - 52) / 2, 2);
  ctx.stroke();
  // 枕头下的阴影
  ctx.fillStyle = rgba('#8b8474', 0.22);
  ctx.beginPath();
  ctx.ellipse(0, 13, (bw - 44) / 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 被子：盖住下半张床，带翻折的被角和柔和的褶皱
  const bg = ctx.createLinearGradient(0, 54, 0, h - 4);
  bg.addColorStop(0, shade(C.blanket, 0.24));
  bg.addColorStop(0.4, C.blanket);
  bg.addColorStop(1, C.blanket2);
  ctx.fillStyle = bg;
  poly(ctx, [
    [6, 58],
    [bw - 5, 54],
    [bw - 4, h - 9],
    [5, h - 5],
  ]);
  ctx.fill();
  // 翻折的被角
  ctx.fillStyle = rgba('#ffffff', 0.3);
  poly(ctx, [
    [6, 58],
    [bw - 5, 54],
    [bw - 5, 68],
    [6, 72],
  ]);
  ctx.fill();
  // 折边下的暗缝
  ctx.strokeStyle = rgba('#5d6a72', 0.4);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(7, 71);
  ctx.quadraticCurveTo(bw / 2, 74, bw - 6, 68);
  ctx.stroke();
  // 柔和的褶皱（曲线，避免看起来像玻璃或地板）
  ctx.lineWidth = 1.2;
  for (let i = 1; i <= 3; i++) {
    const y0 = 78 + i * 20;
    ctx.strokeStyle = rgba('#6b7880', 0.32);
    ctx.beginPath();
    ctx.moveTo(9, y0);
    ctx.quadraticCurveTo(bw * 0.5, y0 + (i % 2 ? 7 : -6), bw - 9, y0 + 2);
    ctx.stroke();
    ctx.strokeStyle = rgba('#ffffff', 0.16);
    ctx.beginPath();
    ctx.moveTo(9, y0 + 3);
    ctx.quadraticCurveTo(bw * 0.5, y0 + 10 + (i % 2 ? 7 : -6), bw - 9, y0 + 5);
    ctx.stroke();
  }
  // 被子下摆的厚度
  ctx.fillStyle = rgba('#5f6b73', 0.35);
  poly(ctx, [
    [5, h - 5],
    [bw - 4, h - 9],
    [bw - 4, h - 4],
    [5, h - 1],
  ]);
  ctx.fill();

  // 蚊帐：靠走道一侧压下来的一角白纱
  ctx.save();
  ctx.globalAlpha = 0.38;
  const netG = ctx.createLinearGradient(w * 0.5, 0, w, 0);
  netG.addColorStop(0, rgba('#ffffff', 0.42));
  netG.addColorStop(0.5, rgba('#f2f6f7', 0.2));
  netG.addColorStop(1, rgba('#dfe6e8', 0.34));
  ctx.fillStyle = netG;
  poly(ctx, [
    [bw * 0.56, 2],
    [bw - 2, 2],
    [bw - 2, h - 40],
    [bw * 0.66, h - 8],
    [bw * 0.58, h * 0.5],
  ]);
  ctx.fill();
  ctx.strokeStyle = rgba('#ffffff', 0.4);
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(bw * (0.6 + i * 0.13), 4);
    ctx.quadraticCurveTo(bw * (0.66 + i * 0.13), h * 0.5, bw * (0.62 + i * 0.13), h - 14);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
});

/** 上铺南侧的横梁 + 床下阴影 */
define('bunkRailS', UW, 18, (ctx, w, h) => {
  ctx.fillStyle = metalG(ctx, 15, w - 30);
  ctx.fillRect(15, 0, w - 30, 9);
  ctx.fillStyle = rgba('#ffffff', 0.35);
  ctx.fillRect(15, 0, w - 30, 1.6);
  ctx.fillStyle = rgba('#000000', 0.16);
  ctx.fillRect(15, 7, w - 30, 2);
  const ug = ctx.createLinearGradient(0, 9, 0, h);
  ug.addColorStop(0, rgba('#332c20', 0.4));
  ug.addColorStop(1, rgba('#332c20', 0));
  ctx.fillStyle = ug;
  ctx.fillRect(17, 9, w - 34, h - 9);
});

/** 桌 + 绿柜（一个面片，正面朝南） */
define('deskUnit', UW, 108, (ctx, w, h) => {
  const dh = 72; // 桌面进深
  /* ---- 桌面 ---- */
  const dg = ctx.createLinearGradient(0, 0, 0, dh);
  dg.addColorStop(0, C.woodLight);
  dg.addColorStop(0.55, C.wood);
  dg.addColorStop(1, shade(C.wood, -0.1));
  ctx.fillStyle = dg;
  ctx.fillRect(0, 0, w, dh);
  ctx.strokeStyle = rgba(C.woodDark, 0.2);
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 5; i++) {
    const y = 8 + i * 14;
    ctx.beginPath();
    ctx.moveTo(3, y);
    ctx.bezierCurveTo(w * 0.35, y + 2, w * 0.66, y - 2, w - 3, y + 1);
    ctx.stroke();
  }
  ctx.fillStyle = rgba('#ffffff', 0.18);
  ctx.fillRect(0, 0, w, 2.4);
  ctx.fillStyle = rgba('#000000', 0.16);
  ctx.fillRect(0, 0, w, 1.2);
  // 靠墙侧挡板 & 走道侧薄侧板
  ctx.fillStyle = rgba(C.woodDark, 0.35);
  ctx.fillRect(0, 0, 3.5, dh);
  ctx.fillStyle = rgba(C.woodDark, 0.22);
  ctx.fillRect(w - 3, 0, 3, dh);

  /* ---- 绿柜正面 ---- */
  const ch = h - dh;
  const cg = ctx.createLinearGradient(0, dh, 0, h);
  cg.addColorStop(0, C.greenLight);
  cg.addColorStop(0.42, C.green);
  cg.addColorStop(1, C.greenDark);
  ctx.fillStyle = cg;
  ctx.fillRect(1, dh, w - 2, ch);
  ctx.fillStyle = rgba('#ffffff', 0.26);
  ctx.fillRect(1, dh, w - 2, 2);
  ctx.fillStyle = rgba('#2f3a17', 0.42);
  ctx.fillRect(1, h - 2, w - 2, 2);
  const doorW = (w - 12) / 2;
  for (let i = 0; i < 2; i++) {
    const dx = 4 + i * (doorW + 4);
    ctx.strokeStyle = rgba(C.greenDeep, 0.5);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(dx + 0.5, dh + 4.5, doorW - 1, ch - 9);
    ctx.fillStyle = rgba('#ffffff', 0.08);
    ctx.fillRect(dx + 3, dh + 7, doorW - 6, 3);
    fillRr(ctx, dx + (i === 0 ? doorW - 9 : 4), dh + ch / 2 - 4, 5, 8, 2.2, C.metalLight);
    ctx.strokeStyle = rgba(C.metalDeep, 0.5);
    ctx.lineWidth = 0.7;
    ctx.strokeRect(dx + (i === 0 ? doorW - 8.5 : 4.5), dh + ch / 2 - 3.5, 4, 7);
  }
  fillRr(ctx, w / 2 - 4, dh + ch / 2 - 5, 8, 10, 2, C.greenDeep);
  for (const [rx, ry] of [
    [4, dh + 5],
    [w - 4, dh + 5],
    [4, h - 5],
    [w - 4, h - 5],
  ] as const) {
    fillEllipse(ctx, rx, ry, 1.7, 1.7, rgba(C.metalLight, 0.9));
  }
  // 柜底影子
  const g = ctx.createLinearGradient(0, h - 3, 0, h + 5);
  g.addColorStop(0, rgba('#2a2216', 0.3));
  g.addColorStop(1, rgba('#2a2216', 0));
  ctx.fillStyle = g;
  ctx.fillRect(2, h - 3, w - 4, 8);
});

/** 落地立柱（上下铺的骨架） */
define('unitPost', 10, 286, (ctx, w, h) => {
  ctx.fillStyle = metalG(ctx, 0, w, C.metal, shade(C.metal, -0.16), shade(C.metalDark, -0.22));
  ctx.fillRect(0, 0, w, h - 8);
  ctx.fillStyle = rgba('#ffffff', 0.2);
  ctx.fillRect(1, 0, 1.4, h - 8);
  ctx.fillStyle = rgba('#000000', 0.16);
  ctx.fillRect(w - 2.4, 0, 2.4, h - 8);
  // 底座
  fillRr(ctx, -1, h - 10, w + 2, 10, 2, shade(C.metalDark, -0.1));
  fillEllipse(ctx, w / 2, h - 1, 12, 4, rgba('#3a3226', 0.22));
});

/** 爬梯 */
define('ladder', 15, 176, (ctx, w, h) => {
  ctx.fillStyle = metalG(ctx, 0, w, C.metal, C.metalDark, C.metalDeep);
  ctx.fillRect(0, 0, 3.4, h);
  ctx.fillRect(w - 3.4, 0, 3.4, h);
  ctx.fillStyle = rgba(C.metalLight, 0.9);
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(1, 22 + i * 32, w - 2, 3.4);
  }
  ctx.fillStyle = rgba('#ffffff', 0.3);
  ctx.fillRect(0, 0, 1.2, h);
});

/* ------------------------------------------------------------------ */
/* 桌面小物件（单独摆放，可交互）                                       */
/* ------------------------------------------------------------------ */

define('deskLaptop', 46, 34, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 4, 20, 6, 0.22);
  // 键盘底座
  fillPoly(ctx, [
    [4, h - 8],
    [w - 4, h - 10],
    [w - 7, h - 2],
    [7, h - 1],
  ], '#4a4d55');
  fillPoly(ctx, [
    [4, h - 8],
    [w - 4, h - 10],
    [w - 4, h - 14],
    [4, h - 12],
  ], '#5b5f68');
  // 屏幕
  fillRr(ctx, 6, 2, w - 12, 24, 2.5, '#3a3d44');
  const g = ctx.createLinearGradient(0, 4, 0, 24);
  g.addColorStop(0, '#8fc0e8');
  g.addColorStop(1, '#4f7fb0');
  ctx.fillStyle = g;
  ctx.fillRect(8, 4, w - 16, 20);
  ctx.fillStyle = rgba('#ffffff', 0.55);
  ctx.fillRect(11, 7, 14, 2);
  ctx.fillRect(11, 11, 22, 2);
  ctx.fillRect(11, 15, 18, 2);
});

define('deskLamp', 30, 40, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 3, 13, 4, 0.2);
  fillRr(ctx, w / 2 - 9, h - 8, 18, 6, 3, '#3f4147');
  ctx.strokeStyle = '#5a5d64';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w / 2, h - 8);
  ctx.quadraticCurveTo(w / 2 + 5, h - 22, w / 2 - 4, h - 27);
  ctx.stroke();
  fillPoly(ctx, [
    [w / 2 - 10, h - 32],
    [w / 2 + 12, h - 34],
    [w / 2 + 9, h - 24],
    [w / 2 - 8, h - 23],
  ], '#e8d89c');
  const g = ctx.createLinearGradient(0, h - 24, 0, h - 12);
  g.addColorStop(0, rgba('#ffe9a8', 0.75));
  g.addColorStop(1, rgba('#ffe9a8', 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(w / 2, h - 14, 14, 12, 0, 0, Math.PI * 2);
  ctx.fill();
});

define('deskBooks', 34, 24, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 3, 14, 4, 0.2);
  const cols = ['#b8564c', '#4f7f9e', '#c9a24a', '#5d8a5a'];
  for (let i = 0; i < 4; i++) {
    const bw = w - 6 - i * 1.5;
    const bh = 6 + i * 1.2;
    fillRr(ctx, 3 + i * 1.2, h - 4 - bh, bw, bh, 1.2, cols[i]);
    ctx.fillStyle = rgba('#ffffff', 0.24);
    ctx.fillRect(3 + i * 1.2, h - 4 - bh, bw, 1.6);
  }
});

define('deskCup', 16, 20, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 3, 7, 3, 0.2);
  fillRr(ctx, 3, 5, w - 6, h - 8, 3, '#e9e6dc');
  fillRr(ctx, 3, 5, w - 6, 4, 3, rgba('#8a7f66', 0.5));
  ctx.strokeStyle = '#d9d5c8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(w - 2, h / 2 + 1, 4, -1.2, 1.2);
  ctx.stroke();
});

define('deskBox', 26, 16, (ctx, w, h) => {
  fillRr(ctx, 1, 4, w - 2, h - 6, 2, '#c9b79a');
  ctx.fillStyle = '#8ea07a';
  ctx.fillRect(1, 4, w - 2, 4);
  ctx.fillStyle = rgba('#5b5344', 0.4);
  ctx.fillRect(4, h - 7, w - 8, 1.4);
});

define('deskKnife', 20, 14, (ctx, w, _h) => {
  fillRr(ctx, 2, 8, 12, 4, 1.6, '#4a4d55');
  fillPoly(ctx, [
    [14, 8],
    [w - 1, 9],
    [14, 12],
  ], '#cfd4d8');
  fillRr(ctx, 0, 6, 4, 8, 2, '#6b6f76');
});

/* ------------------------------------------------------------------ */
/* 椅子：塑料靠背椅（背对镜头，符合照片里坐着的人）                     */
/* ------------------------------------------------------------------ */

define('chair', 30, 36, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 3, 13, 6, 0.24);
  // 四条腿
  ctx.fillStyle = '#c8ccd0';
  for (const [lx, ly] of [
    [3, 22],
    [w - 7, 22],
  ] as const) {
    ctx.fillRect(lx, ly, 4, 12);
  }
  // 座面
  fillRr(ctx, 2, 14, w - 4, 12, 3, '#e2e4e4');
  fillRr(ctx, 3.5, 15.5, w - 7, 6, 3, rgba('#ffffff', 0.6));
  // 靠背
  fillRr(ctx, 3, 1, w - 6, 15, 4, '#dfe1e1');
  fillRr(ctx, 5, 3, w - 10, 5, 3, rgba('#ffffff', 0.5));
  ctx.fillStyle = rgba('#9aa0a4', 0.35);
  ctx.fillRect(6, 12, w - 12, 3);
});

define('chairWood', 28, 34, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 3, 12, 5, 0.24);
  ctx.fillStyle = C.woodDark;
  ctx.fillRect(3, 20, 3.5, 12);
  ctx.fillRect(w - 6.5, 20, 3.5, 12);
  fillRr(ctx, 2, 13, w - 4, 10, 2, C.wood);
  fillRr(ctx, 3, 14, w - 6, 4, 2, C.woodLight);
  fillRr(ctx, 5, 0, w - 10, 13, 3, C.wood);
  ctx.fillStyle = C.woodLight;
  ctx.fillRect(6, 2, w - 12, 3);
  ctx.fillStyle = rgba(C.woodDeep, 0.3);
  ctx.fillRect(6, 9, w - 12, 2);
});

/* ------------------------------------------------------------------ */
/* 门：北门（平开） / 阳台推拉门                                         */
/* ------------------------------------------------------------------ */

define('doorNorthLeaf', 60, 96, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, shade(C.doorGreen, 0.16));
  g.addColorStop(0.6, C.doorGreen);
  g.addColorStop(1, C.doorGreenDark);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // 门板凹凸
  for (const [px, py, pw, ph] of [
    [8, 10, w - 16, 30],
    [8, 48, w - 16, 36],
  ] as const) {
    ctx.strokeStyle = rgba(C.doorGreenDark, 0.85);
    ctx.lineWidth = 1.4;
    ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
    ctx.fillStyle = rgba('#ffffff', 0.09);
    ctx.fillRect(px + 2, py + 2, pw - 4, 3);
  }
  // 把手
  fillRr(ctx, w - 16, 52, 5, 13, 2.4, C.metalLight);
  ctx.strokeStyle = rgba(C.metalDeep, 0.55);
  ctx.lineWidth = 0.8;
  ctx.strokeRect(w - 15.5, 52.5, 4, 12);
  // 锁孔
  fillEllipse(ctx, w - 13.5, 70, 2, 2, C.metalDeep);
  // 顶/底暗边
  ctx.fillStyle = rgba('#000000', 0.18);
  ctx.fillRect(0, 0, w, 2);
  ctx.fillRect(0, h - 2, w, 2);
});

/** 阳台推拉门玻璃扇（俯视：贴着南侧门槛的一条玻璃带） */
define('balconyLeaf', 34, 26, (ctx, w, h) => {
  // 铝合金框
  fillRr(ctx, 0, 0, w, h, 2.5, '#c3cbca');
  ctx.fillStyle = rgba('#ffffff', 0.4);
  ctx.fillRect(0, 0, w, 2);
  ctx.fillStyle = rgba('#5c6668', 0.35);
  ctx.fillRect(0, h - 3, w, 3);
  // 玻璃
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, rgba('#d7e8ef', 0.72));
  g.addColorStop(0.5, rgba('#eef6f8', 0.42));
  g.addColorStop(1, rgba('#a9c2cd', 0.62));
  ctx.fillStyle = g;
  ctx.fillRect(3, 3, w - 6, h - 7);
  // 玻璃反光
  ctx.save();
  ctx.beginPath();
  ctx.rect(3, 3, w - 6, h - 7);
  ctx.clip();
  ctx.fillStyle = rgba('#ffffff', 0.4);
  ctx.beginPath();
  ctx.moveTo(-4, h - 2);
  ctx.lineTo(w * 0.45, -4);
  ctx.lineTo(w * 0.8, -4);
  ctx.lineTo(-4, h + 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // 中挺
  ctx.strokeStyle = rgba('#f4f7f6', 0.85);
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(w / 2, 3);
  ctx.lineTo(w / 2, h - 4);
  ctx.stroke();
});

/* ------------------------------------------------------------------ */
/* 生活杂物                                                            */
/* ------------------------------------------------------------------ */

define('thermos', 18, 30, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 2, 8, 4, 0.26);
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, C.blueLight);
  g.addColorStop(0.45, C.blue);
  g.addColorStop(1, shade(C.blue, -0.28));
  fillRr(ctx, 2, 6, w - 4, h - 8, 4, g);
  ctx.fillStyle = '#dfe6ea';
  ctx.fillRect(2, 6, w - 4, 5);
  fillRr(ctx, 5, 1, w - 10, 7, 3, '#e8eef1');
  ctx.fillStyle = rgba('#ffffff', 0.35);
  ctx.fillRect(4, 12, 2.5, h - 18);
  fillRr(ctx, 4, h - 12, w - 8, 6, 3, rgba('#1c4a75', 0.35));
});

define('bagYellow', 30, 36, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 3, 12, 4, 0.2);
  fillRr(ctx, 3, 6, w - 6, h - 8, 3, C.yellow);
  const g = ctx.createLinearGradient(0, 6, 0, h - 2);
  g.addColorStop(0, rgba('#ffffff', 0.28));
  g.addColorStop(1, rgba('#000000', 0.14));
  ctx.fillStyle = g;
  ctx.fillRect(3, 6, w - 6, h - 8);
  // 提手
  ctx.strokeStyle = C.yellowDark;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(9, 7);
  ctx.quadraticCurveTo(w / 2, -2, w - 9, 7);
  ctx.stroke();
  // 印刷
  fillEllipse(ctx, w / 2, 20, 7, 7, rgba('#8a6a10', 0.5));
  ctx.fillStyle = rgba('#6d5410', 0.75);
  ctx.font = '600 7px "PingFang SC",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('快递', w / 2, 30);
});

define('bagBlack', 34, 32, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 2, 15, 5, 0.28);
  fillRr(ctx, 2, 6, w - 4, h - 9, 6, C.black);
  const g = ctx.createLinearGradient(0, 6, 0, h - 3);
  g.addColorStop(0, rgba('#ffffff', 0.16));
  g.addColorStop(1, rgba('#000000', 0.3));
  ctx.fillStyle = g;
  ctx.fillRect(4, 8, w - 8, h - 13);
  ctx.strokeStyle = '#8f959b';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(9, 7);
  ctx.quadraticCurveTo(w / 2, 0, w - 9, 7);
  ctx.moveTo(11, 10);
  ctx.quadraticCurveTo(w / 2, 4, w - 11, 10);
  ctx.stroke();
  ctx.fillStyle = rgba('#ffffff', 0.75);
  ctx.beginPath();
  ctx.moveTo(w - 14, 18);
  ctx.lineTo(w - 5, 15);
  ctx.lineTo(w - 6, 22);
  ctx.closePath();
  ctx.fill();
});

define('backpack', 30, 36, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 2, 13, 5, 0.26);
  fillRr(ctx, 3, 8, w - 6, h - 11, 7, '#33363c');
  const g = ctx.createLinearGradient(0, 8, 0, h - 3);
  g.addColorStop(0, rgba('#ffffff', 0.14));
  g.addColorStop(1, rgba('#000000', 0.34));
  ctx.fillStyle = g;
  ctx.fillRect(5, 10, w - 10, h - 15);
  fillRr(ctx, 7, 16, w - 14, 10, 3, '#2a2d32');
  ctx.fillStyle = rgba('#c8ccd0', 0.7);
  ctx.fillRect(9, 18, 6, 2);
  ctx.fillStyle = '#8f959b';
  ctx.fillRect(w / 2 - 2, 8, 4, 8);
});

define('boxStack', 52, 46, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 3, 24, 6, 0.24);
  // 下面大箱
  fillRr(ctx, 2, 20, w - 4, h - 22, 2, C.cardboard);
  const g = ctx.createLinearGradient(0, 20, 0, h - 2);
  g.addColorStop(0, C.cardboard);
  g.addColorStop(1, C.cardboardDark);
  ctx.fillStyle = g;
  ctx.fillRect(2, 20, w - 4, h - 22);
  ctx.fillStyle = rgba('#8a5f2c', 0.55);
  ctx.fillRect(w / 2 - 2, 20, 4, h - 22);
  ctx.fillRect(2, 32, w - 4, 2);
  // 上面小箱
  fillRr(ctx, 8, 2, w - 18, 20, 2, shade(C.cardboard, 0.1));
  ctx.fillStyle = rgba('#8a5f2c', 0.4);
  ctx.fillRect(8 + (w - 18) / 2 - 2, 2, 4, 20);
  ctx.fillStyle = rgba('#ffffff', 0.16);
  ctx.fillRect(8, 2, w - 18, 3);
});

define('trashBag', 28, 26, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 1, 12, 4, 0.3);
  ctx.fillStyle = C.black;
  ctx.beginPath();
  ctx.moveTo(4, h - 1);
  ctx.quadraticCurveTo(-1, h * 0.35, w * 0.32, 3);
  ctx.quadraticCurveTo(w * 0.5, 0, w * 0.66, 3);
  ctx.quadraticCurveTo(w + 1, h * 0.4, w - 4, h - 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgba('#ffffff', 0.09);
  ctx.beginPath();
  ctx.moveTo(7, h - 4);
  ctx.quadraticCurveTo(4, h * 0.45, w * 0.35, 7);
  ctx.quadraticCurveTo(w * 0.3, h * 0.6, 12, h - 4);
  ctx.closePath();
  ctx.fill();
  // 袋口扎绳
  ctx.strokeStyle = rgba('#c8ccd0', 0.65);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(w * 0.28, 6);
  ctx.quadraticCurveTo(w * 0.5, 10, w * 0.7, 6);
  ctx.stroke();
});

define('plasticBag', 32, 24, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 1, 14, 4, 0.22);
  ctx.fillStyle = 'rgba(240,240,232,0.92)';
  ctx.beginPath();
  ctx.moveTo(3, h - 1);
  ctx.quadraticCurveTo(-2, h * 0.4, w * 0.3, 4);
  ctx.quadraticCurveTo(w * 0.5, 1, w * 0.7, 4);
  ctx.quadraticCurveTo(w + 2, h * 0.42, w - 3, h - 1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(210,208,196,0.9)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(7, h - 4);
  ctx.quadraticCurveTo(6, h * 0.5, w * 0.34, 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w - 8, h - 4);
  ctx.quadraticCurveTo(w - 6, h * 0.52, w * 0.66, 6);
  ctx.stroke();
});

define('slippers', 24, 14, (ctx, _w, h) => {
  for (const dx of [0, 11]) {
    fillEllipse(ctx, dx + 6, h - 5, 6, 4.5, '#6fa0c4');
    ctx.fillStyle = '#e7edf1';
    ctx.beginPath();
    ctx.ellipse(dx + 6.5, h - 7.5, 4.4, 3.2, -0.15, Math.PI, Math.PI * 2);
    ctx.fill();
  }
});

define('bucket', 24, 24, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 2, 10, 4, 0.26);
  ctx.fillStyle = '#4f8fb8';
  ctx.beginPath();
  ctx.moveTo(3, 4);
  ctx.lineTo(w - 3, 4);
  ctx.lineTo(w - 5, h - 2);
  ctx.lineTo(5, h - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgba('#ffffff', 0.22);
  ctx.fillRect(5, 6, 3, h - 10);
  fillEllipse(ctx, w / 2, 5, w / 2 - 3, 3.4, '#7fb6d6');
  ctx.strokeStyle = rgba('#2f6a8c', 0.8);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(4, 5);
  ctx.quadraticCurveTo(w / 2, -3, w - 4, 5);
  ctx.stroke();
});

define('mop', 16, 46, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 2, 7, 3, 0.24);
  ctx.fillStyle = C.wood;
  ctx.fillRect(w / 2 - 1.6, 4, 3.2, h - 16);
  ctx.fillStyle = '#c9c4b6';
  for (let i = 0; i < 7; i++) {
    ctx.save();
    ctx.translate(w / 2, h - 12);
    ctx.rotate(-0.7 + i * 0.24);
    ctx.fillRect(-1.4, 0, 2.8, 12);
    ctx.restore();
  }
  ctx.fillStyle = rgba('#a8a294', 0.8);
  ctx.fillRect(w / 2 - 5, h - 15, 10, 3);
});

define('powerStrip', 30, 12, (ctx, w, h) => {
  fillRr(ctx, 0, 2, w, h - 4, 2, '#e6e3da');
  ctx.fillStyle = rgba('#8a8478', 0.6);
  for (let i = 0; i < 4; i++) ctx.fillRect(4 + i * 6, 4.5, 4, 4);
  ctx.fillStyle = '#7fd18a';
  ctx.fillRect(w - 4, 4.5, 2.4, 2.4);
});

define('bookStackFloor', 30, 18, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 2, 13, 4, 0.22);
  const cols = ['#8f5a4e', '#3f6b86', '#b09b52'];
  for (let i = 0; i < 3; i++) {
    fillRr(ctx, 2 + i, h - 5 - i * 5, w - 4 - i * 2, 5, 1, cols[i]);
  }
});

define('waterHeater', 34, 48, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 3, 15, 5, 0.24);
  fillRr(ctx, 3, 6, w - 6, h - 10, 5, '#e9e6dc');
  const g = ctx.createLinearGradient(0, 6, 0, h - 4);
  g.addColorStop(0, '#f4f1e8');
  g.addColorStop(1, '#cfcbbb');
  ctx.fillStyle = g;
  ctx.fillRect(6, 9, w - 12, h - 16);
  fillRr(ctx, 8, 10, w - 16, 12, 2, '#5d727f');
  ctx.fillStyle = '#7fd18a';
  ctx.fillRect(w / 2 - 6, 24, 12, 2);
  ctx.fillStyle = rgba('#6b6558', 0.7);
  ctx.font = '600 7px "PingFang SC",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('热水', w / 2, 34);
});
