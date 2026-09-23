import { C } from '../core/palette';
import {
  define,
  fillEllipse,
  fillPoly,
  fillRr,
  grain,
  makeRng,
  rgba,
  shade,
} from '../core/canvas';
import { BALCONY, CORRIDOR, DORM } from '../world/layout';

const T = 32;

/**
 * 剖切墙：靠室外的一侧是混凝土断面，靠室内的一侧是墙面。
 * 这样镜头贴着一屏宽时，两侧不会是黑边，而是“被切开的墙”。
 */
function cutWall(
  ctx: CanvasRenderingContext2D,
  sceneW: number,
  edge: number,
  dir: 1 | -1,
  cut: number,
  face: number,
  top: number,
  bottom: number,
  rng: () => number,
  wallTop: string,
  wallBottom: string,
): void {
  const outer = edge + dir * cut;
  const left = Math.min(edge, outer);
  const hgt = bottom - top;

  // 混凝土断面
  const cg = ctx.createLinearGradient(edge, 0, outer, 0);
  cg.addColorStop(0, '#5f5a4f');
  cg.addColorStop(0.3, '#443f37');
  cg.addColorStop(1, '#2b2823');
  ctx.fillStyle = cg;
  ctx.fillRect(left, top, cut, hgt);
  // 骨料颗粒
  for (let i = 0; i < cut * hgt * 0.016; i++) {
    const px = left + rng() * cut;
    const py = top + rng() * hgt;
    ctx.fillStyle = rng() > 0.5 ? rgba('#ffffff', 0.055) : rgba('#000000', 0.13);
    ctx.fillRect(px, py, 1.5, 1.5);
  }
  // 断面外侧更深的一条
  ctx.fillStyle = rgba('#14120f', 0.35);
  ctx.fillRect(Math.min(outer - dir * 10, outer), top, 10, hgt);

  // 室内墙面
  const faceEdge = edge + dir * face;
  const fl = Math.min(edge, faceEdge);
  const fg = ctx.createLinearGradient(edge, 0, faceEdge, 0);
  fg.addColorStop(0, wallTop);
  fg.addColorStop(1, wallBottom);
  ctx.fillStyle = fg;
  ctx.fillRect(fl, top, face, hgt);
  // 墙面与断面的分界
  ctx.fillStyle = rgba('#15130f', 0.45);
  ctx.fillRect(Math.min(faceEdge - dir * 1.4, faceEdge), top, 1.8, hgt);
  // 墙面高光
  ctx.fillStyle = rgba('#ffffff', 0.22);
  ctx.fillRect(Math.min(edge - dir * 1.4, edge), top, 1.4, hgt);

  // 室内的落影
  const sh = ctx.createLinearGradient(edge, 0, edge + dir * 18, 0);
  sh.addColorStop(0, rgba('#3f3729', 0.34));
  sh.addColorStop(1, rgba('#3f3729', 0));
  ctx.fillStyle = sh;
  ctx.fillRect(Math.min(edge, edge + dir * 18), 0, 18, bottom);
  void sceneW;
}

/* ------------------------------------------------------------------ */
/* 通用：地砖                                                          */
/* ------------------------------------------------------------------ */

function tiles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cols: string[],
  rng: () => number,
  groutAlpha = 0.5,
): void {
  const cols_ = Math.ceil(w / T);
  const rows = Math.ceil(h / T);
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols_; tx++) {
      const px = x + tx * T;
      const py = y + ty * T;
      const tw = Math.min(T, x + w - px);
      const th = Math.min(T, y + h - py);
      const c = cols[Math.floor(rng() * cols.length) % cols.length];
      const sway = (rng() - 0.5) * 0.06;
      ctx.fillStyle = shade(c, sway);
      ctx.fillRect(px, py, tw, th);
      // 釉面上缘高光
      ctx.fillStyle = rgba('#ffffff', 0.07);
      ctx.fillRect(px, py, tw, 1.6);
      // 砖缝
      ctx.strokeStyle = rgba(C.grout, groutAlpha);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 0.5, py);
      ctx.lineTo(px + 0.5, py + th);
      ctx.moveTo(px, py + 0.5);
      ctx.lineTo(px + tw, py + 0.5);
      ctx.stroke();
    }
  }
}

