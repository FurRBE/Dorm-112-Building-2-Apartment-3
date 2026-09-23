import Phaser from 'phaser';
import { img, num } from '../core/canvas';
import { C } from '../core/palette';
import { bus, EV } from '../core/bus';
import { flags, input } from '../core/input';
import { sfx } from '../core/audio';
import { state, talkedCount, ROOMMATES } from '../core/state';
import { CAST } from '../data/cast';
import type { Line, Reply, Speaker } from '../data/dialogues';
import type { SayRequest } from './RoomScene';

const W = 1080;
const H = 720;
const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif';

interface DlgState {
  lines: Line[];
  replies?: Reply[];
  onDone?: () => void;
}

export class UIScene extends Phaser.Scene {
  private dlg: DlgState | null = null;
  private idx = 0;
  private revealed = 0;
  private typing = false;
  private repliesUsed = false;
  private typeTimer: Phaser.Time.TimerEvent | null = null;

  private box!: Phaser.GameObjects.Container;
  private portrait!: Phaser.GameObjects.Image;
  private portraitPlate!: Phaser.GameObjects.Graphics;
  private nameText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private optionLayer!: Phaser.GameObjects.Container;
  private questPlate!: Phaser.GameObjects.Graphics;
  private questText!: Phaser.GameObjects.Text;
  private questCount!: Phaser.GameObjects.Text;
  private nameBg!: Phaser.GameObjects.Graphics;
  private questDots: Phaser.GameObjects.Graphics[] = [];
  private banner!: Phaser.GameObjects.Container;
  private bannerText!: Phaser.GameObjects.Text;
  private bannerBg!: Phaser.GameObjects.Graphics;
  private toastText!: Phaser.GameObjects.Text;
  private toastPlate!: Phaser.GameObjects.Graphics;
  private toastTween: Phaser.Tweens.Tween | null = null;

  private stick!: Phaser.GameObjects.Container;
  private stickBase!: Phaser.GameObjects.Graphics;
  private stickKnob!: Phaser.GameObjects.Graphics;
  private stickPointer = -1;
  private stickOrigin = new Phaser.Math.Vector2();
  private touchMode = false;

  private endingLayer!: Phaser.GameObjects.Container;
  private muteBtn!: Phaser.GameObjects.Container;

  constructor() {
    super('ui');
  }

