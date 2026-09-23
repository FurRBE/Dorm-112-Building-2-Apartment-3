/**
 * 三个场景的尺寸与关键坐标（世界单位 = 设计像素，约 32px ≈ 0.3m）。
 * 美术与逻辑共用这里的常量，保证贴图和对齐永远一致。
 */

/** 寝室：窄长条，中间过道，两侧上下铺 + 绿柜书桌 */
export const DORM = {
  w: 384,
  h: 768,
  /** 北墙立面高度（伪 3/4 视角） */
  wallH: 64,
  /** 侧墙厚度 */
  side: 18,
  /** 剖切墙总厚度（含外侧断面） */
  cut: 48,
  /** 外壳贴图覆盖范围：正好等于镜头一屏的宽度 */
  shell: { x: -48, y: -66, w: 480, h: 860 },
  /** 左右两排的横向占位 */
  rowL: { x: 6, w: 124 },
  rowR: { x: 254, w: 124 },
  /** 每套 上下铺 + 桌柜 的长度与起点 */
  unitLen: 290,
  unitYs: [72, 388],
  bunkLen: 170,
  deskLen: 120,
  /** 门洞 */
  northDoor: { x: 164, w: 60 },
  southDoor: { x: 162, w: 64 },
  /** 出生点 */
  spawnFromBalcony: { x: 192, y: 634, facing: 'up' as const },
  spawnFromCorridor: { x: 192, y: 96, facing: 'down' as const },
  /** 房间中心（灯光、镜头参考） */
  center: { x: 192, y: 384 },
} as const;

/** 阳台：矮长条，南侧栏杆，栏杆外是夜景 */
export const BALCONY = {
  w: 420,
  h: 200,
  wallH: 64,
  cut: 48,
  shell: { x: -48, y: -66, w: 516, h: 500 },
  /** 回寝室的门（北墙） */
  door: { x: 168, w: 80 },
  /** 栏杆 */
  rail: { y: 196, h: 18 },
  /** 夜景天空带（在栏杆外侧下方） */
  sky: { y: 214, h: 206 },
  spawnFromDorm: { x: 208, y: 52, facing: 'down' as const },
} as const;

/** 走廊：横向长条，北侧一排宿舍门 */
export const CORRIDOR = {
  w: 900,
  h: 190,
  wallH: 64,
  cut: 48,
  shell: { x: -48, y: -66, w: 996, h: 316 },
  doors: [
    { x: 150, w: 64, label: '112', ours: true },
    { x: 372, w: 64, label: '111', ours: false },
    { x: 604, w: 64, label: '113', ours: false },
    { x: 786, w: 64, label: '114', ours: false },
  ],
  /** 西侧楼梯口 */
  stair: { x: 0, w: 104 },
  spawnFromDorm: { x: 182, y: 44, facing: 'down' as const },
} as const;

export type SceneKey = 'dorm' | 'balcony' | 'corridor';

export interface SpawnPoint {
  x: number;
  y: number;
  facing: 'up' | 'down' | 'left' | 'right';
}
