import Phaser from 'phaser';
import type { CastMember } from '../data/cast';
import { shade } from '../core/canvas';
import { C } from '../core/palette';

export type Facing = 'up' | 'down' | 'left' | 'right';
export type Pose = 'stand' | 'sit' | 'sleep';

const F = (g: Phaser.GameObjects.Graphics, color: number): void => {
  g.fillStyle(color, 1);
};

const hexNum = (hex: string): number => parseInt(hex.replace('#', ''), 16);

/** 头（含五官）在身体容器里的基准高度 */
const HEAD_Y = -52;

/**
 * 矢量小人：低多边形风格，用多边形块面拼出，靠代码做出走路 / 呼吸 / 打字动作，
 * 不需要任何位图素材。
 */
export class Character extends Phaser.GameObjects.Container {
  readonly cast: CastMember;
  facing: Facing = 'down';
  pose: Pose = 'stand';
  walkPhase = 0;
  /** 打字、点头之类的小动作开关 */
  busy = false;

  private shadow!: Phaser.GameObjects.Graphics;
  private legL!: Phaser.GameObjects.Graphics;
  private legR!: Phaser.GameObjects.Graphics;
  private lapLegs!: Phaser.GameObjects.Graphics;
  private mound!: Phaser.GameObjects.Graphics;
  private torso!: Phaser.GameObjects.Graphics;
  private armL!: Phaser.GameObjects.Graphics;
  private armR!: Phaser.GameObjects.Graphics;
  private head!: Phaser.GameObjects.Container;
  private face!: Phaser.GameObjects.Graphics;
  private hairBack!: Phaser.GameObjects.Graphics;
  private hairTop!: Phaser.GameObjects.Graphics;
  private nose!: Phaser.GameObjects.Graphics;
  private equip!: Phaser.GameObjects.Graphics;
  private rig!: Phaser.GameObjects.Container;
  private bobT = Math.random() * 10;

  constructor(scene: Phaser.Scene, x: number, y: number, cast: CastMember) {
    super(scene, x, y);
    this.cast = cast;
    this.build();
    scene.add.existing(this);
  }