/** 四周向内渐暗，制造室内环境光遮蔽 */
function edgeAO(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  d = 18,
  s = 0.26,
): void {
  const col = '#43392a';
  const top = ctx.createLinearGradient(0, y, 0, y + d);
  top.addColorStop(0, rgba(col, s));
  top.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = top;
  ctx.fillRect(x, y, w, d);

  const bot = ctx.createLinearGradient(0, y + h - d, 0, y + h);
  bot.addColorStop(0, rgba(col, 0));
  bot.addColorStop(1, rgba(col, s * 0.8));
  ctx.fillStyle = bot;
  ctx.fillRect(x, y + h - d, w, d);

  const lef = ctx.createLinearGradient(x, 0, x + d, 0);
  lef.addColorStop(0, rgba(col, s));
  lef.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = lef;
  ctx.fillRect(x, y, d, h);

  const rig = ctx.createLinearGradient(x + w - d, 0, x + w, 0);
  rig.addColorStop(0, rgba(col, 0));
  rig.addColorStop(1, rgba(col, s));
  ctx.fillStyle = rig;
  ctx.fillRect(x + w - d, y, d, h);
}

/* ------------------------------------------------------------------ */
/* 寝室外壳：地板 + 三面墙 + 门洞 + 墙面细节                            */
/* ------------------------------------------------------------------ */

