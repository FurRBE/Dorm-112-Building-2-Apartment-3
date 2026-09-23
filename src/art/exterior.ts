import {
  define,
  fillEllipse,
  fillPoly,
  fillRr,
  groundShadow,
  makeRng,
  rgba,
  shade,
} from '../core/canvas';
import { BALCONY } from '../world/layout';

/* ------------------------------------------------------------------ */
/* 夜景：栏杆外的城市                                                   */
/* ------------------------------------------------------------------ */

define('skyNight', BALCONY.w, BALCONY.sky.h, (ctx, w, h) => {
  const rng = makeRng(90210);
  const horizon = h * 0.52;

  // 夜空
  const g = ctx.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, '#0e1729');
  g.addColorStop(0.55, '#1d2c48');
  g.addColorStop(1, '#3f5375');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // 星星
  for (let i = 0; i < 150; i++) {
    const sx = rng() * w;
    const sy = rng() * horizon * 0.82;
    const a = 0.18 + rng() * 0.6;
    fillEllipse(ctx, sx, sy, 0.5 + rng() * 0.8, 0.5 + rng() * 0.8, rgba('#ffffff', a));
  }

  // 月亮 + 月晕
  const mx = w * 0.74;
  const my = h * 0.2;
  const halo = ctx.createRadialGradient(mx, my, 0, mx, my, 44);
  halo.addColorStop(0, rgba('#ffeec2', 0.4));
  halo.addColorStop(0.35, rgba('#ffe3a8', 0.14));
  halo.addColorStop(1, rgba('#ffe3a8', 0));
  ctx.fillStyle = halo;
  ctx.fillRect(mx - 44, my - 44, 88, 88);
  fillEllipse(ctx, mx, my, 12, 12, '#fdf3d6');
  fillEllipse(ctx, mx - 4, my - 3, 3.2, 3, rgba('#e4d5ac', 0.7));
  fillEllipse(ctx, mx + 4, my + 4, 2.2, 2, rgba('#e4d5ac', 0.6));

  // 远处天际线（两层）
  const drawSkyline = (baseY: number, minH: number, maxH: number, col: string, winCol: string, winAlpha: number, step: number) => {
    let x = -20;
    while (x < w + 20) {
      const bw = 14 + rng() * 34;
      const bh = minH + rng() * (maxH - minH);
      const by = baseY - bh;
      ctx.fillStyle = col;
      ctx.fillRect(x, by, bw, bh + 10);
      // 楼顶小结构
      if (rng() > 0.62) ctx.fillRect(x + bw * 0.3, by - 7 - rng() * 6, 3, 8);
      // 窗户
      for (let wy = by + 5; wy < baseY - 4; wy += 7) {
        for (let wx = x + 3; wx < x + bw - 4; wx += 6) {
          if (rng() > 0.55) {
            ctx.fillStyle = winCol;
            ctx.globalAlpha = winAlpha * (0.4 + rng() * 0.6);
            ctx.fillRect(wx, wy, 2.6, 3.6);
            ctx.globalAlpha = 1;
          }
        }
      }
      ctx.fillStyle = col;
      x += bw + step;
    }
  };

  drawSkyline(horizon - 12, 26, 78, '#1a2338', '#ffd88c', 0.75, 2 + rng() * 8);
  drawSkyline(horizon + 12, 20, 66, '#131a2b', '#ffcb72', 0.62, 3);

  // 地平线雾气 / 城市光污染
  const haze = ctx.createLinearGradient(0, horizon - 34, 0, horizon + 30);
  haze.addColorStop(0, rgba('#ffb877', 0));
  haze.addColorStop(0.55, rgba('#ff9d5c', 0.22));
  haze.addColorStop(1, rgba('#ffb877', 0));
  ctx.fillStyle = haze;
  ctx.fillRect(0, horizon - 34, w, 64);

  // 近处城市：屋顶与零星光点
  const fg = ctx.createLinearGradient(0, horizon + 4, 0, h);
  fg.addColorStop(0, '#0d1220');
  fg.addColorStop(1, '#070a12');
  ctx.fillStyle = fg;
  ctx.fillRect(0, horizon + 4, w, h - horizon - 4);
  for (let i = 0; i < 320; i++) {
    const px = rng() * w;
    const py = horizon + 8 + Math.pow(rng(), 0.7) * (h - horizon - 12);
    const a = 0.1 + rng() * 0.55;
    ctx.fillStyle = rng() > 0.75 ? rgba('#9fd8ff', a * 0.6) : rgba('#ffca7a', a);
    ctx.fillRect(px, py, 1.6 + rng() * 1.8, 1.2 + rng() * 1.6);
  }
  // 远处的车灯轨迹
  ctx.strokeStyle = rgba('#ffd39a', 0.28);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, h - 12);
  ctx.quadraticCurveTo(w * 0.5, h - 30, w, h - 16);
  ctx.stroke();
});