  private build(): void {
    const m = this.cast;
    const skin = hexNum(m.skin);
    const skinDark = hexNum(m.skinDark);
    const shirt = hexNum(m.shirt);
    const shirtDark = hexNum(m.shirtDark);
    const pants = hexNum(m.pants);
    const pantsDark = hexNum(m.pantsDark);
    const shoe = hexNum(m.shoe);
    const hair = hexNum(m.hair);

    /* ---- 影子 ---- */
    this.shadow = this.scene.add.graphics();
    this.shadow.fillStyle(0x3a3226, 0.24);
    this.shadow.fillEllipse(0, 0, 24, 9);
    this.add(this.shadow);

    this.rig = this.scene.add.container(0, 0);
    this.add(this.rig);

    /* ---- 腿 ---- */
    const mkLeg = () => {
      const g = this.scene.add.graphics();
      F(g, pants);
      g.fillPoints(
        [
          new Phaser.Geom.Point(-3.4, 0),
          new Phaser.Geom.Point(3.4, 0),
          new Phaser.Geom.Point(2.8, 15),
          new Phaser.Geom.Point(-2.8, 15),
        ],
        true,
      );
      F(g, shoe);
      g.fillPoints(
        [
          new Phaser.Geom.Point(-3.1, 14),
          new Phaser.Geom.Point(3.1, 14),
          new Phaser.Geom.Point(3.6, 20),
          new Phaser.Geom.Point(-3.6, 20),
        ],
        true,
      );
      F(g, pantsDark);
      g.fillRect(-3.4, 0, 1.5, 15);
      g.fillRect(-3.4, 12, 6.8, 2);
      return g;
    };
    this.legL = mkLeg();
    this.legR = mkLeg();
    this.legL.setPosition(-4.6, -20);
    this.legR.setPosition(4.6, -20);
    this.rig.add([this.legL, this.legR]);

    /* ---- 坐姿的腿（朝向观众前方伸出）---- */
    this.lapLegs = this.scene.add.graphics();
    F(this.lapLegs, pants);
    this.lapLegs.fillPoints(
      [
        new Phaser.Geom.Point(-9, -6),
        new Phaser.Geom.Point(9, -6),
        new Phaser.Geom.Point(8, 4),
        new Phaser.Geom.Point(-8, 4),
      ],
      true,
    );
    F(this.lapLegs, pantsDark);
    this.lapLegs.fillPoints(
      [
        new Phaser.Geom.Point(-8, 2),
        new Phaser.Geom.Point(8, 2),
        new Phaser.Geom.Point(7, 12),
        new Phaser.Geom.Point(-7, 12),
      ],
      true,
    );
    F(this.lapLegs, shoe);
    this.lapLegs.fillEllipse(-5, 14, 8, 5);
    this.lapLegs.fillEllipse(5, 14, 8, 5);
    this.lapLegs.setVisible(false);
    this.rig.add(this.lapLegs);

    /* ---- 躺平：被子下面的身体隆起 ---- */
    this.mound = this.scene.add.graphics();
    const moundG = this.mound;
    F(moundG, hexNum(shade(C.blanket, -0.12)));
    moundG.fillRoundedRect(-16, -22, 32, 78, 15);
    moundG.fillStyle(hexNum(shade(C.blanket, 0.14)), 1);
    moundG.fillRoundedRect(-13, -20, 26, 60, 12);
    F(moundG, hexNum(C.blanket));
    moundG.fillRoundedRect(-12, -18, 22, 52, 10);
    // 被子褶皱
    F(moundG, hexNum(shade(C.blanket, -0.18)));
    moundG.fillRect(-14, 22, 28, 1.6);
    moundG.fillRect(-13, 36, 26, 1.4);
    // 露在被子外的肩膀
    moundG.fillStyle(hexNum(shade(C.blanket, 0.2)), 1);
    moundG.fillRoundedRect(-14, -24, 28, 6, 3);
    moundG.setVisible(false);
    this.rig.add(moundG);

    /* ---- 躯干 ---- */
    this.torso = this.scene.add.graphics();
    F(this.torso, shirt);
    this.torso.fillPoints(
      [
        new Phaser.Geom.Point(-11, 0),
        new Phaser.Geom.Point(11, 0),
        new Phaser.Geom.Point(12.5, 12),
        new Phaser.Geom.Point(11.5, 24),
        new Phaser.Geom.Point(-11.5, 24),
        new Phaser.Geom.Point(-12.5, 12),
      ],
      true,
    );
    // 侧面暗部 + 领口
    F(this.torso, shirtDark);
    this.torso.fillPoints(
      [
        new Phaser.Geom.Point(6, 0),
        new Phaser.Geom.Point(11, 0),
        new Phaser.Geom.Point(12.5, 12),
        new Phaser.Geom.Point(11.5, 24),
        new Phaser.Geom.Point(6.5, 24),
      ],
      true,
    );
    F(this.torso, skin);
    this.torso.fillPoints(
      [
        new Phaser.Geom.Point(-4, 0),
        new Phaser.Geom.Point(4, 0),
        new Phaser.Geom.Point(0, 4.5),
      ],
      true,
    );
    this.torso.setPosition(0, -44);
    this.rig.add(this.torso);

    /* ---- 手臂 ---- */
    const mkArm = () => {
      const g = this.scene.add.graphics();
      F(g, shirt);
      g.fillPoints(
        [
          new Phaser.Geom.Point(-3, 0),
          new Phaser.Geom.Point(3, 0),
          new Phaser.Geom.Point(2.4, 13),
          new Phaser.Geom.Point(-2.4, 13),
        ],
        true,
      );
      F(g, skin);
      g.fillEllipse(0, 15, 6, 6);
      return g;
    };
    this.armL = mkArm();
    this.armR = mkArm();
    this.armL.setPosition(-11, -42);
    this.armR.setPosition(11.6, -42);
    this.armL.setRotation(0.14);
    this.armR.setRotation(-0.14);
    this.rig.add([this.armL, this.armR]);

    /* ---- 头 ---- */
    this.head = this.scene.add.container(0, HEAD_Y);
    const skull = this.scene.add.graphics();
    F(skull, skin);
    skull.fillEllipse(0, 0, 18, 19);
    F(skull, skinDark);
    skull.fillEllipse(0, 7, 15, 7);
    this.head.add(skull);

    // 耳朵
    const earL = this.scene.add.graphics();
    F(earL, skinDark);
    earL.fillEllipse(-8.6, 1, 3.6, 5);
    earL.fillEllipse(8.6, 1, 3.6, 5);
    this.head.add(earL);

    // 后脑头发（back / 侧面用）
    this.hairBack = this.scene.add.graphics();
    this.head.add(this.hairBack);

    // 五官
    this.face = this.scene.add.graphics();
    this.buildFace(this.face, m);
    this.head.add(this.face);

    // 刘海 / 发顶
    this.hairTop = this.scene.add.graphics();
    this.buildHair(this.hairTop, m, hair);
    this.head.add(this.hairTop);

    // 侧面鼻子
    this.nose = this.scene.add.graphics();
    F(this.nose, skin);
    this.nose.fillPoints(
      [
        new Phaser.Geom.Point(0, -1),
        new Phaser.Geom.Point(3.4, 2),
        new Phaser.Geom.Point(0, 4),
      ],
      true,
    );
    this.nose.setPosition(7.5, 2);
    this.nose.setVisible(false);
    this.head.add(this.nose);

    // 配饰
    this.equip = this.scene.add.graphics();
    this.buildEquip(this.equip, m);
    this.head.add(this.equip);

    this.rig.add(this.head);
    this.setFacing('down');
    this.setPose('stand');
  }