define('dormShell', DORM.shell.w, DORM.shell.h, (ctx) => {
  ctx.translate(-DORM.shell.x, -DORM.shell.y);
  const rng = makeRng(1120);
  const W = DORM.w;
  const H = DORM.h;

  /* ---- 地板 ---- */
  tiles(ctx, -6, 0, W + 12, H, [C.floor1, C.floor1, C.floor2, C.floor3], rng);

  // 过道被踩得发亮
  const worn = ctx.createLinearGradient(120, 0, 264, 0);
  worn.addColorStop(0, rgba('#ffffff', 0));
  worn.addColorStop(0.5, rgba('#ffffff', 0.1));
  worn.addColorStop(1, rgba('#ffffff', 0));
  ctx.fillStyle = worn;
  ctx.fillRect(120, 0, 144, H);

  // 生活痕迹：水渍、拖把印、鞋印
  for (let i = 0; i < 26; i++) {
    const px = 20 + rng() * (W - 40);
    const py = rng() * H;
    const r = 6 + rng() * 16;
    const g = ctx.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, rgba('#6b5f45', 0.1 + rng() * 0.07));
    g.addColorStop(1, rgba('#6b5f45', 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(px, py, r, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // 床边总是更脏一点
  for (const sy of [40, 380]) {
    const g = ctx.createLinearGradient(0, sy, 0, sy + 240);
    g.addColorStop(0, rgba('#5d5340', 0.03));
    g.addColorStop(0.5, rgba('#5d5340', 0.13));
    g.addColorStop(1, rgba('#5d5340', 0.03));
    ctx.fillStyle = g;
    ctx.fillRect(140, sy, 104, 240);
  }
  grain(ctx, 0, 0, W, H, 2600, rng, 0.05);

  /* ---- 北墙立面 ---- */
  const wx0 = -DORM.cut;
  const wx1 = W + DORM.cut;
  const wallTop = -DORM.wallH;
  const wallG = ctx.createLinearGradient(0, wallTop, 0, 0);
  wallG.addColorStop(0, C.wallTop);
  wallG.addColorStop(0.55, C.wall);
  wallG.addColorStop(1, shade(C.wall, -0.12));
  ctx.fillStyle = wallG;
  ctx.fillRect(wx0, wallTop, wx1 - wx0, DORM.wallH);

  // 顶部压条（天花与墙的交接）
  ctx.fillStyle = rgba('#ffffff', 0.5);
  ctx.fillRect(wx0, wallTop, wx1 - wx0, 2.5);
  ctx.fillStyle = rgba(C.wallShadow, 0.5);
  ctx.fillRect(wx0, wallTop + 2.5, wx1 - wx0, 1.2);

  // 墙面横向接缝
  ctx.strokeStyle = rgba(C.wallDark, 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(wx0, -34);
  ctx.lineTo(wx1, -34);
  ctx.stroke();

  // 墙脚绿裙线
  ctx.fillStyle = C.wallTrim;
  ctx.fillRect(wx0, -13, wx1 - wx0, 13);
  ctx.fillStyle = rgba('#ffffff', 0.22);
  ctx.fillRect(wx0, -13, wx1 - wx0, 2);
  ctx.fillStyle = rgba(C.greenDeep, 0.35);
  ctx.fillRect(wx0, -1.5, wx1 - wx0, 1.5);

  // 左右角暗
  for (const [cx, dir] of [
    [wx0, 1],
    [wx1, -1],
  ] as const) {
    const g = ctx.createLinearGradient(cx, 0, cx + dir * 34, 0);
    g.addColorStop(0, rgba('#4a4133', 0.3));
    g.addColorStop(1, rgba('#4a4133', 0));
    ctx.fillStyle = g;
    ctx.fillRect(Math.min(cx, cx + dir * 34), wallTop, 34, DORM.wallH);
  }

  // 墙面挂饰：窗户 + 空调外机箱
  //   窗
  fillRr(ctx, 34, -56, 74, 34, 3, C.wallDark);
  fillRr(ctx, 36.5, -53.5, 69, 29, 2, '#5c7290');
  const glass = ctx.createLinearGradient(0, -53, 0, -24);
  glass.addColorStop(0, '#8fb0d4');
  glass.addColorStop(1, '#496180');
  ctx.fillStyle = glass;
  ctx.fillRect(36.5, -53.5, 69, 29);
  fillPoly(ctx, [
    [36.5, -24.5],
    [105.5, -53.5],
    [105.5, -40],
    [36.5, -30],
  ], rgba('#e9f2ff', 0.22));
  ctx.strokeStyle = rgba('#f4f6f2', 0.75);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(71, -53);
  ctx.lineTo(71, -25);
  ctx.stroke();
  fillRr(ctx, 34, -56, 74, 2.4, 1, '#f2f0e8');

  //   空调/通风机箱
  fillRr(ctx, 122, -52, 30, 22, 2.5, '#e3e3dc');
  ctx.strokeStyle = rgba(C.metalDark, 0.8);
  ctx.lineWidth = 1;
  ctx.strokeRect(122.5, -51.5, 29, 21);
  ctx.fillStyle = rgba(C.metalDark, 0.5);
  for (let i = 0; i < 4; i++) ctx.fillRect(126, -48.5 + i * 4, 22, 1.2);
  ctx.fillStyle = '#7fd18a';
  ctx.fillRect(145, -56, 4, 3);
  ctx.fillStyle = rgba('#000000', 0.18);
  ctx.fillRect(122, -30, 30, 3);

  // 明线走线 + 开关
  ctx.strokeStyle = rgba('#d9d3c2', 0.9);
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(wx0 + 6, -62);
  ctx.lineTo(160, -62);
  ctx.lineTo(160, -44);
  ctx.stroke();
  fillRr(ctx, 156, -48, 10, 12, 2, '#f0eee6');
  ctx.strokeStyle = rgba(C.metalDark, 0.7);
  ctx.lineWidth = 0.8;
  ctx.strokeRect(156.5, -47.5, 9, 11);
  ctx.fillStyle = C.metalDark;
  ctx.fillRect(159.5, -44, 3, 5);

  // 门牌 112
  fillRr(ctx, 232, -52, 26, 14, 2.5, '#f3f1e7');
  ctx.strokeStyle = rgba(C.greenDeep, 0.7);
  ctx.lineWidth = 1.2;
  ctx.strokeRect(232.4, -51.6, 25.2, 13.2);
  ctx.fillStyle = C.ink;
  ctx.font = '600 10px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('112', 245, -44.5);

  // 便利贴 & 手写小纸条
  ctx.save();
  ctx.translate(268, -47);
  ctx.rotate(-0.08);
  fillRr(ctx, 0, 0, 16, 15, 1.5, '#f2d98a');
  ctx.fillStyle = rgba('#8a6a2a', 0.5);
  for (let i = 0; i < 3; i++) ctx.fillRect(3, 4 + i * 4, 10, 1);
  ctx.restore();
  ctx.save();
  ctx.translate(292, -46);
  ctx.rotate(0.06);
  fillRr(ctx, 0, 0, 15, 13, 1.5, '#a8d2e8');
  ctx.restore();

  // 门洞（凹进去的暗部 + 门框）
  const dn = DORM.northDoor;
  ctx.fillStyle = '#2c2a25';
  ctx.fillRect(dn.x - 4, -DORM.wallH + 4, dn.w + 8, DORM.wallH - 4);
  fillRr(ctx, dn.x - 5, -DORM.wallH + 2, dn.w + 10, 5, 2, '#f0ece0');
  ctx.fillStyle = '#efeade';
  ctx.fillRect(dn.x - 5, -DORM.wallH + 2, 4.5, DORM.wallH - 2);
  ctx.fillRect(dn.x + dn.w + 0.5, -DORM.wallH + 2, 4.5, DORM.wallH - 2);
  // 门内透出的走廊灯光
  const doorway = ctx.createLinearGradient(0, -DORM.wallH, 0, 0);
  doorway.addColorStop(0, rgba('#c9c2a6', 0.18));
  doorway.addColorStop(1, rgba('#141310', 0.6));
  ctx.fillStyle = doorway;
  ctx.fillRect(dn.x + 4, -DORM.wallH + 6, dn.w - 8, DORM.wallH - 6);

  /* ---- 侧墙：剖切断面 + 室内墙面 ---- */
  const shellTop = DORM.shell.y;
  const shellBot = DORM.shell.y + DORM.shell.h;
  for (const [sx, dir] of [
    [0, -1],
    [W, 1],
  ] as const) {
    cutWall(
      ctx,
      W,
      sx,
      dir,
      DORM.cut,
      DORM.side,
      shellTop,
      shellBot,
      rng,
      shade(C.wall, -0.06),
      shade(C.wall, -0.36),
    );
  }

  /* ---- 南端：阳台推拉门门槛 ---- */
  ctx.fillStyle = shade(C.floor2, -0.22);
  ctx.fillRect(-DORM.cut, H - 4, W + DORM.cut * 2, shellBot - H + 4);
  ctx.fillStyle = rgba(C.metalDark, 0.35);
  ctx.fillRect(-DORM.cut, H - 4, W + DORM.cut * 2, 1.6);
  ctx.fillStyle = rgba('#ffffff', 0.14);
  ctx.fillRect(-DORM.cut, H + 8, W + DORM.cut * 2, 2);
  // 门槛槽
  ctx.strokeStyle = rgba(C.metalDark, 0.5);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(DORM.southDoor.x - 6, H + 5);
  ctx.lineTo(DORM.southDoor.x + DORM.southDoor.w + 6, H + 5);
  ctx.stroke();

  edgeAO(ctx, 0, 0, W, H, 20, 0.22);
});

/* ------------------------------------------------------------------ */
/* 走廊外壳                                                            */
/* ------------------------------------------------------------------ */

define('corridorShell', CORRIDOR.shell.w, CORRIDOR.shell.h, (ctx) => {
  ctx.translate(-CORRIDOR.shell.x, -CORRIDOR.shell.y);
  const rng = makeRng(7712);
  const W = CORRIDOR.w;
  const H = CORRIDOR.h;

  /* ---- 地面：灰白方砖 ---- */
  tiles(ctx, -6, 0, W + 12, H, ['#a5a397', '#afad9f', '#9a988c', '#b6b4a6'], rng, 0.62);
  // 走廊中间被踩亮
  const worn = ctx.createLinearGradient(0, 40, 0, 150);
  worn.addColorStop(0, rgba('#ffffff', 0));
  worn.addColorStop(0.5, rgba('#ffffff', 0.07));
  worn.addColorStop(1, rgba('#ffffff', 0));
  ctx.fillStyle = worn;
  ctx.fillRect(0, 40, W, 110);
  // 水泥浆渍
  for (let i = 0; i < 40; i++) {
    const px = rng() * W;
    const py = rng() * H;
    const r = 5 + rng() * 14;
    const g = ctx.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, rgba('#57534a', 0.06 + rng() * 0.06));
    g.addColorStop(1, rgba('#57534a', 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(px, py, r, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  grain(ctx, 0, 0, W, H, 4200, rng, 0.05);

  /* ---- 北墙 ---- */
  const wx0 = -CORRIDOR.cut;
  const wx1 = W + CORRIDOR.cut;
  const wallTop = -CORRIDOR.wallH;
  const wallG = ctx.createLinearGradient(0, wallTop, 0, 0);
  wallG.addColorStop(0, '#efece1');
  wallG.addColorStop(0.6, '#e2ded1');
  wallG.addColorStop(1, shade('#e2ded1', -0.14));
  ctx.fillStyle = wallG;
  ctx.fillRect(wx0, wallTop, wx1 - wx0, CORRIDOR.wallH);

  ctx.fillStyle = rgba('#ffffff', 0.45);
  ctx.fillRect(wx0, wallTop, wx1 - wx0, 2.5);
  // 腰线（下半墙刷成灰绿，照片里走廊就是这个味儿）
  ctx.fillStyle = '#c3c7b4';
  ctx.fillRect(wx0, -22, wx1 - wx0, 22);
  ctx.fillStyle = rgba('#ffffff', 0.25);
  ctx.fillRect(wx0, -22, wx1 - wx0, 1.6);
  ctx.fillStyle = rgba(C.greenDeep, 0.18);
  ctx.fillRect(wx0, -1.6, wx1 - wx0, 1.6);

  // 顶灯槽 + 灯管
  for (let i = 0; i < 5; i++) {
    const lx = 90 + i * 180;
    fillRr(ctx, lx, -50, 76, 9, 3, '#f6f3e6');
    const lg = ctx.createLinearGradient(0, -50, 0, -41);
    lg.addColorStop(0, '#fffdf2');
    lg.addColorStop(1, '#e8e0c2');
    ctx.fillStyle = lg;
    ctx.fillRect(lx + 3, -48.5, 70, 6);
    const glow = ctx.createRadialGradient(lx + 38, -44, 0, lx + 38, -44, 46);
    glow.addColorStop(0, rgba('#fff3cf', 0.5));
    glow.addColorStop(1, rgba('#fff3cf', 0));
    ctx.fillStyle = glow;
    ctx.fillRect(lx - 20, -52, 116, 34);
  }

  // 门牌 + 门框（门板另用贴图，便于开合动画）
  for (const d of CORRIDOR.doors) {
    ctx.fillStyle = '#2b2924';
    ctx.fillRect(d.x - 4, -CORRIDOR.wallH + 4, d.w + 8, CORRIDOR.wallH - 4);
    ctx.fillStyle = '#f0ece0';
    ctx.fillRect(d.x - 5, -CORRIDOR.wallH + 2, 4.5, CORRIDOR.wallH - 2);
    ctx.fillRect(d.x + d.w + 0.5, -CORRIDOR.wallH + 2, 4.5, CORRIDOR.wallH - 2);
    fillRr(ctx, d.x - 5, -CORRIDOR.wallH + 2, d.w + 10, 5, 2, '#f0ece0');
    const doorway = ctx.createLinearGradient(0, -CORRIDOR.wallH, 0, 0);
    doorway.addColorStop(0, rgba('#b9b2a0', 0.16));
    doorway.addColorStop(1, rgba('#12110f', 0.62));
    ctx.fillStyle = doorway;
    ctx.fillRect(d.x + 4, -CORRIDOR.wallH + 6, d.w - 8, CORRIDOR.wallH - 6);
    // 门牌
    fillRr(ctx, d.x + d.w * 0.5 - 13, -CORRIDOR.wallH + 6, 26, 13, 2.5, d.ours ? '#e9f0d2' : '#f2f0e6');
    ctx.strokeStyle = rgba(C.greenDeep, d.ours ? 0.9 : 0.5);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(d.x + d.w * 0.5 - 12.7, -CORRIDOR.wallH + 6.3, 25.4, 12.4);
    ctx.fillStyle = C.ink;
    ctx.font = '600 9px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.label, d.x + d.w * 0.5, -CORRIDOR.wallH + 13);
  }

  // 宣传栏
  const bb = { x: 236, y: -54, w: 88, h: 34 };
  fillRr(ctx, bb.x, bb.y, bb.w, bb.h, 2.5, '#8a6a44');
  fillRr(ctx, bb.x + 3, bb.y + 3, bb.w - 6, bb.h - 6, 2, '#c8ad82');
  const noteCols = ['#f3e7c8', '#dfe9ef', '#f0d9d0', '#e6efd6'];
  for (let i = 0; i < 4; i++) {
    const nx = bb.x + 7 + (i % 2) * 40;
    const ny = bb.y + 6 + Math.floor(i / 2) * 15;
    ctx.save();
    ctx.translate(nx, ny);
    ctx.rotate((i % 2 ? 1 : -1) * 0.03);
    fillRr(ctx, 0, 0, 34, 12, 1, noteCols[i]);
    ctx.fillStyle = rgba('#5b5344', 0.45);
    for (let k = 0; k < 3; k++) ctx.fillRect(3, 3 + k * 3.4, 24 - k * 4, 0.9);
    ctx.restore();
  }

  // 消防栓箱 + 安全出口指示
  fillRr(ctx, 700, -44, 26, 30, 2.5, '#d94f43');
  fillRr(ctx, 703, -41, 20, 24, 2, '#e86a5c');
  ctx.fillStyle = rgba('#ffffff', 0.8);
  ctx.font = '600 12px "PingFang SC",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('消', 713, -27);
  fillRr(ctx, 840, -58, 40, 15, 2, '#1f7a48');
  ctx.fillStyle = '#f4ffe9';
  ctx.font = '600 10px "PingFang SC",sans-serif';
  ctx.fillText('安全出口', 860, -50);

  /* ---- 南侧墙（近景，矮墙 + 窗）---- */
  ctx.fillStyle = shade('#dcd8cb', -0.05);
  ctx.fillRect(wx0, H, wx1 - wx0, 60);
  ctx.fillStyle = rgba('#ffffff', 0.3);
  ctx.fillRect(wx0, H, wx1 - wx0, 2);
  ctx.fillStyle = rgba('#43392a', 0.3);
  ctx.fillRect(wx0, H, wx1 - wx0, 3);
  for (let i = 0; i < 4; i++) {
    const px = 70 + i * 230;
    fillRr(ctx, px, H + 12, 120, 34, 3, '#6d6a5f');
    const g = ctx.createLinearGradient(0, H + 14, 0, H + 44);
    g.addColorStop(0, '#93a9bd');
    g.addColorStop(1, '#5d7286');
    ctx.fillStyle = g;
    ctx.fillRect(px + 3, H + 15, 114, 28);
    ctx.fillStyle = rgba('#ffffff', 0.16);
    ctx.fillRect(px + 3, H + 15, 114, 2);
  }

  for (const [sx, dir] of [
    [0, -1],
    [W, 1],
  ] as const) {
    cutWall(
      ctx,
      W,
      sx,
      dir,
      CORRIDOR.cut,
      16,
      CORRIDOR.shell.y,
      CORRIDOR.shell.y + CORRIDOR.shell.h,
      rng,
      shade('#e2ded1', -0.06),
      shade('#e2ded1', -0.4),
    );
  }
  edgeAO(ctx, 0, 0, W, H, 22, 0.2);
});

/* ------------------------------------------------------------------ */
/* 阳台外壳                                                            */
/* ------------------------------------------------------------------ */

define('balconyShell', BALCONY.shell.w, BALCONY.shell.h, (ctx) => {
  ctx.translate(-BALCONY.shell.x, -BALCONY.shell.y);
  const rng = makeRng(3301);
  const W = BALCONY.w;
  const H = BALCONY.h;

  /* ---- 地面：小方砖，偏灰 ---- */
  tiles(ctx, -6, 0, W + 12, H, ['#a9a79c', '#b3b1a6', '#9e9c92'], rng, 0.6);
  // 常年积水的水痕
  for (let i = 0; i < 22; i++) {
    const px = rng() * W;
    const py = rng() * H;
    const r = 8 + rng() * 20;
    const g = ctx.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, rgba('#5f6257', 0.12));
    g.addColorStop(1, rgba('#5f6257', 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(px, py, r, r * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  grain(ctx, 0, 0, W, H, 2600, rng, 0.05);

  /* ---- 北墙（连着寝室那面）---- */
  const wx0 = -BALCONY.cut;
  const wx1 = W + BALCONY.cut;
  const wallTop = -BALCONY.wallH;
  const wallG = ctx.createLinearGradient(0, wallTop, 0, 0);
  wallG.addColorStop(0, '#e8e3d5');
  wallG.addColorStop(0.62, '#dad4c3');
  wallG.addColorStop(1, shade('#dad4c3', -0.16));
  ctx.fillStyle = wallG;
  ctx.fillRect(wx0, wallTop, wx1 - wx0, BALCONY.wallH);
  ctx.fillStyle = rgba('#ffffff', 0.4);
  ctx.fillRect(wx0, wallTop, wx1 - wx0, 2.5);
  // 瓷砖贴面
  ctx.strokeStyle = rgba('#c0b9a6', 0.5);
  ctx.lineWidth = 1;
  for (let x = wx0; x < wx1; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, wallTop + 3);
    ctx.lineTo(x, 0);
    ctx.stroke();
  }
  for (let y = wallTop + 3; y < 0; y += 20) {
    ctx.beginPath();
    ctx.moveTo(wx0, y);
    ctx.lineTo(wx1, y);
    ctx.stroke();
  }
  ctx.fillStyle = C.wallTrim;
  ctx.fillRect(wx0, -12, wx1 - wx0, 12);
  ctx.fillStyle = rgba('#ffffff', 0.22);
  ctx.fillRect(wx0, -12, wx1 - wx0, 2);

  // 寝室那扇通往阳台的门洞
  const bd = BALCONY.door;
  ctx.fillStyle = '#2b2924';
  ctx.fillRect(bd.x - 4, -BALCONY.wallH + 4, bd.w + 8, BALCONY.wallH - 4);
  ctx.fillStyle = '#f0ece0';
  ctx.fillRect(bd.x - 5, -BALCONY.wallH + 2, 4.5, BALCONY.wallH - 2);
  ctx.fillRect(bd.x + bd.w + 0.5, -BALCONY.wallH + 2, 4.5, BALCONY.wallH - 2);
  fillRr(ctx, bd.x - 5, -BALCONY.wallH + 2, bd.w + 10, 5, 2, '#f0ece0');
  const dglow = ctx.createLinearGradient(0, -BALCONY.wallH, 0, 0);
  dglow.addColorStop(0, rgba('#ffe6b0', 0.3));
  dglow.addColorStop(1, rgba('#1a1712', 0.55));
  ctx.fillStyle = dglow;
  ctx.fillRect(bd.x + 4, -BALCONY.wallH + 6, bd.w - 8, BALCONY.wallH - 6);

  // 寝室窗户（能看到里面的暖光）
  fillRr(ctx, 48, -52, 86, 36, 3, '#9c9682');
  const gw = ctx.createLinearGradient(0, -49, 0, -19);
  gw.addColorStop(0, '#f7dfa4');
  gw.addColorStop(1, '#d8b877');
  ctx.fillStyle = gw;
  ctx.fillRect(51, -49, 80, 30);
  // 窗内的床帘影
  ctx.fillStyle = rgba('#8b7d5f', 0.28);
  ctx.fillRect(96, -49, 35, 30);
  ctx.strokeStyle = rgba('#f6f3ea', 0.8);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(91, -49);
  ctx.lineTo(91, -19);
  ctx.stroke();
  fillRr(ctx, 48, -52, 86, 3, 1, '#f4f2e9');

  // 洗衣机插座 + 水管
  fillRr(ctx, 300, -30, 12, 14, 2, '#eeebe1');
  ctx.strokeStyle = rgba(C.metalDark, 0.7);
  ctx.lineWidth = 1;
  ctx.strokeRect(300.5, -29.5, 11, 13);
  ctx.strokeStyle = rgba('#cfd6d2', 0.9);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(306, -16);
  ctx.lineTo(306, 0);
  ctx.stroke();

  /* ---- 侧墙 ---- */
  for (const [sx, dir] of [
    [0, -1],
    [W, 1],
  ] as const) {
    cutWall(
      ctx,
      W,
      sx,
      dir,
      BALCONY.cut,
      18,
      BALCONY.shell.y,
      BALCONY.shell.y + BALCONY.shell.h,
      rng,
      shade('#c9c3b1', -0.08),
      shade('#c9c3b1', -0.42),
    );
  }

  edgeAO(ctx, 0, 0, W, H, 18, 0.24);
});

/* ------------------------------------------------------------------ */
/* 灯光：吸顶灯的光池、吊扇影、暗角                                    */
/* ------------------------------------------------------------------ */

define('lightPool', 300, 300, (ctx, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, 0.78);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, cx);
  g.addColorStop(0, rgba('#fff0c4', 0.5));
  g.addColorStop(0.32, rgba('#ffe6a8', 0.28));
  g.addColorStop(0.62, rgba('#ffd88c', 0.1));
  g.addColorStop(1, rgba('#ffd88c', 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, cx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
});

define('fanShadow', 210, 210, (ctx, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, 0.82);
  ctx.fillStyle = rgba('#3a3225', 0.2);
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.quadraticCurveTo(26, -30, 62, -18);
    ctx.quadraticCurveTo(30, -4, 0, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
});

define('vignette', 540, 360, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w / 2, h * 0.46, h * 0.2, w / 2, h * 0.5, w * 0.72);
  g.addColorStop(0, 'rgba(20,16,10,0)');
  g.addColorStop(0.6, 'rgba(20,16,10,0.14)');
  g.addColorStop(1, 'rgba(16,12,8,0.52)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
});

/** 暖色氛围叠加（配合 ADD 混合） */
define('warmTint', 540, 360, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,203,120,0.1)');
  g.addColorStop(0.55, 'rgba(255,196,110,0.04)');
  g.addColorStop(1, 'rgba(60,52,80,0.14)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
});

/** 对话/按钮用的柔光环 */
define('softGlow', 120, 120, (ctx, w) => {
  const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  g.addColorStop(0, rgba('#ffffff', 0.9));
  g.addColorStop(0.4, rgba('#ffe9b0', 0.4));
  g.addColorStop(1, rgba('#ffe9b0', 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, w);
});

/** 脚下光环（可交互物件的高亮圈） */
define('ringHighlight', 120, 80, (ctx, w, h) => {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(1, h / w);
  const g = ctx.createRadialGradient(0, 0, w * 0.3, 0, 0, w * 0.5);
  g.addColorStop(0, rgba('#ffe9a8', 0.08));
  g.addColorStop(0.7, rgba('#ffe9a8', 0.34));
  g.addColorStop(0.88, rgba('#fff3c8', 0.5));
  g.addColorStop(1, rgba('#fff3c8', 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // 地面反光小点
  fillEllipse(ctx, w * 0.5, h * 0.5, w * 0.32, h * 0.34, rgba('#fff6d8', 0.06));
});