  create(): void {
    this.touchMode = this.sys.game.device.input.touch;

    // 屏幕空间的后处理：暗角 + 暖色
    this.add.image(W / 2, H / 2, 'vignette').setDepth(0);
    const warm = this.add.image(W / 2, H / 2, 'warmTint').setDepth(1);
    warm.setBlendMode(Phaser.BlendModes.ADD);
    warm.setAlpha(0.75);

    this.buildHud();
    this.buildDialogue();
    this.buildBanner();
    this.buildToast();
    if (this.touchMode) this.buildTouchControls();
    this.buildEnding();

    bus.on(EV.DIALOGUE, this.openDialogue, this);
    bus.on(EV.TOAST, this.showToast, this);
    bus.on(EV.BANNER, this.showBanner, this);
    bus.on(EV.QUEST, this.refreshQuest, this);
    bus.on(EV.ENDING, this.showEnding, this);

    const kb = this.input.keyboard;
    kb?.on('keydown-E', () => this.advanceOrInteract());
    kb?.on('keydown-SPACE', () => this.advanceOrInteract());
    kb?.on('keydown-ENTER', () => this.advanceOrInteract());
    kb?.on('keydown-F', () => this.advanceOrInteract());

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.dlg) this.advance();
      else if (this.touchMode) void p;
    });

    this.refreshQuest(talkedCount());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      bus.off(EV.DIALOGUE, this.openDialogue, this);
      bus.off(EV.TOAST, this.showToast, this);
      bus.off(EV.BANNER, this.showBanner, this);
      bus.off(EV.QUEST, this.refreshQuest, this);
      bus.off(EV.ENDING, this.showEnding, this);
    });
  }

  /* ------------------------------------------------------------ */
  /* HUD                                                           */
  /* ------------------------------------------------------------ */

  private buildHud(): void {
    // 任务：今晚的搭话
    this.questPlate = this.add.graphics().setDepth(10);
    this.questText = this.add
      .text(0, 0, '', {
        fontFamily: FONT,
        fontSize: '19px',
        color: C.uiText,
      })
      .setDepth(11)
      .setOrigin(0, 0.5);
    for (let i = 0; i < 4; i++) {
      this.questDots.push(this.add.graphics().setDepth(11));
    }
    const tip = this.touchMode
      ? '左下摇杆移动 · 右下按键交互'
      : 'WASD / ↑↓←→ 移动 · E 交互 · Shift 快走';
    this.add
      .text(W - 28, H - 22, tip, {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#cabfa6',
      })
      .setOrigin(1, 0.5)
      .setAlpha(0.5)
      .setDepth(11);

    // 声音开关
    this.muteBtn = this.add.container(W - 70, 24).setDepth(12);
    const mcg = this.add.graphics();
    mcg.fillStyle(num(C.ink), 0.7);
    mcg.fillRoundedRect(0, 0, 48, 36, 10);
    mcg.lineStyle(1.2, num(C.uiDim), 0.5);
    mcg.strokeRoundedRect(0, 0, 48, 36, 10);
    mcg.fillStyle(num(C.uiText), 0.9);
    mcg.fillRect(16, 13, 5, 10);
    mcg.fillTriangle(21, 9, 21, 27, 30, 18);
    mcg.lineStyle(2, num(C.uiText), 0.9);
    mcg.beginPath();
    mcg.arc(33, 18, 6, -0.9, 0.9);
    mcg.strokePath();
    this.muteBtn.add(mcg);
    this.muteBtn.setSize(48, 36);
    this.muteBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 48, 36), Phaser.Geom.Rectangle.Contains);
    this.muteBtn.on('pointerdown', () => {
      const m = sfx.toggleMute();
      this.showToast(m ? '声音：关' : '声音：开');
      mcg.setAlpha(m ? 0.45 : 1);
    });

    this.refreshQuest(0);
  }

  private refreshQuest(n: number): void {
    const x = W - 300;
    const y = 42;
    const w = 236;
    const h = 52;
    const g = this.questPlate;
    g.clear();
    g.fillStyle(num(C.ink), 0.72);
    g.fillRoundedRect(x, y - h / 2, w, h, 12);
    g.lineStyle(1.3, num(C.accent), 0.6);
    g.strokeRoundedRect(x, y - h / 2, w, h, 12);
    this.questText.setText('今晚的搭话');
    this.questText.setPosition(x + 18, y - 2);
    if (!this.questCount) {
      this.questCount = this.add
        .text(0, 0, '0/4', { fontFamily: FONT, fontSize: '18px', color: C.uiDim })
        .setOrigin(1, 0.5)
        .setDepth(12);
    }
    ROOMMATES.forEach((id, i) => {
      const dot = this.questDots[i];
      dot.clear();
      const done = state.talked.has(id);
      dot.fillStyle(done ? num(C.accent) : num(C.uiDim), done ? 1 : 0.22);
      dot.fillCircle(x + 150 + i * 20, y - 1, done ? 6.5 : 5.5);
      if (done) {
        dot.lineStyle(1.4, num('#ffffff'), 0.55);
        dot.strokeCircle(x + 150 + i * 20, y - 1, 6.5);
      }
    });
    this.questCount.setText(`${n}/4`);
    this.questCount.setColor(n >= 4 ? C.accent : C.uiDim);
    this.questCount.setPosition(x + w - 18, y - 1);
  }

  /* ------------------------------------------------------------ */
  /* 对话框                                                        */
  /* ------------------------------------------------------------ */

  private buildDialogue(): void {
    this.box = this.add.container(0, 0).setDepth(50).setVisible(false);
    const g = this.add.graphics();
    const bx = 64;
    const by = 434;
    const bw = W - 128;
    const bh = 244;
    g.fillStyle(num('#141210'), 0.9);
    g.fillRoundedRect(bx, by, bw, bh, 20);
    g.lineStyle(2, num(C.accent), 0.55);
    g.strokeRoundedRect(bx, by, bw, bh, 20);
    g.lineStyle(1, num('#ffffff'), 0.06);
    g.strokeRoundedRect(bx + 4, by + 4, bw - 8, bh - 8, 17);

    this.portraitPlate = this.add.graphics();
    this.portraitPlate.fillStyle(num('#0d0c0a'), 0.9);
    this.portraitPlate.fillRoundedRect(bx + 26, by + 26, 152, 152, 16);
    this.portraitPlate.lineStyle(2, num(C.accent), 0.4);
    this.portraitPlate.strokeRoundedRect(bx + 26, by + 26, 152, 152, 16);

    this.portrait = img(this, 'face_you', bx + 26 + 76, by + 26 + 76, 0.5, 0.5);
    this.portrait.setScale(1);

    this.nameBg = this.add.graphics();
    this.nameBg.fillStyle(num(C.accent), 0.92);
    this.nameBg.fillRoundedRect(bx + 200, by + 24, 168, 42, 12);
    this.nameText = this.add
      .text(bx + 284, by + 45, '', {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#1d2612',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5);

    this.bodyText = this.add.text(bx + 202, by + 86, '', {
      fontFamily: FONT,
      fontSize: '26px',
      color: C.uiText,
      lineSpacing: 12,
      wordWrap: { width: bw - 250, useAdvancedWrap: true },
    });

    this.hint = this.add
      .text(bx + bw - 26, by + bh - 20, this.touchMode ? '点按继续 ▼' : 'E / 空格 继续 ▼', {
        fontFamily: FONT,
        fontSize: '16px',
        color: C.uiDim,
      })
      .setOrigin(1, 0.5);
    this.tweens.add({
      targets: this.hint,
      alpha: { from: 0.35, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    this.box.add([
      g,
      this.portraitPlate,
      this.portrait,
      this.nameBg,
      this.nameText,
      this.bodyText,
      this.hint,
    ]);

    this.optionLayer = this.add.container(0, 0).setDepth(60).setVisible(false);
  }

  private openDialogue(req: SayRequest): void {
    if (!req || !req.lines?.length) return;
    this.dlg = { lines: req.lines, replies: req.replies, onDone: req.onDone };
    this.idx = 0;
    this.repliesUsed = false;
    flags.locked = true;
    this.hideOptions();
    this.box.setVisible(true);
    this.renderLine();
  }

  private renderLine(): void {
    const d = this.dlg;
    if (!d) return;
    const line = d.lines[this.idx];
    const who = line.who;
    const isNarration = who === 'narration';

    if (isNarration) {
      this.portraitPlate.setVisible(false);
      this.portrait.setVisible(false);
      this.nameText.setText('旁白');
      this.nameText.setColor('#efe6cf');
      this.bodyText.setColor('#d8d2c2');
      this.bodyText.setFontStyle('italic');
      this.bodyText.setX(116);
      const bg = this.nameBg;
      bg.clear();
      bg.fillStyle(num('#3a3630'), 0.95);
      bg.fillRoundedRect(64 + 200, 434 + 24, 96, 42, 12);
    } else {
      const m = CAST[who as Exclude<Speaker, 'narration'>];
      this.portraitPlate.setVisible(true);
      this.portrait.setVisible(true);
      this.portrait.setTexture(`face_${m.id}`);
      this.nameText.setText(m.name);
      this.nameText.setColor('#1d2612');
      this.bodyText.setColor(C.uiText);
      this.bodyText.setFontStyle('normal');
      this.bodyText.setX(266);
      const bg = this.nameBg;
      bg.clear();
      bg.fillStyle(num(m.bg), 0.95);
      bg.fillRoundedRect(64 + 200, 434 + 24, m.name.length > 2 ? 168 : 140, 42, 12);
    }

    this.bodyText.setText(line.text);
    this.revealed = 0;
    this.typing = true;
    this.bodyText.setText('');
    this.typeTimer?.remove();
    this.typeTimer = this.time.addEvent({
      delay: 22,
      repeat: line.text.length - 1,
      callback: () => {
        this.revealed++;
        this.bodyText.setText(line.text.slice(0, this.revealed));
        if (this.revealed % 4 === 0) sfx.talk();
        if (this.revealed >= line.text.length) {
          this.typing = false;
          sfx.talk();
        }
      },
    });
  }

  private advanceOrInteract(): void {
    if (this.dlg) this.advance();
    else bus.emit(EV.INTERACT);
  }

  private advance(): void {
    const d = this.dlg;
    if (!d || this.endingLayer.visible) return;
    if (this.optionLayer.visible) return;
    if (this.typing) {
      this.typeTimer?.remove();
      this.typing = false;
      this.bodyText.setText(d.lines[this.idx].text);
      return;
    }
    this.idx++;
    if (this.idx < d.lines.length) {
      this.renderLine();
      return;
    }
    if (d.replies?.length && !this.repliesUsed) {
      this.showOptions(d.replies);
      return;
    }
    this.closeDialogue();
  }

  private showOptions(replies: Reply[]): void {
    this.hideOptions();
    this.optionLayer.setVisible(true);
    const h = 54;
    const gapX = 14;
    const baseY = 420 - h;
    let totalW = 0;
    const widths: number[] = [];
    replies.forEach((r, i) => {
      const tw = Math.max(150, r.label.length * 22 + 52);
      widths[i] = tw;
      totalW += tw + gapX;
    });
    totalW -= gapX;
    let x = 96;
    if (totalW > W - 200) {
      // 太宽就竖着排
      replies.forEach((r, i) => {
        this.makeOption(r, 96, baseY - i * (h + 12), widths[i], h);
      });
      return;
    }
    for (let i = 0; i < replies.length; i++) {
      this.makeOption(replies[i], x, baseY, widths[i], h);
      x += widths[i] + gapX;
    }
  }

  private makeOption(r: Reply, x: number, y: number, w: number, h: number): void {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(num('#1b1916'), 0.94);
    g.fillRoundedRect(0, 0, w, h, 12);
    g.lineStyle(1.6, num(C.accent), 0.7);
    g.strokeRoundedRect(0, 0, w, h, 12);
    g.fillStyle(num(C.accent), 1);
    g.fillRoundedRect(0, 12, 4, h - 24, 2);
    const t = this.add
      .text(w / 2 + 6, h / 2, r.label, {
        fontFamily: FONT,
        fontSize: '22px',
        color: C.uiText,
      })
      .setOrigin(0.5, 0.5);
    c.add([g, t]);
    c.setSize(w, h);
    c.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    c.on('pointerover', () => {
      g.clear();
      g.fillStyle(num(C.accent), 0.22);
      g.fillRoundedRect(0, 0, w, h, 12);
      g.lineStyle(2, num(C.accent), 1);
      g.strokeRoundedRect(0, 0, w, h, 12);
      g.fillStyle(num(C.accent), 1);
      g.fillRoundedRect(0, 12, 4, h - 24, 2);
      t.setColor('#ffffff');
    });
    c.on('pointerout', () => {
      g.clear();
      g.fillStyle(num('#1b1916'), 0.94);
      g.fillRoundedRect(0, 0, w, h, 12);
      g.lineStyle(1.6, num(C.accent), 0.7);
      g.strokeRoundedRect(0, 0, w, h, 12);
      g.fillStyle(num(C.accent), 1);
      g.fillRoundedRect(0, 12, 4, h - 24, 2);
      t.setColor(C.uiText);
    });
    c.on('pointerdown', (p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      void p;
      sfx.click();
      this.pickReply(r);
    });
    this.optionLayer.add(c);
  }

  private hideOptions(): void {
    this.optionLayer.removeAll(true);
    this.optionLayer.setVisible(false);
  }

  private pickReply(r: Reply): void {
    this.repliesUsed = true;
    this.hideOptions();
    const d = this.dlg;
    if (!d) return;
    d.lines = r.lines;
    this.idx = 0;
    this.renderLine();
  }

  private closeDialogue(): void {
    const d = this.dlg;
    this.dlg = null;
    this.typeTimer?.remove();
    this.typeTimer = null;
    this.box.setVisible(false);
    this.hideOptions();
    flags.locked = false;
    if (d?.onDone) d.onDone();
  }

  /* ------------------------------------------------------------ */
  /* 横幅 / 飘字                                                   */
  /* ------------------------------------------------------------ */

  private buildBanner(): void {
    this.banner = this.add.container(W / 2, 118).setDepth(30).setAlpha(0);
    this.bannerBg = this.add.graphics();
    this.bannerText = this.add
      .text(0, 0, '', {
        fontFamily: FONT,
        fontSize: '26px',
        color: C.uiText,
      })
      .setOrigin(0.5, 0.5);
    this.banner.add([this.bannerBg, this.bannerText]);
  }

  private showBanner(text: string): void {
    this.bannerText.setText(text);
    const w = this.bannerText.width + 84;
    const h = 62;
    const g = this.bannerBg;
    g.clear();
    g.fillStyle(num('#141210'), 0.72);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.lineStyle(1.4, num(C.accent), 0.45);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.fillStyle(num(C.accent), 0.9);
    g.fillRect(-w / 2 + 12, -h / 2 + 14, 3, h - 28);
    this.tweens.killTweensOf(this.banner);
    this.banner.setAlpha(0).setY(104);
    this.tweens.add({
      targets: this.banner,
      alpha: 1,
      y: 118,
      duration: 420,
      ease: 'Quad.out',
      onComplete: () => {
        this.tweens.add({
          targets: this.banner,
          alpha: 0,
          delay: 1700,
          duration: 520,
        });
      },
    });
  }

  private buildToast(): void {
    this.toastPlate = this.add.graphics().setDepth(35);
    this.toastText = this.add
      .text(W / 2, 176, '', {
        fontFamily: FONT,
        fontSize: '22px',
        color: C.uiText,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(36)
      .setAlpha(0);
    this.toastPlate.setAlpha(0);
  }

  private showToast(text: string): void {
    this.toastText.setText(text);
    const w = this.toastText.width + 60;
    const h = 50;
    const g = this.toastPlate;
    g.clear();
    g.fillStyle(num('#141210'), 0.86);
    g.fillRoundedRect(W / 2 - w / 2, 176 - h / 2, w, h, 12);
    g.lineStyle(1.2, num(C.accent), 0.5);
    g.strokeRoundedRect(W / 2 - w / 2, 176 - h / 2, w, h, 12);
    this.toastTween?.remove();
    this.toastText.setAlpha(0).setY(190);
    this.toastPlate.setAlpha(0);
    this.toastTween = this.tweens.add({
      targets: [this.toastText, this.toastPlate],
      alpha: 1,
      duration: 220,
      onComplete: () => {
        this.tweens.add({
          targets: [this.toastText, this.toastPlate],
          alpha: 0,
          delay: 1400,
          duration: 420,
        });
      },
    });
    this.tweens.add({ targets: this.toastText, y: 176, duration: 260, ease: 'Quad.out' });
  }

  /* ------------------------------------------------------------ */
  /* 触屏操作                                                      */
  /* ------------------------------------------------------------ */

  private buildTouchControls(): void {
    this.stick = this.add.container(190, 566).setDepth(40).setAlpha(0.62);
    this.stickBase = this.add.graphics();
    this.stickBase.fillStyle(num('#0e0d0b'), 0.5);
    this.stickBase.fillCircle(0, 0, 96);
    this.stickBase.lineStyle(2.4, num(C.accent), 0.6);
    this.stickBase.strokeCircle(0, 0, 96);
    this.stickBase.lineStyle(1.4, num('#ffffff'), 0.18);
    this.stickBase.strokeCircle(0, 0, 46);
    this.stickKnob = this.add.graphics();
    this.stickKnob.fillStyle(num(C.accent), 0.85);
    this.stickKnob.fillCircle(0, 0, 38);
    this.stickKnob.lineStyle(2, num('#ffffff'), 0.35);
    this.stickKnob.strokeCircle(0, 0, 38);
    this.stick.add([this.stickBase, this.stickKnob]);

    const zone = this.add
      .zone(0, 0, W, H)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: false });
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.dlg || this.endingLayer.visible) return;
      if (p.x > W * 0.55) return;
      this.stickPointer = p.id;
      this.stickOrigin.set(p.x, p.y);
      this.stick.setPosition(p.x, p.y).setAlpha(0.9);
      this.stickKnob.setPosition(0, 0);
      input.joystickActive = true;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.id !== this.stickPointer) return;
      let dx = p.x - this.stickOrigin.x;
      let dy = p.y - this.stickOrigin.y;
      const len = Math.hypot(dx, dy);
      const max = 78;
      if (len > max) {
        dx = (dx / len) * max;
        dy = (dy / len) * max;
      }
      this.stickKnob.setPosition(dx, dy);
      const nx = dx / max;
      const ny = dy / max;
      const mag = Math.hypot(nx, ny);
      if (mag < 0.16) {
        input.jx = 0;
        input.jy = 0;
      } else {
        input.jx = nx;
        input.jy = ny;
      }
    });
    const release = (p: Phaser.Input.Pointer) => {
      if (p.id !== this.stickPointer) return;
      this.stickPointer = -1;
      input.jx = 0;
      input.jy = 0;
      input.joystickActive = false;
      this.stick.setAlpha(0.62);
      this.stickKnob.setPosition(0, 0);
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    // 交互键
    const btn = this.add.container(W - 170, 566).setDepth(40);
    const bg = this.add.graphics();
    bg.fillStyle(num('#0e0d0b'), 0.5);
    bg.fillCircle(0, 0, 78);
    bg.lineStyle(2.6, num(C.accent), 0.75);
    bg.strokeCircle(0, 0, 78);
    bg.fillStyle(num(C.accent), 0.9);
    bg.fillCircle(0, 0, 62);
    const label = this.add
      .text(0, 0, '交互', {
        fontFamily: FONT,
        fontSize: '26px',
        color: '#1d2612',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5);
    btn.add([bg, label]);
    const hit = this.add.circle(W - 170, 566, 78, 0x000000, 0.001);
    hit.setInteractive(new Phaser.Geom.Circle(78, 78, 78), Phaser.Geom.Circle.Contains);
    hit.on('pointerdown', () => {
      sfx.click();
      this.advanceOrInteract();
    });
    btn.setAlpha(0.92);
  }

  /* ------------------------------------------------------------ */
  /* 结算                                                          */
  /* ------------------------------------------------------------ */

  private buildEnding(): void {
    this.endingLayer = this.add.container(0, 0).setDepth(80).setVisible(false);
    const bg = this.add.graphics();
    bg.fillStyle(0x0b0a09, 0.92);
    bg.fillRect(0, 0, W, H);
    const inner = this.add.graphics();
    inner.lineStyle(1.6, num(C.accent), 0.5);
    inner.strokeRoundedRect(80, 80, W - 160, H - 160, 22);
    const t1 = this.add
      .text(W / 2, 210, '第 一 夜 · 完', {
        fontFamily: FONT,
        fontSize: '62px',
        color: C.uiText,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5);
    const t2 = this.add
      .text(W / 2, 286, '112 寝 · 2栋 3号房', {
        fontFamily: FONT,
        fontSize: '24px',
        color: C.accent,
      })
      .setOrigin(0.5, 0.5);
    const t3 = this.add
      .text(
        W / 2,
        380,
        '今晚你和四位舍友都说了话。\n绿色柜子的灯灭了，吊扇慢慢停下来。\n\n走过的房间： 寝室 · 阳台 · 走廊',
        {
          fontFamily: FONT,
          fontSize: '24px',
          color: '#ded6c3',
          align: 'center',
          lineSpacing: 14,
        },
      )
      .setOrigin(0.5, 0.5);
    const btn = this.add.container(W / 2 - 140, 522);
    const bg2 = this.add.graphics();
    bg2.fillStyle(num(C.accent), 0.95);
    bg2.fillRoundedRect(0, 0, 280, 68, 16);
    const bt = this.add
      .text(140, 34, '再 玩 一 次', {
        fontFamily: FONT,
        fontSize: '26px',
        color: '#1d2612',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5);
    btn.add([bg2, bt]);
    btn.setSize(280, 68);
    btn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 280, 68), Phaser.Geom.Rectangle.Contains);
    btn.on('pointerdown', () => this.restart());
    const tip = this.add
      .text(W / 2, H - 118, '按 M 静音开关声音', {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#8f8878',
      })
      .setOrigin(0.5, 0.5);
    this.endingLayer.add([bg, inner, t1, t2, t3, btn, tip]);
  }

  private showEnding(): void {
    this.endingLayer.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.endingLayer, alpha: 1, duration: 900 });
    this.box.setVisible(false);
    flags.locked = true;
  }

  private restart(): void {
    state.talked.clear();
    state.started = false;
    state.finished = false;
    state.from = '';
    state.location = 'dorm';
    input.jx = 0;
    input.jy = 0;
    flags.locked = false;
    flags.switching = false;
    this.dlg = null;
    this.endingLayer.setVisible(false);
    this.box.setVisible(false);
    this.hideOptions();
    this.refreshQuest(0);
    for (const key of ['dorm', 'balcony', 'corridor']) {
      if (this.scene.isActive(key)) this.scene.stop(key);
    }
    this.scene.start('dorm');
  }
}
