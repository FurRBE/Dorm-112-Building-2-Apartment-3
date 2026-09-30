import Phaser from 'phaser';
import { img, num } from '../core/canvas';
import { C } from '../core/palette';
import { sfx } from '../core/audio';
import { bus, EV } from '../core/bus';
import { flags, input } from '../core/input';
import { state, LOCATION_NAME } from '../core/state';
import { CAST } from '../data/cast';
import type { CastId } from '../data/cast';
import type { Line, Reply } from '../data/dialogues';
import { Character } from '../entities/Character';
import type { Facing, Pose } from '../entities/Character';
import { Player } from '../entities/Player';
import type { Interactable } from '../world/types';
import type { SceneKey } from '../world/layout';

export interface Spawn {
  x: number;
  y: number;
  facing: Facing;
}

export interface SayRequest {
  lines: Line[];
  replies?: Reply[];
  onDone?: () => void;
}

const SPEED = 118;
const SPRINT = 198;
/** 交互提示气泡的高度（文字垂直居中的基准） */
const PROMPT_H = 26;

export abstract class RoomScene extends Phaser.Scene {
  protected player!: Player;
  protected solids: Phaser.GameObjects.Rectangle[] = [];
  protected interactables: Interactable[] = [];
  protected npcs: Character[] = [];

  private prompt!: Phaser.GameObjects.Container;
  private promptText!: Phaser.GameObjects.Text;
  private promptBg!: Phaser.GameObjects.Graphics;
  private near: Interactable | null = null;
  private ringTween: Phaser.Tweens.Tween | null = null;
  private stepTimer = 0;
  private camOffsetY = 20;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private worldKey: SceneKey;

  constructor(key: SceneKey) {
    super(key);
    this.worldKey = key;
  }

  /** 子类实现：铺地面、摆家具、注册可交互物 */
  protected abstract buildWorld(): void;
  /** 出生点 */
  protected abstract spawn(): Spawn;

  create(): void {
    this.buildWorld();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.buildPrompt();

    bus.on(EV.INTERACT, this.tryInteract, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      bus.off(EV.INTERACT, this.tryInteract, this);
      this.ringTween?.remove();
      flags.locked = false;
      flags.switching = false;
    });