/* ------------------------------------------------------------------ */
/* 阳台栏杆（挡在玩家前面，所以单独放高层）                              */
/* ------------------------------------------------------------------ */

define('balconyRail', BALCONY.w, 46, (ctx, w, _h) => {
  // 顶部扶手
  const rg = ctx.createLinearGradient(0, 0, 0, 10);
  rg.addColorStop(0, '#e7e4da');
  rg.addColorStop(0.5, '#c9c6ba');
  rg.addColorStop(1, '#9d9b90');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 4, w, 9);
  ctx.fillStyle = rgba('#ffffff', 0.5);
  ctx.fillRect(0, 4, w, 1.6);

  // 下横杆
  ctx.fillStyle = '#b6b3a7';
  ctx.fillRect(0, 34, w, 6);
  ctx.fillStyle = rgba('#3f3729', 0.28);
  ctx.fillRect(0, 40, w, 3);

  // 竖向栏杆
  for (let x = 8; x < w; x += 15) {
    const g = ctx.createLinearGradient(x, 0, x + 4, 0);
    g.addColorStop(0, '#e2dfd4');
    g.addColorStop(0.5, '#c2bfb3');
    g.addColorStop(1, '#93917f');
    ctx.fillStyle = g;
    ctx.fillRect(x, 12, 4, 23);
  }
  // 立柱
  for (const px of [6, w / 2 - 4, w - 12]) {
    ctx.fillStyle = '#a9a79a';
    ctx.fillRect(px, 4, 7, 38);
    ctx.fillStyle = rgba('#ffffff', 0.28);
    ctx.fillRect(px, 4, 2, 38);
  }
  // 栏杆挂的小盆栽
  ctx.fillStyle = '#8f6a45';
  fillRr(ctx, w * 0.28, 20, 14, 12, 3, '#9c7346');
  fillEllipse(ctx, w * 0.28 + 7, 18, 10, 7, '#4f7a45');
  fillEllipse(ctx, w * 0.28 + 3, 15, 6, 5, '#63955a');
  fillRr(ctx, w * 0.78, 22, 12, 10, 3, '#9c7346');
  fillEllipse(ctx, w * 0.78 + 6, 20, 8, 6, '#456d3e');
});

/* ------------------------------------------------------------------ */
/* 晾衣绳上的衣服                                                       */
/* ------------------------------------------------------------------ */

define('laundry', 240, 74, (ctx, w, _h) => {
  // 绳子
  ctx.strokeStyle = rgba('#e8e4d8', 0.85);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.quadraticCurveTo(w / 2, 16, w, 8);
  ctx.stroke();

  const drape = (x: number, cw: number, ch: number, col: string, shadow: string) => {
    const top = 9 + Math.sin((x / w) * Math.PI) * 6;
    ctx.save();
    ctx.translate(x, top);
    ctx.rotate(0.02 * (Math.random() - 0.5));
    // 衣架
    ctx.strokeStyle = rgba('#c8ccd0', 0.9);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(cw / 2, -6);
    ctx.lineTo(cw / 2, 2);
    ctx.moveTo(2, 6);
    ctx.lineTo(cw / 2, 1);
    ctx.lineTo(cw - 2, 6);
    ctx.stroke();
    // 布料
    const g = ctx.createLinearGradient(0, 0, cw, ch);
    g.addColorStop(0, shade(col, 0.1));
    g.addColorStop(0.55, col);
    g.addColorStop(1, shadow);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cw * 0.12, 4);
    ctx.quadraticCurveTo(cw * 0.5, -2, cw * 0.88, 4);
    ctx.quadraticCurveTo(cw * 1.02, ch * 0.5, cw * 0.92, ch * 0.92);
    ctx.quadraticCurveTo(cw * 0.5, ch * 1.02, cw * 0.08, ch * 0.92);
    ctx.quadraticCurveTo(-cw * 0.02, ch * 0.5, cw * 0.12, 4);
    ctx.closePath();
    ctx.fill();
    // 折痕
    ctx.strokeStyle = rgba('#000000', 0.12);
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cw * (0.2 + i * 0.22), 6);
      ctx.quadraticCurveTo(cw * (0.24 + i * 0.22), ch * 0.5, cw * (0.2 + i * 0.22), ch * 0.9);
      ctx.stroke();
    }
    ctx.restore();
  };

  drape(14, 40, 46, '#e6e2d6', '#c2bdaf');
  drape(64, 34, 40, '#6f8fa8', '#4f6a80');
  drape(110, 30, 34, '#c98a86', '#9d6a68');
  drape(150, 42, 30, '#dfe4e2', '#b8bfbd');
  drape(200, 30, 44, '#5d6b78', '#414c57');
});

