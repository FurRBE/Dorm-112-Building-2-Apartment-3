import Phaser from 'phaser';
import { img } from '../core/canvas';
import { bus, EV } from '../core/bus';
import { sfx } from '../core/audio';
import { flags } from '../core/input';
import { state, allTalked, talkedCount, ROOMMATES } from '../core/state';
import { DIALOGUES, ENDING, FLAVOR, INTRO, SHORT_TALK } from '../data/dialogues';
import type { Line } from '../data/dialogues';
import type { CastId } from '../data/cast';
import { DORM } from '../world/layout';
import { RoomScene } from './RoomScene';
import type { Spawn } from './RoomScene';

const ROW_L = DORM.rowL.x; // 6
const ROW_W = DORM.rowL.w; // 124
const ROW_R = DORM.rowR.x; // 254
/** 每套家具内部：床垫 / 南梁 / 桌柜 的 y 偏移 */
const OFF_SLAB = 6;
const OFF_RAIL = 184;
const OFF_DESK = 290;
/** 椅子与坐着的人相对 unit 起点的偏移 */
const OFF_CHAIR = 308;
const OFF_SIT = 316;
const OFF_LADDER = 274;

export class DormScene extends RoomScene {
  private fan: Phaser.GameObjects.Image | null = null;
  private doorLeaf!: Phaser.GameObjects.Image;
  private balconyLeaves: Phaser.GameObjects.Image[] = [];
  private npcOf: Partial<Record<CastId, Phaser.GameObjects.Container>> = {};

  constructor() {
    super('dorm');
  }

  protected spawn(): Spawn {
    if (state.from === 'balcony') return { ...DORM.spawnFromBalcony };
    if (state.from === 'corridor') {
      return { x: DORM.spawnFromCorridor.x, y: DORM.spawnFromCorridor.y, facing: 'down' };
    }
    return { x: 192, y: 540, facing: 'up' };
  }