    this.cameras.main.fadeIn(520, 8, 7, 6);
    this.time.delayedCall(140, () => bus.emit(EV.BANNER, LOCATION_NAME[this.worldKey]));
  }

  /* ------------------------------------------------------------ */
  /* 构件                                                          */
  /* ------------------------------------------------------------ */

  /** 摆一件道具（origin 在底部中心，depth 按 y 排序） */
  protected place(
    key: string,
    x: number,
    bottomY: number,
    opts: { flipX?: boolean; depth?: number; alpha?: number } = {},
  ): Phaser.GameObjects.Image {
    const s = img(this, key, x, bottomY, 0.5, 1);
    s.setFlipX(!!opts.flipX);
    s.setDepth(opts.depth ?? bottomY);
    if (opts.alpha !== undefined) s.setAlpha(opts.alpha);
    return s;
  }

  /** 铺外壳（地板 + 墙），永远在最底层 */
  protected addShell(key: string, x: number, y: number): Phaser.GameObjects.Image {
    const s = img(this, key, x, y, 0, 0);
    s.setDepth(-1000);
    return s;
  }

  /** 地面光斑（缓慢呼吸） */
  protected addLight(x: number, y: number, w: number, alpha = 0.5): Phaser.GameObjects.Image {
    const s = img(this, 'lightPool', x, y, 0.5, 0.5);
    s.setDisplaySize(w, w * 0.78);
    s.setDepth(-900);
    s.setAlpha(alpha);
    s.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: s,
      alpha: { from: alpha * 0.86, to: Math.min(1, alpha * 1.1) },
      duration: 1800 + Math.random() * 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
    return s;
  }

  /** 吊扇落在地面上的转动影子 */
  protected addFanShadow(x: number, y: number, size: number): void {
    const s = img(this, 'fanShadow', x, y, 0.5, 0.5);
    s.setDisplaySize(size, size * 0.82);
    s.setDepth(-880);
    this.tweens.add({
      targets: s,
      rotation: Math.PI * 2,
      duration: 6400,
      repeat: -1,
      ease: 'Linear',
    });
  }

  /** 碰撞体 */
  protected addSolid(x: number, y: number, w: number, h: number): void {
    const r = this.add.rectangle(x, y, w, h);
    r.setVisible(false);
    this.physics.add.existing(r, true);
    this.solids.push(r);
  }

  /** 可交互点（自动生成脚下光圈） */
  protected addInteractable(it: Interactable): Interactable {
    if (it.r === undefined) it.r = 42;
    const ring = img(this, 'ringHighlight', it.x, it.y, 0.5, 0.5);
    const s = it.ringScale ?? 1;
    ring.setDisplaySize(46 * s, 30 * s);
    ring.setDepth(it.y - 4);
    ring.setAlpha(0);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    it.ring = ring;
    this.interactables.push(it);
    return it;
  }

  /** 生成一位舍友 */
  protected addNpc(
    id: CastId,
    x: number,
    y: number,
    facing: Facing,
    pose: Pose = 'stand',
    busy = false,
  ): Character {
    const ch = new Character(this, x, y, CAST[id]);
    ch.setFacing(facing);
    ch.setPose(pose);
    ch.setDepth(y);
    ch.busy = busy;
    this.npcs.push(ch);
    return ch;
  }

  /** 可走区域（玩家不能走进墙里） */
  protected setWalkArea(x: number, y: number, w: number, h: number): void {
    this.physics.world.setBounds(x, y, w, h);
  }

  /** 镜头边界 */
  protected setCameraArea(x: number, y: number, w: number, h: number): void {
    this.cameras.main.setBounds(x, y, w, h);
  }

  /* ------------------------------------------------------------ */
  /* 玩家 / 镜头 / 输入                                            */
  /* ------------------------------------------------------------ */

  private createPlayer(): void {
    const sp = this.spawn();
    this.player = new Player(this, sp.x, sp.y);
    this.player.setFacing(sp.facing);
    this.player.setDepth(sp.y);
    for (const r of this.solids) this.physics.add.collider(this.player, r);
  }

  private setupCamera(): void {
    const cam = this.cameras.main;
    cam.setZoom(this.cameraZoom());
    cam.startFollow(this.player, true, 0.16, 0.16);
    cam.setFollowOffset(0, 26);
  }

  protected cameraZoom(): number {
    return 2.25;
  }

  private setupInput(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;
    kb.on('keydown-E', () => this.tryInteract());
    kb.on('keydown-SPACE', () => this.tryInteract());
    kb.on('keydown-F', () => this.tryInteract());
    kb.on('keydown-ENTER', () => this.tryInteract());
    kb.on('keydown-M', () => {
      const m = sfx.toggleMute();
      bus.emit(EV.TOAST, m ? '声音：关' : '声音：开');
    });
    // 开发期快捷键：1/2/3 直接跳到三个场景，方便调画面
    if (import.meta.env.DEV) {
      kb.on('keydown-ONE', () => this.travel('dorm', this.worldKey));
      kb.on('keydown-TWO', () => this.travel('balcony', this.worldKey));
      kb.on('keydown-THREE', () => this.travel('corridor', this.worldKey));
      kb.on('keydown-H', () => this.placePlayer(this.player.x - 120, this.player.y, 'left'));
      kb.on('keydown-L', () => this.placePlayer(this.player.x + 120, this.player.y, 'right'));
      kb.on('keydown-K', () => this.placePlayer(this.player.x, this.player.y - 120, 'up'));
      kb.on('keydown-J', () => this.placePlayer(this.player.x, this.player.y + 120, 'down'));
      kb.on('keydown-NINE', () => {
        state.talked = new Set(['zhe', 'pang', 'k', 'wei']);
        bus.emit(EV.QUEST, 4);
        this.toast('调试：已标记四位舍友都聊过');
      });
    }
  }

  private buildPrompt(): void {
    this.prompt = this.add.container(0, 0).setDepth(5000).setVisible(false);
    this.promptBg = this.add.graphics();
    this.promptText = this.add
      .text(0, 0, '', {
        fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        fontSize: '13px',
        color: C.uiText,
      })
      .setOrigin(0.5, 0.5)
      // 气泡矩形画在 y 属于 [-h, 0]，文字必须上移 h/2 才真正居中
      .setY(-PROMPT_H / 2);
    this.prompt.add([this.promptBg, this.promptText]);
  }

  private drawPrompt(w: number, h: number): void {
    const g = this.promptBg;
    g.clear();
    g.fillStyle(num(C.ink), 0.86);
    g.fillRoundedRect(-w / 2, -h, w, h, 7);
    g.lineStyle(1.3, num(C.accent), 0.9);
    g.strokeRoundedRect(-w / 2, -h, w, h, 7);
    g.fillStyle(num(C.ink), 0.86);
    g.fillTriangle(-5, -1, 5, -1, 0, 5);
    g.fillStyle(num(C.accent), 1);
    g.fillRect(-w / 2 + 4, -h + 4, 2.6, h - 8);
  }

  /* ------------------------------------------------------------ */
  /* 交互                                                          */
  /* ------------------------------------------------------------ */

  private tryInteract(): void {
    if (flags.locked || flags.switching) return;
    const it = this.near;
    if (!it) return;
    if (it.enabled && !it.enabled()) return;
    if (it.once && it.used) return;
    it.used = true;
    sfx.click();
    it.onUse();
  }

  /** 点击画面里的物件也能交互 */
  protected enablePointerInteract(): void {
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (flags.locked || flags.switching) return;
      if (this.sys.game.device.input.touch) return; // 触屏交给虚拟按键
      const wp = this.cameras.main.getWorldPoint(p.x, p.y);
      let best: Interactable | null = null;
      let bd = 80;
      for (const it of this.interactables) {
        if (it.enabled && !it.enabled()) continue;
        const d = Phaser.Math.Distance.Between(wp.x, wp.y, it.x, it.y - 10);
        if (d < bd) {
          bd = d;
          best = it;
        }
      }
      if (best) {
        this.near = best;
        this.tryInteract();
      }
    });
  }

  /** 说话 */
  protected say(lines: Line[], replies?: Reply[], onDone?: () => void): void {
    bus.emit(EV.DIALOGUE, { lines, replies, onDone } as SayRequest);
  }

  protected toast(text: string): void {
    bus.emit(EV.TOAST, text);
  }

  /** 开发期用：把玩家瞬移到指定位置（浏览器里调试画面时很方便） */
  placePlayer(x: number, y: number, facing: Facing = 'down'): void {
    this.player.setPosition(x, y);
    this.player.pbody.reset(x, y);
    this.player.setFacing(facing);
  }

  /* ------------------------------------------------------------ */
  /* 转场                                                          */
  /* ------------------------------------------------------------ */

  protected travel(target: SceneKey, from: SceneKey): void {
    if (flags.switching) return;
    flags.switching = true;
    flags.locked = true;
    sfx.transition();
    state.from = from;
    state.location = target;
    this.cameras.main.fadeOut(420, 6, 6, 6);
    this.time.delayedCall(440, () => this.scene.start(target));
  }

  /* ------------------------------------------------------------ */
  /* 主循环                                                        */
  /* ------------------------------------------------------------ */

  update(_time: number, dt: number): void {
    if (!this.player) return;
    const locked = flags.locked || flags.switching;

    let vx = 0;
    let vy = 0;
    let sprint = false;
    if (!locked) {
      const k = this.keys;
      vx = (k.D?.isDown || k.RIGHT?.isDown ? 1 : 0) - (k.A?.isDown || k.LEFT?.isDown ? 1 : 0);
      vy = (k.S?.isDown || k.DOWN?.isDown ? 1 : 0) - (k.W?.isDown || k.UP?.isDown ? 1 : 0);
      sprint = !!k.SHIFT?.isDown;
      if (Math.hypot(input.jx, input.jy) > 0.18) {
        vx = input.jx;
        vy = input.jy;
      }
      const len = Math.hypot(vx, vy);
      if (len > 1) {
        vx /= len;
        vy /= len;
      }
    }

    const moving = Math.abs(vx) + Math.abs(vy) > 0.06;
    if (moving) this.player.move(vx, vy, sprint ? SPRINT : SPEED);
    else this.player.stop();
    this.player.animate(dt, moving, sprint ? 1.5 : 1);

    if (moving) {
      const f: Facing =
        Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : vy > 0 ? 'down' : 'up';
      if (f !== this.player.facing) this.player.setFacing(f);
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = sprint ? 220 : 330;
        sfx.step();
      }
    } else {
      this.stepTimer = 110;
    }
    this.player.setDepth(this.player.y);

    // 镜头随朝向微微前推，走动时更舒服
    const wantY =
      this.player.facing === 'up' ? 44 : this.player.facing === 'down' ? -30 : 10;
    this.camOffsetY = Phaser.Math.Linear(this.camOffsetY, wantY, 0.05);
    this.cameras.main.setFollowOffset(0, this.camOffsetY);

    for (const n of this.npcs) {
      n.animate(dt, false);
      n.setDepth(n.y);
    }

    this.updateNear();
  }

  private updateNear(): void {
    let best: Interactable | null = null;
    let bd = Infinity;
    for (const it of this.interactables) {
      if (it.once && it.used) continue;
      if (it.enabled && !it.enabled()) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, it.x, it.y);
      if (d < (it.r ?? 42) && d < bd) {
        bd = d;
        best = it;
      }
    }

    if (best !== this.near) {
      this.ringTween?.remove();
      this.ringTween = null;
      if (this.near?.ring) {
        const old = this.near.ring;
        this.tweens.add({ targets: old, alpha: 0, duration: 180 });
      }
      this.near = best;
      if (best?.ring) {
        const ring = best.ring;
        ring.setDepth(best.y - 4);
        this.tweens.add({ targets: ring, alpha: 0.9, duration: 200 });
        this.ringTween = this.tweens.add({
          targets: ring,
          alpha: { from: 0.6, to: 0.95 },
          duration: 820,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut',
        });
      }
    }

    const show = !!best && !flags.locked && !flags.switching;
    this.prompt.setVisible(show);
    if (show && best) {
      const isTouch = this.sys.game.device.input.touch;
      const hint = isTouch ? `点按   ${best.label}` : `E   ${best.label}`;
      if (this.promptText.text !== hint) {
        this.promptText.setText(hint);
        this.drawPrompt(this.promptText.width + 26, PROMPT_H);
      }
      const view = this.cameras.main.worldView;
      let py = this.player.y + this.player.bubbleY - 6;
      if (py < view.top + 26) py = this.player.y + 36;
      this.prompt.setPosition(this.player.x, py);
    }
  }
}