define('pottedPlant', 34, 40, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 3, 14, 5, 0.26);
  // 花盆
  fillPoly(ctx, [
    [6, h - 20],
    [w - 6, h - 20],
    [w - 9, h - 2],
    [9, h - 2],
  ], '#b06a4c');
  ctx.fillStyle = rgba('#ffffff', 0.18);
  ctx.fillRect(8, h - 18, 4, 15);
  fillRr(ctx, 4, h - 23, w - 8, 6, 2, '#c07a58');
  // 叶子
  const leaves: [number, number, number, string][] = [
    [w / 2, h - 30, -1.3, '#4f7a45'],
    [w / 2 + 6, h - 32, -0.4, '#5f9253'],
    [w / 2 - 6, h - 32, -2.1, '#456d3e'],
    [w / 2 + 2, h - 40, -0.9, '#6ba35d'],
    [w / 2 - 2, h - 38, 0.9, '#598a4d'],
  ];
  for (const [px, py, rot, col] of leaves) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    fillEllipse(ctx, 0, -8, 5.5, 11, col);
    ctx.strokeStyle = rgba('#2f4a2a', 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(0, -17);
    ctx.stroke();
    ctx.restore();
  }
});

define('washer', 58, 62, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 3, 26, 6, 0.28);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#f0eee6');
  g.addColorStop(1, '#cfccc0');
  fillRr(ctx, 2, 4, w - 4, h - 8, 4, g);
  ctx.fillStyle = rgba('#ffffff', 0.6);
  ctx.fillRect(4, 6, w - 8, 2);
  // 上盖面板
  ctx.fillStyle = '#dcdfe0';
  ctx.fillRect(6, 8, w - 12, 10);
  fillEllipse(ctx, w - 13, 13, 3.4, 3.4, '#6fbf7a');
  // 观察窗
  fillEllipse(ctx, w / 2, h * 0.62, 17, 15, '#8a8f92');
  fillEllipse(ctx, w / 2, h * 0.62, 14, 12.4, '#5f6970');
  const wg = ctx.createLinearGradient(0, h * 0.62 - 12, 0, h * 0.62 + 12);
  wg.addColorStop(0, '#8fb6c4');
  wg.addColorStop(1, '#4f6b78');
  fillEllipse(ctx, w / 2, h * 0.62, 11.5, 10, wg);
  fillEllipse(ctx, w / 2 - 4, h * 0.62 - 4, 4, 3, rgba('#ffffff', 0.4));
});

define('airconUnit', 44, 40, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 3, 20, 5, 0.24);
  fillRr(ctx, 1, 2, w - 2, h - 6, 3, '#dcd9d0');
  const g = ctx.createLinearGradient(0, 2, 0, h - 4);
  g.addColorStop(0, '#eae7de');
  g.addColorStop(1, '#c4c1b6');
  ctx.fillStyle = g;
  ctx.fillRect(3, 4, w - 6, h - 10);
  fillEllipse(ctx, w / 2, h * 0.46, 14, 13, '#8d9296');
  ctx.strokeStyle = rgba('#6d7376', 0.9);
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(w / 2 - 13 + i * 5, h * 0.46 - 11);
    ctx.lineTo(w / 2 - 13 + i * 5, h * 0.46 + 11);
    ctx.stroke();
  }
  ctx.fillStyle = rgba('#8d9296', 0.35);
  ctx.fillRect(3, h - 8, w - 6, 3);
});

/* ------------------------------------------------------------------ */
/* 走廊物件                                                            */
/* ------------------------------------------------------------------ */