  protected buildWorld(): void {
    this.addShell('dormShell', DORM.shell.x, DORM.shell.y);
    this.setWalkArea(14, 26, DORM.w - 28, DORM.h - 44);
    this.setCameraArea(DORM.shell.x, DORM.shell.y, DORM.shell.w, DORM.shell.h);

    /* ---- 灯光 ---- */
    this.addLight(192, 150, 330, 0.4);
    this.addLight(192, 470, 340, 0.44);
    this.addLight(74, 300, 150, 0.18);
    this.addLight(312, 300, 150, 0.18);
    this.addLight(192, 700, 240, 0.16);
    this.fan = img(this, 'fanShadow', 192, 226, 0.5, 0.5);
    this.fan.setDisplaySize(196, 160);
    this.fan.setDepth(-880);
    this.tweens.add({
      targets: this.fan,
      rotation: Math.PI * 2,
      duration: 7200,
      repeat: -1,
      ease: 'Linear',
    });

    /* ---- 两排 上下铺 + 桌柜 ---- */
    const rows: { x: number; flip: boolean; cx: number }[] = [
      { x: ROW_L, flip: false, cx: ROW_L + ROW_W / 2 },
      { x: ROW_R, flip: true, cx: ROW_R + ROW_W / 2 },
    ];
    for (const uy of DORM.unitYs) {
      for (const row of rows) {
        this.buildUnit(row.x, uy, row.flip);
      }
    }

    /* ---- 桌面杂物 ---- */
    const itemsA: [string, number, number][] = [
      ['deskLamp', 22, 206],
      ['deskLaptop', 64, 230],
      ['deskBooks', 100, 222],
      ['deskCup', 88, 244],
    ];
    const itemsB: [string, number, number][] = [
      ['deskLamp', 24, 208],
      ['deskBooks', 76, 224],
      ['deskBox', 104, 236],
      ['deskCup', 56, 240],
    ];
    const itemsMine: [string, number, number][] = [
      ['deskBooks', 30, 220],
      ['deskCup', 62, 238],
      ['deskKnife', 96, 232],
    ];
    // 一号桌（左上）阿哲 / 二号桌（右上）小胖 / 四号位（右下）我的桌子
    this.putItems(itemsA, ROW_L, DORM.unitYs[0], false);
    this.putItems(itemsA, ROW_R, DORM.unitYs[0], true);
    this.putItems(itemsB, ROW_L, DORM.unitYs[1], false);
    this.putItems(itemsMine, ROW_R, DORM.unitYs[1], true);

    /* ---- 椅子 + 舍友 ---- */
    const uA = DORM.unitYs[0];
    const uB = DORM.unitYs[1];
    this.addChair(ROW_L, uA, false);
    this.addChair(ROW_R, uA, true);
    this.addChair(ROW_L, uB, false);
    this.addChair(ROW_R, uB, true);

    const sitX = ROW_L + ROW_W - 26; // 左排靠走道的座位
    const sitXR = DORM.w - sitX;
    const zhe = this.addNpc('zhe', sitX, uA + OFF_SIT, 'up', 'sit', true);
    const pang = this.addNpc('pang', sitXR, uA + OFF_SIT, 'up', 'sit', true);
    // 老K躺在他的下铺上，只露出头和被子下的隆起
    const k = this.addNpc('k', 74, uB + 74, 'down', 'sleep');
    this.npcOf.zhe = zhe;
    this.npcOf.pang = pang;
    this.npcOf.k = k;

    this.addInteractable({
      x: sitX,
      y: uA + OFF_SIT - 10,
      label: '和阿哲说话',
      r: 56,
      onUse: () => this.talkTo('zhe'),
    });
    this.addInteractable({
      x: sitXR,
      y: uA + OFF_SIT - 10,
      label: '和小胖说话',
      r: 56,
      onUse: () => this.talkTo('pang'),
    });
    this.addInteractable({
      x: 74,
      y: uB + 80,
      label: '叫醒老K',
      r: 58,
      ringScale: 1.2,
      onUse: () => {
        k.setPose('sit');
        k.setFacing('down');
        this.talkTo('k', () => {
          k.setPose('sleep');
          k.setFacing('down');
        });
      },
    });

    /* ---- 地面杂物 ---- */
    this.place('thermos', 122, uA + 286, { alpha: 0.99 });
    this.place('slippers', 148, uB + 120);
    this.place('backpack', sitX - 4, uA + OFF_CHAIR - 4, { depth: uA + OFF_CHAIR - 6 });
    this.place('bagYellow', 246, uA + 250, { flipX: true });
    this.place('bagBlack', ROW_R + 16, uB + 250);
    this.place('trashBag', 214, 596);
    this.place('plasticBag', 186, 640);
    this.place('trashBag', 232, 660);
    this.place('boxStack', 246, 66);
    this.place('boxStack', 142, 54);
    this.place('bucket', 148, uB + 296);
    this.place('mop', 268, uB + 300, { flipX: true });
    this.place('powerStrip', 200, uB + 214, { depth: uB + 214 });
    this.place('bookStackFloor', 118, uB + 250);

    /* ---- 碰撞 ---- */
    for (const uy of DORM.unitYs) {
      this.addSolid(ROW_L + ROW_W / 2, uy + 145, ROW_W + 4, 292);
      this.addSolid(ROW_R + ROW_W / 2, uy + 145, ROW_W + 4, 292);
    }
    // 纸箱堆
    this.addSolid(246, 56, 44, 26);
    this.addSolid(142, 46, 44, 24);

    /* ---- 门 ---- */
    this.buildDoors();
    this.buildWallItems();

    /* ---- 交互 ---- */
    this.addInteractable({
      x: 192,
      y: 62,
      label: '开门 · 去走廊',
      r: 54,
      ringScale: 1.3,
      onUse: () => this.openNorthDoor(),
    });
    this.addInteractable({
      x: 192,
      y: 700,
      label: '推开阳台门',
      r: 56,
      ringScale: 1.3,
      onUse: () => this.openBalconyDoor(),
    });
    this.addInteractable({
      x: 122,
      y: uA + 282,
      label: '蓝色保温瓶',
      r: 40,
      onUse: () => this.say([{ who: 'narration', text: FLAVOR.thermos }]),
    });
    this.addInteractable({
      x: 246,
      y: uA + 246,
      label: '黄色快递袋',
      r: 40,
      onUse: () => this.say([{ who: 'narration', text: FLAVOR.snackBag }]),
    });
    this.addInteractable({
      x: 246,
      y: 58,
      label: '那堆纸箱',
      r: 46,
      onUse: () => this.say([{ who: 'narration', text: FLAVOR.boxes }]),
    });
    this.addInteractable({
      x: 214,
      y: 590,
      label: '看看垃圾袋',
      r: 40,
      onUse: () =>
        this.say([
          { who: 'narration', text: '今天轮到谁倒垃圾？——没有人在群里回这条消息。' },
          { who: 'narration', text: '袋子已经装满了，旁边那袋是备用的，也快满了。' },
        ]),
    });
    this.addInteractable({
      x: 316,
      y: uB + OFF_SIT - 10,
      label: '我自己的桌子',
      r: 56,
      onUse: () =>
        this.say([
          { who: 'narration', text: '你的桌上摊着一本没看完的书，压着一张写了一半的便签。' },
          { who: 'you', text: '……明天再说。' },
        ]),
    });
    this.addInteractable({
      x: 72,
      y: uA + 92,
      label: '看看蚊帐',
      r: 46,
      onUse: () => this.say([{ who: 'narration', text: FLAVOR.net }]),
    });
    this.enablePointerInteract();
  }

