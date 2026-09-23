import { img } from '../core/canvas';
import { sfx } from '../core/audio';
import { bus, EV } from '../core/bus';
import { flags } from '../core/input';
import { state, talkedCount } from '../core/state';
import { DIALOGUES, FLAVOR, SHORT_TALK } from '../data/dialogues';
import { BALCONY } from '../world/layout';
import { RoomScene } from './RoomScene';
import type { Spawn } from './RoomScene';

export class BalconyScene extends RoomScene {
  private leaves: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('balcony');
  }

  protected spawn(): Spawn {
    return { ...BALCONY.spawnFromDorm };
  }

  protected buildWorld(): void {
    this.addShell('balconyShell', BALCONY.shell.x, BALCONY.shell.y);
    this.setWalkArea(18, 22, BALCONY.w - 36, BALCONY.h - 36);
    this.setCameraArea(BALCONY.shell.x, BALCONY.shell.y, BALCONY.shell.w, BALCONY.shell.h);

    /* ---- 夜景（栏杆外侧下方）---- */
    const sky = img(this, 'skyNight', 0, BALCONY.sky.y, 0, 0);
    sky.setDepth(-970);
    // 远处楼宇的灯光在闪
    for (let i = 0; i < 7; i++) {
      const dot = this.add.graphics().setDepth(-960);
      dot.fillStyle(i % 2 ? 0xffd88c : 0x9fd8ff, 0.85);
      dot.fillCircle(40 + i * 62, BALCONY.sky.y + 60 + (i % 3) * 34, 1.6);
      this.tweens.add({
        targets: dot,
        alpha: { from: 0.2, to: 1 },
        duration: 900 + i * 260,
        yoyo: true,
        repeat: -1,
        delay: i * 180,
      });
    }

    /* ---- 灯光 ---- */
    this.addLight(210, 60, 260, 0.34);
    this.addLight(90, 110, 150, 0.16);
    this.addLight(360, 120, 140, 0.14);

    /* ---- 阳台栏杆（永远挡在人前面）---- */
    const rail = img(this, 'balconyRail', 0, BALCONY.rail.y - 6, 0, 0);
    rail.setDepth(2000);

    /* ---- 回寝室的门（推拉玻璃扇）---- */
    const d = BALCONY.door;
    const w1 = d.w / 2;
    const l1 = img(this, 'balconyLeaf', d.x + w1 / 2, 4, 0.5, 1);
    const l2 = img(this, 'balconyLeaf', d.x + w1 + w1 / 2, 4, 0.5, 1);
    l1.setDepth(-880);
    l2.setDepth(-882);
    this.leaves = [l1, l2];

    /* ---- 家具与杂物 ---- */
    this.place('washer', 76, 96);
    this.addSolid(76, 62, 62, 68);
    this.place('airconUnit', 30, 130, { flipX: true });
    this.addSolid(30, 110, 46, 40);
    this.place('waterHeater', 400, 74);
    this.addSolid(400, 46, 36, 54);
    this.place('pottedPlant', 402, 154);
    this.place('pottedPlant', 372, 40);
    this.place('bucket', 152, 176);
    this.place('mop', 178, 182);
    this.place('slippers', 214, 178);
    this.place('boxStack', 336, 176);
    this.place('chairWood', 122, 168);

    // 晾衣绳 + 衣服
    const rope = this.add.graphics().setDepth(136);
    rope.lineStyle(1.4, 0xe8e4d8, 0.7);
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(96, 96),
      new Phaser.Math.Vector2(230, 110),
      new Phaser.Math.Vector2(392, 96),
    );
    rope.strokePoints(curve.getPoints(28), false, false);
    this.place('laundry', 244, 140);

    /* ---- 阿伟 ---- */
    const wei = this.addNpc('wei', 308, 158, 'up', 'stand', true);
    void wei;
    this.addInteractable({
      x: 308,
      y: 152,
      label: '和阿伟说话',
      r: 58,
      onUse: () => {
        const first = !state.talked.has('wei');
        if (first) {
          state.talked.add('wei');
          sfx.chime();
          bus.emit(EV.QUEST, talkedCount());
        }
        this.say(
          first ? DIALOGUES.wei.lines : SHORT_TALK.wei,
          first ? DIALOGUES.wei.replies : undefined,
        );
      },
    });

    /* ---- 其他交互 ---- */
    this.addInteractable({
      x: 208,
      y: 44,
      label: '回寝室',
      r: 46,
      ringScale: 1.2,
      onUse: () => this.backInside(),
    });
    this.addInteractable({
      x: 212,
      y: 184,
      label: '靠在栏杆上',
      r: 56,
      ringScale: 1.4,
      onUse: () => this.say([{ who: 'narration', text: FLAVOR.balconyView }]),
    });
    this.addInteractable({
      x: 76,
      y: 128,
      label: '洗衣机',
      r: 46,
      onUse: () => this.say([{ who: 'narration', text: FLAVOR.washer }]),
    });
    this.addInteractable({
      x: 122,
      y: 176,
      label: '这把塑料凳',
      r: 38,
      onUse: () =>
        this.say([
          { who: 'narration', text: '塑料凳是去年军训发的，阿伟每天晚上坐在这儿晾衣服。' },
        ]),
    });
    this.enablePointerInteract();
  }

  private backInside(): void {
    if (flags.switching) return;
    flags.locked = true;
    sfx.door(true);
    const l2 = this.leaves[1];
    this.tweens.add({ targets: l2, x: l2.x + 44, duration: 420, ease: 'Quad.out' });
    this.time.delayedCall(400, () => this.travel('dorm', 'balcony'));
  }
}
