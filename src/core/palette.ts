/**
 * 112 寝配色 —— 从实拍照片里取的色（绿色储物柜、米色地砖、奶白墙面、
 * 金属床架、白色蚊帐/床帘、暖黄吊灯、蓝色热水瓶、黄色快递袋）。
 * 夜晚氛围：室内暖光 + 室外冷蓝。
 */

export const C = {
  // 地面
  floor1: '#cdc5ad',
  floor2: '#c3baa0',
  floor3: '#b8ae93',
  grout: '#aaa084',

  // 墙面
  wall: '#e7e0cd',
  wallTop: '#f1ecdc',
  wallDark: '#c9c1a9',
  wallShadow: '#a9a08a',
  wallTrim: '#8f9a72',

  // 绿色铁皮柜 / 门
  green: '#9db05e',
  greenLight: '#b9cb79',
  greenDark: '#7c8f45',
  greenDeep: '#63733a',
  doorGreen: '#96b573',
  doorGreenDark: '#6f8c53',

  // 金属床架
  metal: '#bcc7c8',
  metalLight: '#e2e9e9',
  metalDark: '#8b9899',
  metalDeep: '#6c7879',

  // 木头
  wood: '#c39b64',
  woodLight: '#ddbb88',
  woodDark: '#96703c',
  woodDeep: '#6d5029',

  // 布艺
  clothWhite: '#eae7dd',
  clothWhite2: '#ddd9cc',
  clothGray: '#aaafb4',
  clothGray2: '#8d9298',
  blanket: '#a9b3b8',
  blanket2: '#87929a',
  pillow: '#f3f0e6',

  // 物品
  yellow: '#e9b424',
  yellowDark: '#c2900f',
  blue: '#3f7fc4',
  blueLight: '#6aa5e0',
  black: '#2c2d31',
  blackLight: '#43454b',
  cardboard: '#c99a5f',
  cardboardDark: '#a67a44',

  // 人
  skin: '#e6b98f',
  skinDark: '#c8936a',
  hairDark: '#2a2320',

  // 光 / 夜
  warmLight: '#ffe6ad',
  night: '#1b2740',
  night2: '#2c3d5c',
  nightGlow: '#4d5f80',
  lampGlow: '#ffd98a',

  // UI
  ink: '#23211d',
  paper: '#f4efe2',
  paperDark: '#ded6c3',
  accent: '#9db05e',
  uiText: '#f6f1e4',
  uiDim: '#a79f8c',
} as const;

export type ColorKey = keyof typeof C;
