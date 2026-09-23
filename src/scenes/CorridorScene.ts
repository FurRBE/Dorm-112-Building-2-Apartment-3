import { img } from '../core/canvas';
import { sfx } from '../core/audio';
import { flags } from '../core/input';
import { CORRIDOR } from '../world/layout';
import { FLAVOR } from '../data/dialogues';
import { RoomScene } from './RoomScene';
import type { Spawn } from './RoomScene';

export class CorridorScene extends RoomScene {
  private ourLeaf!: Phaser.GameObjects.Image;

  constructor() {
    super('corridor');
  }

  protected spawn(): Spawn {
    return { ...CORRIDOR.spawnFromDorm };
  }

  protected cameraZoom(): number {
    return 2.25;
  }

  protected buildWorld(): void {
    this.addShell('corridorShell', CORRIDOR.shell.x, CORRIDOR.shell.y);
    this.setWalkArea(16, 28, CORRIDOR.w - 32, CORRIDOR.h - 42);
    this.setCameraArea(CORRIDOR.shell.x, CORRIDOR.shell.y, CORRIDOR.shell.w, CORRIDOR.shell.h);

    /* ---- 顶灯光斑 ---- */
    for (let i = 0; i < 5; i++) this.addLight(128 + i * 180, 104, 300, 0.3);

    /* ---- 楼梯口（西端）---- */
    this.place('stairsDown', 72, 182, { depth: -820 });
    const rail = this.add.graphics().setDepth(-810);
    rail.lineStyle(3, 0xe2e9e9, 0.7);
    rail.beginPath();
    rail.moveTo(132, 40);
    rail.lineTo(132, 176);
    rail.stroke();
    this.addSolid(66, 108, 132, 148);

    /* ---- 门 ---- */
    for (const d of CORRIDOR.doors) {
      const leaf = img(this, 'doorNorthLeaf', d.x, 2, 0, 1);
      leaf.setDepth(-900);
      if (d.ours) {
        this.ourLeaf = leaf;
        this.tweens.add({
          targets: leaf,
          scaleX: 1,
          duration: 480,
          ease: 'Quad.inOut',
        });
      } else {
        // 别人的门：微微虚掩
        leaf.setScale(1, 1);
      }
      this.place('doorMat', d.x + d.w / 2, 48, { depth: 48 });
    }

    /* ---- 墙面装饰 ---- */
    this.place('posterL', 320, 2, { depth: -940 });
    this.place('posterL', 556, 2, { depth: -940, flipX: true });
    this.place('posterL', 700, 2, { depth: -940 });

    /* ---- 地面物件 ---- */
    this.place('waterDispenser', 500, 62);
    this.addSolid(500, 38, 36, 48);
    this.place('corridorBin', 700, 98);
    this.addSolid(700, 82, 30, 32);
    this.place('bookStackFloor', 258, 60);
    this.place('boxStack', 858, 62);

    /* ---- 交互 ---- */
    this.addInteractable({
      x: 182,
      y: 58,
      label: '回 112 寝',
      r: 52,
      ringScale: 1.25,
      onUse: () => this.enterDorm(),
    });
    this.addInteractable({
      x: 258,
      y: 8,
      label: '看公告栏',
      r: 46,
      onUse: () => this.say([{ who: 'narration', text: FLAVOR.notice }]),
    });
    this.addInteractable({
      x: 500,
      y: 44,
      label: '接点热水',
      r: 42,
      onUse: () =>
        this.say([
          { who: 'narration', text: FLAVOR.water },
          { who: 'narration', text: '你接了半天，只有半杯。算了。' },
        ]),
    });
    this.addInteractable({
      x: 140,
      y: 110,
      label: '楼梯口',
      r: 52,
      onUse: () =>
        this.say([
          { who: 'narration', text: FLAVOR.stairs },
          { who: 'narration', text: '（半夜下楼这件事，明天再说。）' },
        ]),
    });
    this.addInteractable({
      x: 700,
      y: 92,
      label: '垃圾桶',
      r: 40,
      onUse: () =>
        this.say([{ who: 'narration', text: '走廊的垃圾桶永远差一点点就满。' }]),
    });
    this.addInteractable({
      x: 713,
      y: 6,
      label: '消防栓',
      r: 40,
      onUse: () =>
        this.say([{ who: 'narration', text: '红色的消防栓箱玻璃上贴着一张「检查合格」的纸，日期是去年。' }]),
    });
    const others = [
      { x: 404, room: '111' },
      { x: 636, room: '113' },
      { x: 818, room: '114' },
    ];
    for (const o of others) {
      this.addInteractable({
        x: o.x,
        y: 58,
        label: `${o.room} 室的门`,
        r: 46,
        onUse: () =>
          this.say([
            { who: 'narration', text: `${o.room} 室的门缝里漏出光。${FLAVOR.neighborDoor}` },
          ]),
      });
    }
    this.enablePointerInteract();
  }

  private enterDorm(): void {
    if (flags.switching) return;
    flags.locked = true;
    sfx.door(true);
    this.tweens.add({ targets: this.ourLeaf, scaleX: 0.14, duration: 400, ease: 'Quad.out' });
    this.tweens.add({ targets: this.ourLeaf, alpha: 0.75, duration: 400 });
    this.time.delayedCall(320, () => this.travel('dorm', 'corridor'));
  }
}