  /* ------------------------------------------------------------ */

  private buildUnit(x: number, uy: number, flip: boolean): void {
    // 床垫（最底层，人可叠在上面）
    const slab = img(this, 'bunkSlab', x, uy + OFF_SLAB, 0, 0);
    slab.setFlipX(flip);
    slab.setDepth(uy + OFF_SLAB);
    // 南侧横梁
    const rail = img(this, 'bunkRailS', x, uy + OFF_RAIL, 0, 1);
    rail.setFlipX(flip);
    rail.setDepth(uy + OFF_RAIL);
    // 桌 + 绿柜
    const desk = img(this, 'deskUnit', x, uy + OFF_DESK, 0, 1);
    desk.setFlipX(flip);
    desk.setDepth(uy + OFF_DESK);
    // 两根立柱
    for (const px of [x + 14, x + ROW_W - 14]) {
      const post = this.place('unitPost', px, uy + 288, { depth: uy + 288 });
      post.setFlipX(flip);
    }
    // 爬梯（贴着走道一侧）
    const ladderX = flip ? x + 5 : x + ROW_W - 5;
    this.place('ladder', ladderX, uy + OFF_LADDER, { depth: uy + OFF_LADDER, flipX: flip });
  }

  private putItems(
    items: [string, number, number][],
    rowX: number,
    uy: number,
    flip: boolean,
  ): void {
    for (const [key, lx, ly] of items) {
      // 镜像是“在这一排内部左右对调”，不是关于房间中线
      const wx = flip ? rowX + (ROW_W - lx) : rowX + lx;
      // depth 抬到桌柜正面之上，否则会被柜体压住
      this.place(key, wx, uy + ly, { flipX: flip, depth: uy + 296 });
    }
  }

  private addChair(rowX: number, uy: number, flip: boolean): void {
    const lx = ROW_W - 26;
    const wx = flip ? rowX + (ROW_W - lx) : rowX + lx;
    this.place('chair', wx, uy + OFF_CHAIR, { flipX: flip, depth: uy + OFF_CHAIR });
  }

  private buildDoors(): void {
    // 北侧平开门（铰链在左侧）
    this.doorLeaf = img(this, 'doorNorthLeaf', DORM.northDoor.x, 2, 0, 1);
    this.doorLeaf.setDepth(-900);
    // 南侧阳台推拉门
    const d = DORM.southDoor;
    const w1 = d.w / 2;
    const l1 = img(this, 'balconyLeaf', d.x + w1 / 2, DORM.h + 1, 0.5, 1);
    const l2 = img(this, 'balconyLeaf', d.x + w1 + w1 / 2, DORM.h + 1, 0.5, 1);
    l1.setDepth(880);
    l2.setDepth(882);
    this.balconyLeaves = [l1, l2];
    const frame = this.add.graphics().setDepth(899);
    frame.fillStyle(0x8f9a9a, 0.9);
    frame.fillRect(d.x - 3, DORM.h - 3, d.w + 6, 3.5);
  }