define('stairsDown', 132, 156, (ctx, w, h) => {
  // 洞口外沿（地面被切开的一道边）
  fillRr(ctx, 0, 0, w, h, 4, '#6d6a60');
  ctx.fillStyle = rgba('#ffffff', 0.14);
  ctx.fillRect(0, 0, w, 2.5);

  // 里面的井
  const g = ctx.createLinearGradient(0, 4, 0, h);
  g.addColorStop(0, '#241f1a');
  g.addColorStop(1, '#0f0d0b');
  ctx.fillStyle = g;
  fillRr(ctx, 4, 4, w - 8, h - 8, 3, g);

  // 一级级往下：越往里越窄、越暗（下来才是我们的方向）
  for (let i = 0; i < 8; i++) {
    const t = i / 8;
    const inset = 8 + i * 5;
    const y = h - 16 - i * 16.5;
    const col = shade('#b9b6a9', -0.3 - t * 0.62);
    // 踏面
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(inset, y);
    ctx.lineTo(w - inset, y);
    ctx.lineTo(w - inset - 1.6, y - 11);
    ctx.lineTo(inset + 1.6, y - 11);
    ctx.closePath();
    ctx.fill();
    // 踢面亮线
    ctx.fillStyle = rgba('#ffffff', 0.2 - t * 0.16);
    ctx.fillRect(inset, y - 11, w - inset * 2, 1.8);
    // 踏面外沿的暗线
    ctx.fillStyle = rgba('#000000', 0.34);
    ctx.fillRect(inset, y - 1.6, w - inset * 2, 1.6);
  }

  // 两侧扶手
  ctx.strokeStyle = rgba('#d3d6d4', 0.5);
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(11, h - 6);
  ctx.lineTo(w * 0.22, 10);
  ctx.moveTo(w - 11, h - 6);
  ctx.lineTo(w * 0.78, 10);
  ctx.stroke();
  ctx.strokeStyle = rgba('#000000', 0.35);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(11, h - 6);
  ctx.lineTo(w * 0.22, 10);
  ctx.moveTo(w - 11, h - 6);
  ctx.lineTo(w * 0.78, 10);
  ctx.stroke();
});

define('waterDispenser', 34, 52, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 3, 15, 5, 0.26);
  fillRr(ctx, 2, 12, w - 4, h - 16, 3, '#eceae0');
  const g = ctx.createLinearGradient(0, 12, 0, h - 4);
  g.addColorStop(0, '#f4f2e9');
  g.addColorStop(1, '#cdc9bb');
  ctx.fillStyle = g;
  ctx.fillRect(4, 14, w - 8, h - 20);
  // 水桶
  fillRr(ctx, 6, 0, w - 12, 16, 5, rgba('#7fb6d6', 0.85));
  ctx.fillStyle = rgba('#ffffff', 0.3);
  ctx.fillRect(8, 3, 4, 11);
  // 龙头
  ctx.fillStyle = '#4f8fb8';
  ctx.fillRect(w / 2 - 7, 24, 14, 5);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(w / 2 - 6, 30, 5, 4);
  ctx.fillStyle = '#3f7fc4';
  ctx.fillRect(w / 2 + 1, 30, 5, 4);
  // 接水槽
  fillRr(ctx, 7, 38, w - 14, 10, 2, '#b9b6aa');
});

define('corridorBin', 30, 32, (ctx, w, h) => {
  groundShadow(ctx, w / 2, h - 2, 13, 4, 0.24);
  fillPoly(ctx, [
    [4, 8],
    [w - 4, 8],
    [w - 7, h - 2],
    [7, h - 2],
  ], '#5d6166');
  ctx.fillStyle = rgba('#ffffff', 0.16);
  ctx.fillRect(7, 10, 3, h - 14);
  fillRr(ctx, 2, 4, w - 4, 7, 3, '#4a4e53');
  fillEllipse(ctx, w / 2, 7, 9, 2.6, '#2f3337');
});

define('doorMat', 56, 22, (ctx, w, h) => {
  fillRr(ctx, 0, 0, w, h, 2, '#8c7f66');
  ctx.fillStyle = rgba('#6d6250', 0.55);
  for (let i = 0; i < 6; i++) ctx.fillRect(4, 3 + i * 3, w - 8, 1.2);
  ctx.strokeStyle = rgba('#5a5040', 0.6);
  ctx.lineWidth = 1.4;
  ctx.strokeRect(1, 1, w - 2, h - 2);
});

define('posterL', 40, 52, (ctx, w, h) => {
  fillRr(ctx, 0, 0, w, h, 2, '#f2ece0');
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#9cc2d8');
  g.addColorStop(1, '#4f7f9e');
  ctx.fillStyle = g;
  ctx.fillRect(3, 3, w - 6, h * 0.55);
  fillEllipse(ctx, w * 0.7, h * 0.22, 7, 7, rgba('#fff4cf', 0.85));
  ctx.fillStyle = '#7f9a63';
  ctx.beginPath();
  ctx.moveTo(3, h * 0.58);
  ctx.lineTo(w * 0.5, h * 0.42);
  ctx.lineTo(w - 3, h * 0.6);
  ctx.lineTo(w - 3, h * 0.74);
  ctx.lineTo(3, h * 0.74);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgba('#4a4438', 0.65);
  for (let i = 0; i < 3; i++) ctx.fillRect(6, h * 0.78 + i * 4, w - 12 - i * 5, 1.6);
});