  private buildFace(g: Phaser.GameObjects.Graphics, m: CastMember): void {
    const eye = hexNum('#2a2320');
    F(g, eye);
    g.fillEllipse(-3.6, 1, 2.6, 3);
    g.fillEllipse(3.6, 1, 2.6, 3);
    F(g, 0xffffff);
    g.fillEllipse(-4.3, 0, 0.9, 0.9);
    g.fillEllipse(2.9, 0, 0.9, 0.9);
    // 眉毛
    F(g, hexNum(shade(m.hair, 0.08)));
    g.fillRect(-6.4, -3.4, 5, 1.5);
    g.fillRect(1.4, -3.4, 5, 1.5);
    // 嘴
    F(g, hexNum('#8a4b3c'));
    g.fillRect(-1.8, 6.4, 3.6, 1.4);
  }

  private buildHair(g: Phaser.GameObjects.Graphics, m: CastMember, hair: number): void {
    F(g, hair);
    if (m.hairStyle === 'buzz') {
      g.fillPoints(
        [
          new Phaser.Geom.Point(-9, -1),
          new Phaser.Geom.Point(-8.6, -6),
          new Phaser.Geom.Point(-4, -9.6),
          new Phaser.Geom.Point(4, -9.6),
          new Phaser.Geom.Point(8.6, -6),
          new Phaser.Geom.Point(9, -1),
          new Phaser.Geom.Point(9, -3.5),
          new Phaser.Geom.Point(0, -5.5),
          new Phaser.Geom.Point(-9, -3.5),
        ],
        true,
      );
      g.fillPoints(
        [
          new Phaser.Geom.Point(-9, -1),
          new Phaser.Geom.Point(-8.6, -6.6),
          new Phaser.Geom.Point(-3, -10),
          new Phaser.Geom.Point(4.5, -9.6),
          new Phaser.Geom.Point(9, -5),
          new Phaser.Geom.Point(9, -2),
          new Phaser.Geom.Point(4, -6.5),
          new Phaser.Geom.Point(-4, -6.5),
          new Phaser.Geom.Point(-9, -2),
        ],
        true,
      );
    } else if (m.hairStyle === 'bowl') {
      g.fillPoints(
        [
          new Phaser.Geom.Point(-9.6, 2),
          new Phaser.Geom.Point(-9.8, -5),
          new Phaser.Geom.Point(-4.5, -10.6),
          new Phaser.Geom.Point(4.5, -10.6),
          new Phaser.Geom.Point(9.8, -5),
          new Phaser.Geom.Point(9.6, 2),
          new Phaser.Geom.Point(6, -2.6),
          new Phaser.Geom.Point(0, -3.6),
          new Phaser.Geom.Point(-6, -2.6),
        ],
        true,
      );
    } else if (m.hairStyle === 'messy') {
      g.fillPoints(
        [
          new Phaser.Geom.Point(-9.6, 1),
          new Phaser.Geom.Point(-10.4, -5.4),
          new Phaser.Geom.Point(-6.6, -11.4),
          new Phaser.Geom.Point(-2, -7.6),
          new Phaser.Geom.Point(1.6, -11.8),
          new Phaser.Geom.Point(5.6, -7.4),
          new Phaser.Geom.Point(10, -10),
          new Phaser.Geom.Point(9.8, -1),
          new Phaser.Geom.Point(6, -4),
          new Phaser.Geom.Point(0, -5),
          new Phaser.Geom.Point(-6, -3.6),
        ],
        true,
      );
    } else {
      g.fillPoints(
        [
          new Phaser.Geom.Point(-9.4, 0),
          new Phaser.Geom.Point(-9.6, -5.6),
          new Phaser.Geom.Point(-4.6, -10.4),
          new Phaser.Geom.Point(2.6, -10.2),
          new Phaser.Geom.Point(8.4, -6.4),
          new Phaser.Geom.Point(9.4, -1),
          new Phaser.Geom.Point(7.4, -3.4),
          new Phaser.Geom.Point(1, -4.6),
          new Phaser.Geom.Point(-6.4, -3.4),
        ],
        true,
      );
    }
    // 发丝高光
    F(g, hexNum(shade(m.hair, 0.22)));
    g.fillPoints(
      [
        new Phaser.Geom.Point(-5.4, -9.4),
        new Phaser.Geom.Point(-1, -10.4),
        new Phaser.Geom.Point(-3, -7.4),
        new Phaser.Geom.Point(-6.6, -6.4),
      ],
      true,
    );
  }

