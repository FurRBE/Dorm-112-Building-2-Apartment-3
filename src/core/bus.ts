import Phaser from 'phaser';

/** 场景之间的事件总线 */
export const bus = new Phaser.Events.EventEmitter();

export const EV = {
  /** 请求打开对话框：{ lines, replies, onDone } */
  DIALOGUE: 'dialogue',
  /** 顶部飘字 */
  TOAST: 'toast',
  /** 交互键按下 */
  INTERACT: 'interact',
  /** 地点横幅 */
  BANNER: 'banner',
  /** 结算画面 */
  ENDING: 'ending',
  /** 任务进度变化 */
  QUEST: 'quest',
} as const;
