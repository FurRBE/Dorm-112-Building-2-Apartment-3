import { CAST, CAST_ORDER } from '../data/cast';
import type { CastMember } from '../data/cast';
import { define, fillEllipse, fillPoly, fillRr, rgba, shade } from '../core/canvas';

const S = 76;

function bust(ctx: CanvasRenderingContext2D, m: CastMember): void {
  const cx = S / 2;

  // 背景：圆形 + 斜向高光
  const bg = ctx.createLinearGradient(0, 0, S, S);
  bg.addColorStop(0, shade(m.bg, 0.18));
  bg.addColorStop(1, shade(m.bg, -0.34));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = rgba('#ffffff', 0.06);
  ctx.beginPath();
  ctx.moveTo(0, S * 0.62);
  ctx.lineTo(S * 0.55, 0);
  ctx.lineTo(S, 0);
  ctx.lineTo(0, S);
  ctx.closePath();
  ctx.fill();

  // 肩膀 / 衣服
  ctx.fillStyle = m.shirt;
  ctx.beginPath();
  ctx.moveTo(cx - 30, S);
  ctx.quadraticCurveTo(cx - 28, S - 26, cx - 12, S - 33);
  ctx.lineTo(cx + 12, S - 33);
  ctx.quadraticCurveTo(cx + 28, S - 26, cx + 30, S);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = m.shirtDark;
  ctx.beginPath();
  ctx.moveTo(cx - 6, S - 33);
  ctx.lineTo(cx + 6, S - 33);
  ctx.lineTo(cx + 7, S);
  ctx.lineTo(cx - 7, S);
  ctx.closePath();
  ctx.fill();

  // 脖子
  ctx.fillStyle = m.skinDark;
  fillRr(ctx, cx - 8, S - 40, 16, 12, 4, m.skinDark);

  // 头
  const hy = S - 52;
  fillEllipse(ctx, cx, hy, 17, 19, m.skin);
  // 腮红
  fillEllipse(ctx, cx - 11, hy + 6, 4, 2.6, rgba(m.skinDark, 0.5));
  fillEllipse(ctx, cx + 11, hy + 6, 4, 2.6, rgba(m.skinDark, 0.5));
  // 下颌阴影
  fillEllipse(ctx, cx, hy + 14, 12, 5, rgba(m.skinDark, 0.28));

  // 头发
  ctx.fillStyle = m.hair;
  if (m.hairStyle === 'buzz') {
    ctx.beginPath();
    ctx.ellipse(cx, hy - 4, 17.4, 17, 0, Math.PI * 1.02, Math.PI * 1.98);
    ctx.fill();
    ctx.fillRect(cx - 17.4, hy - 6, 34.8, 5);
  } else if (m.hairStyle === 'bowl') {
    ctx.beginPath();
    ctx.ellipse(cx, hy - 2, 18.6, 18, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 18.6, hy - 4, 37.2, 9);
    ctx.beginPath();
    ctx.ellipse(cx - 16.4, hy + 4, 4, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 16.4, hy + 4, 4, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (m.hairStyle === 'messy') {
    ctx.beginPath();
    ctx.ellipse(cx, hy - 4, 18, 17.4, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + (i + 0.5) * (Math.PI / 5);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 12, hy - 6 + Math.sin(a) * 8);
      ctx.lineTo(cx + Math.cos(a - 0.3) * 20, hy - 12 + Math.sin(a - 0.3) * 14);
      ctx.lineTo(cx + Math.cos(a + 0.3) * 20, hy - 10 + Math.sin(a + 0.3) * 14);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    ctx.beginPath();
    ctx.ellipse(cx, hy - 3, 17.8, 17.6, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 17.8, hy - 6, 35.6, 7);
    // 侧鬓
    ctx.beginPath();
    ctx.ellipse(cx - 16, hy - 2, 3.4, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 16, hy - 2, 3.4, 6, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 眉眼
  ctx.fillStyle = '#2a2320';
  fillEllipse(ctx, cx - 6.4, hy + 1, 2.1, 2.3, '#2a2320');
  fillEllipse(ctx, cx + 6.4, hy + 1, 2.1, 2.3, '#2a2320');
  ctx.fillStyle = rgba('#ffffff', 0.85);
  fillEllipse(ctx, cx - 5.7, hy + 0.3, 0.7, 0.7, rgba('#ffffff', 0.85));
  fillEllipse(ctx, cx + 7.1, hy + 0.3, 0.7, 0.7, rgba('#ffffff', 0.85));
  ctx.strokeStyle = shade(m.hair, 0.1);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 9.4, hy - 4.4);
  ctx.quadraticCurveTo(cx - 6.4, hy - 5.8, cx - 3.6, hy - 4.4);
  ctx.moveTo(cx + 3.6, hy - 4.4);
  ctx.quadraticCurveTo(cx + 6.4, hy - 5.8, cx + 9.4, hy - 4.4);
  ctx.stroke();
  // 嘴
  ctx.strokeStyle = rgba('#8a4b3c', 0.85);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx - 4, hy + 9.5);
  ctx.quadraticCurveTo(cx, hy + 12, cx + 4, hy + 9.5);
  ctx.stroke();

  // 配饰
  if (m.accessory === 'headphone') {
    ctx.strokeStyle = '#d9d4c6';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(cx, hy - 2, 20, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
    fillRr(ctx, cx - 24, hy - 6, 8, 14, 3.4, '#c9c4b6');
    fillRr(ctx, cx + 16, hy - 6, 8, 14, 3.4, '#c9c4b6');
  } else if (m.accessory === 'glasses') {
    ctx.strokeStyle = '#3a3f45';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(cx - 12.5, hy - 3.5, 10, 8);
    ctx.strokeRect(cx + 2.5, hy - 3.5, 10, 8);
    ctx.beginPath();
    ctx.moveTo(cx - 2.5, hy);
    ctx.lineTo(cx + 2.5, hy);
    ctx.stroke();
    ctx.fillStyle = rgba('#cfe6f2', 0.22);
    ctx.fillRect(cx - 12.5, hy - 3.5, 10, 8);
    ctx.fillRect(cx + 2.5, hy - 3.5, 10, 8);
  } else if (m.accessory === 'towel') {
    ctx.fillStyle = '#8fb6c4';
    ctx.beginPath();
    ctx.moveTo(cx + 12, S - 34);
    ctx.quadraticCurveTo(cx + 26, S - 26, cx + 24, S - 6);
    ctx.lineTo(cx + 15, S - 6);
    ctx.quadraticCurveTo(cx + 17, S - 24, cx + 8, S - 30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba('#ffffff', 0.25);
    ctx.fillRect(cx + 16, S - 28, 3, 20);
  } else if (m.accessory === 'cap') {
    ctx.fillStyle = '#3f5f8a';
    ctx.beginPath();
    ctx.ellipse(cx, hy - 6, 18.6, 16, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    fillPoly(ctx, [
      [cx - 24, hy - 4],
      [cx + 24, hy - 4],
      [cx + 20, hy + 2],
      [cx - 20, hy + 2],
    ], '#35507a');
  }

  // 暖色轮廓光
  ctx.strokeStyle = rgba('#ffd88c', 0.22);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, hy, 17.4, Math.PI * 1.15, Math.PI * 1.75);
  ctx.stroke();
}

for (const id of CAST_ORDER) {
  define(`face_${id}`, S, S, (ctx) => bust(ctx, CAST[id]));
}