  private buildEquip(g: Phaser.GameObjects.Graphics, m: CastMember): void {
    if (m.accessory === 'headphone') {
      const c = hexNum('#d8d3c6');
      F(g, c);
      g.fillRect(-11.6, -4.6, 3, 5);
      g.fillRect(8.6, -4.6, 3, 5);
      g.fillEllipse(-10.1, 0.6, 6.4, 8.4);
      g.fillEllipse(10.1, 0.6, 6.4, 8.4);
      F(g, hexNum('#a9a49a'));
      g.fillEllipse(-10.1, 0.6, 3.4, 4.6);
      g.fillEllipse(10.1, 0.6, 3.4, 4.6);
      F(g, c);
      g.fillPoints(
        [
          new Phaser.Geom.Point(-11, -3),
          new Phaser.Geom.Point(-8, -11),
          new Phaser.Geom.Point(8, -11),
          new Phaser.Geom.Point(11, -3),
          new Phaser.Geom.Point(9, -2.6),
          new Phaser.Geom.Point(7, -9),
          new Phaser.Geom.Point(-7, -9),
          new Phaser.Geom.Point(-9, -2.6),
        ],
        true,
      );
    } else if (m.accessory === 'glasses') {
      const frame = hexNum('#3a3f45');
      g.lineStyle(1.2, frame, 0.95);
      g.strokeRect(-6.6, -1.6, 6, 5.4);
      g.strokeRect(0.6, -1.6, 6, 5.4);
      g.lineBetween(-0.6, 0.6, 0.6, 0.6);
      g.fillStyle(hexNum('#cfe6f2'), 0.18);
      g.fillRect(-6.6, -1.6, 6, 5.4);
      g.fillRect(0.6, -1.6, 6, 5.4);
    } else if (m.accessory === 'towel') {
      const c = hexNum('#8fb6c4');
      F(g, c);
      g.fillPoints(
        [
          new Phaser.Geom.Point(-13, 2),
          new Phaser.Geom.Point(-4, -2),
          new Phaser.Geom.Point(-6, 8),
          new Phaser.Geom.Point(-14, 10),
        ],
        true,
      );
    }
  }

  setFacing(dir: Facing): this {
    this.facing = dir;
    const g = this.hairBack;
    g.clear();
    const m = this.cast;
    const hair = hexNum(m.hair);
    const skin = hexNum(m.skin);

    if (dir === 'up') {
      // 背面：后脑一片头发
      this.face.setVisible(false);
      this.nose.setVisible(false);
      this.hairTop.setVisible(true);
      F(g, hair);
      g.fillEllipse(0, 0.5, 17.4, 18.4);
      F(g, hexNum(shade(m.hair, 0.2)));
      g.fillPoints(
        [
          new Phaser.Geom.Point(-5, -8),
          new Phaser.Geom.Point(3, -9),
          new Phaser.Geom.Point(1, -4),
          new Phaser.Geom.Point(-6, -4.6),
        ],
        true,
      );
      this.head.setX(0);
      this.equip.setX(0);
      this.equip.setScale(1, 1);
    } else if (dir === 'left' || dir === 'right') {
      const s = dir === 'right' ? 1 : -1;
      this.face.setVisible(true);
      this.face.setX(s * 3.4);
      this.face.setScale(s * 0.86, 1);
      this.nose.setVisible(true);
      this.nose.setScale(s, 1);
      this.nose.setX(s * 7.6);
      this.hairTop.setVisible(true);
      this.hairTop.setX(s * -1.2);
      // 后脑的头发块
      F(g, hair);
      g.fillPoints(
        [
          new Phaser.Geom.Point(s * -3, -8),
          new Phaser.Geom.Point(s * -9.6, -4),
          new Phaser.Geom.Point(s * -9.4, 6),
          new Phaser.Geom.Point(s * -4, 4),
        ],
        true,
      );
      F(g, skin);
      g.fillEllipse(s * -8.8, 1, 3.4, 5);
      this.head.setX(0);
      this.equip.setX(s * 1.2);
      this.equip.setScale(s, 1);
    } else {
      this.face.setVisible(true);
      this.face.setX(0);
      this.face.setScale(1, 1);
      this.nose.setVisible(false);
      this.hairTop.setVisible(true);
      this.hairTop.setX(0);
      this.equip.setX(0);
      this.equip.setScale(1, 1);
    }
    return this;
  }