  private buildWallItems(): void {
    // 墙上的开关：左边灯、右边风扇
    const sw = this.add.graphics().setDepth(30);
    for (const [sx, on] of [
      [150, false],
      [250, true],
    ] as const) {
      sw.fillStyle(0xf1efe6, 1);
      sw.fillRoundedRect(sx - 5, -38, 10, 13, 2);
      sw.lineStyle(1, 0x8b9899, 0.9);
      sw.strokeRoundedRect(sx - 5, -38, 10, 13, 2);
      sw.fillStyle(on ? 0x7fd18a : 0x6c7879, 1);
      sw.fillRect(sx - 2, -35, 4, 7);
    }

    this.addInteractable({
      x: 250,
      y: 58,
      label: '风扇开关',
      r: 46,
      onUse: () => {
        if (!this.fan) return;
        const t = this.tweens.getTweensOf(this.fan)[0];
        if (t) t.timeScale = t.timeScale === 1 ? 5 : 1;
        this.say([{ who: 'narration', text: FLAVOR.fanSwitch }]);
      },
    });
    this.addInteractable({
      x: 150,
      y: 58,
      label: '关灯 · 睡觉',
      r: 52,
      ringScale: 0.9,
      onUse: () => this.trySleep(),
    });
    // 窗
    this.addInteractable({
      x: 72,
      y: 14,
      label: '看看窗外',
      r: 56,
      onUse: () => this.say([{ who: 'narration', text: FLAVOR.window }]),
    });
  }

  /* ------------------------------------------------------------ */

  private talkTo(id: CastId, after?: () => void): void {
    const first = !state.talked.has(id);
    if (first) {
      state.talked.add(id);
      sfx.chime();
      bus.emit(EV.QUEST, talkedCount());
    }
    const lines: Line[] = first ? DIALOGUES[id].lines : SHORT_TALK[id];
    const replies = first ? DIALOGUES[id].replies : undefined;
    this.say(lines, replies, () => {
      if (after) after();
      if (first && allTalked()) {
        this.time.delayedCall(420, () => {
          this.say([
            { who: 'narration', text: '四个人都聊过了。屋里安静下来，只剩吊扇的声音。' },
            { who: 'narration', text: '（去墙上的开关那里，就可以关灯睡觉了。）' },
          ]);
        });
      }
    });
  }

  private trySleep(): void {
    if (!allTalked()) {
      const n = ROOMMATES.length - talkedCount();
      this.say([
        { who: 'narration', text: `还有 ${n} 个人没聊过。熄灯前，总得跟人说句话吧。` },
      ]);
      return;
    }
    if (state.finished) {
      this.say([{ who: 'narration', text: '灯已经关了。今晚就到这儿。' }]);
      return;
    }
    state.finished = true;
    this.say(ENDING, undefined, () => {
      bus.emit(EV.ENDING);
    });
  }

  private openNorthDoor(): void {
    if (flags.switching) return;
    flags.locked = true;
    sfx.door(true);
    this.tweens.add({
      targets: this.doorLeaf,
      scaleX: 0.14,
      duration: 420,
      ease: 'Quad.out',
    });
    this.tweens.add({
      targets: this.doorLeaf,
      alpha: 0.75,
      duration: 420,
    });
    this.time.delayedCall(330, () => this.travel('corridor', 'dorm'));
  }

  private openBalconyDoor(): void {
    if (flags.switching) return;
    flags.locked = true;
    const [l1, l2] = this.balconyLeaves;
    sfx.door(true);
    this.tweens.add({ targets: l1, x: l1.x, duration: 10 });
    this.tweens.add({ targets: l2, x: l2.x + 40, duration: 460, ease: 'Quad.out' });
    this.tweens.add({ targets: l2, alpha: 0.6, duration: 460 });
    this.time.delayedCall(430, () => this.travel('balcony', 'dorm'));
  }

  create(): void {
    super.create();
    // 从走廊回来时，门在身后合上
    if (state.from === 'corridor') {
      this.doorLeaf.setScale(0.14, 1);
      this.tweens.add({
        targets: this.doorLeaf,
        scaleX: 1,
        duration: 480,
        ease: 'Quad.inOut',
        onComplete: () => sfx.door(false),
      });
    }
    // 开场白
    if (!state.started) {
      state.started = true;
      flags.locked = true;
      this.time.delayedCall(700, () => {
        this.say([...INTRO], undefined, () => {
          bus.emit(EV.QUEST, talkedCount());
        });
      });
    }
  }
}