  setPose(pose: Pose): this {
    this.pose = pose;
    const rot =
      this.facing === 'right'
        ? -Math.PI / 2
        : this.facing === 'left'
          ? Math.PI / 2
          : this.facing === 'up'
            ? Math.PI
            : 0;
    this.lapLegs.setRotation(rot);
    if (pose === 'sit') {
      this.mound.setVisible(false);
      this.legL.setVisible(false);
      this.legR.setVisible(false);
      this.lapLegs.setVisible(true);
      this.rig.setY(-6);
      this.shadow.setAlpha(0.16);
    } else if (pose === 'sleep') {
      this.legL.setVisible(false);
      this.legR.setVisible(false);
      this.lapLegs.setVisible(false);
      this.mound.setVisible(true);
      this.torso.setVisible(false);
      this.armL.setVisible(false);
      this.armR.setVisible(false);
      this.rig.setY(0);
      this.head.setY(HEAD_Y + 14);
      this.shadow.setAlpha(0.1);
      return this;
    } else {
      this.mound.setVisible(false);
      this.torso.setVisible(true);
      this.armL.setVisible(true);
      this.armR.setVisible(true);
      this.legL.setVisible(true);
      this.legR.setVisible(true);
      this.lapLegs.setVisible(false);
      this.rig.setY(0);
      this.shadow.setAlpha(1);
    }
    return this;
  }

  /** 每帧调用：moving 决定走路循环，busy 决定手上小动作 */
  animate(dt: number, moving: boolean, speedScale = 1): void {
    const s = dt / 1000;
    if (moving && this.pose === 'stand') {
      this.walkPhase += s * 9 * speedScale;
      const sw = Math.sin(this.walkPhase);
      this.legL.setRotation(sw * 0.52);
      this.legR.setRotation(-sw * 0.52);
      this.armL.setRotation(0.16 - sw * 0.42);
      this.armR.setRotation(-0.16 + sw * 0.42);
      this.rig.setY(-Math.abs(Math.sin(this.walkPhase)) * 1.6);
      this.legL.setY(-20 + Math.max(0, sw) * 1.6);
      this.legR.setY(-20 + Math.max(0, -sw) * 1.6);
    } else if (this.pose === 'sleep') {
      this.bobT += s;
      const breathe = Math.sin(this.bobT * 1.6);
      this.mound.setScale(1, 1 + breathe * 0.012);
      this.head.setY(HEAD_Y + 14 + breathe * 0.4);
      this.armL.setRotation(0.16);
      this.armR.setRotation(-0.16);
      return;
    } else {
      this.walkPhase = 0;
      this.bobT += s;
      const breathe = Math.sin(this.bobT * 2.1) * 0.5;
      this.legL.setRotation(0);
      this.legR.setRotation(0);
      this.legL.setY(-20);
      this.legR.setY(-20);
      if (this.busy) {
        // 打字：手在抖，头微微低
        const t = Math.sin(this.bobT * 11);
        this.armL.setRotation(0.5 + t * 0.16);
        this.armR.setRotation(-0.5 - t * 0.16);
        this.head.setY(HEAD_Y + (this.pose === 'sit' ? 1.2 + t * 0.4 : t * 0.3));
      } else {
        this.armL.setRotation(0.16 + breathe * 0.03);
        this.armR.setRotation(-0.16 - breathe * 0.03);
        this.head.setY(HEAD_Y + breathe * 0.6);
      }
      this.rig.setY(this.pose === 'sit' ? -6 + breathe * 0.4 : breathe * 0.3);
    }
  }

  /** 头顶气泡锚点 */
  get bubbleY(): number {
    return -74;
  }
}
