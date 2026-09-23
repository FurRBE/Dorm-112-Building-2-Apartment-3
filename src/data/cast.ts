/** 全部出场人物的设定：既用于世界里的立绘小人，也用于对话框头像 */

export type CastId = 'you' | 'zhe' | 'pang' | 'k' | 'wei';

export interface CastMember {
  id: CastId;
  /** 对话框里显示的名字 */
  name: string;
  /** 一句话人设 */
  role: string;
  skin: string;
  skinDark: string;
  hair: string;
  shirt: string;
  shirtDark: string;
  pants: string;
  pantsDark: string;
  shoe: string;
  hairStyle: 'short' | 'bowl' | 'buzz' | 'messy';
  accessory: 'none' | 'headphone' | 'glasses' | 'cap' | 'towel';
  /** 肖像背景色 */
  bg: string;
}

export const CAST: Record<CastId, CastMember> = {
  you: {
    id: 'you',
    name: '我',
    role: '112 寝 5 号床 · 刚洗完澡',
    skin: '#e8bd93',
    skinDark: '#c8946b',
    hair: '#2b2320',
    shirt: '#3c4a63',
    shirtDark: '#2a3549',
    pants: '#4a5266',
    pantsDark: '#363c4c',
    shoe: '#2f3238',
    hairStyle: 'short',
    accessory: 'none',
    bg: '#3f4d63',
  },
  zhe: {
    id: 'zhe',
    name: '阿哲',
    role: '1 号床 · 戴着耳机肝毕设',
    skin: '#e2b489',
    skinDark: '#bd8b62',
    hair: '#1f1a18',
    shirt: '#2f3237',
    shirtDark: '#202226',
    pants: '#3a3f45',
    pantsDark: '#2b2f34',
    shoe: '#26282c',
    hairStyle: 'bowl',
    accessory: 'headphone',
    bg: '#4a4a52',
  },
  pang: {
    id: 'pang',
    name: '小胖',
    role: '2 号床 · 边吃边学，学习效率最高',
    skin: '#eec49b',
    skinDark: '#c99a72',
    hair: '#332a24',
    shirt: '#c7a074',
    shirtDark: '#a8845c',
    pants: '#5b6470',
    pantsDark: '#464e58',
    shoe: '#3a3d42',
    hairStyle: 'short',
    accessory: 'glasses',
    bg: '#7d6b52',
  },
  k: {
    id: 'k',
    name: '老K',
    role: '3 号床 · 下铺常驻，人称床神',
    skin: '#dfae83',
    skinDark: '#b98760',
    hair: '#28211e',
    shirt: '#e7e2d4',
    shirtDark: '#cbc5b4',
    pants: '#5a6270',
    pantsDark: '#464d59',
    shoe: '#33363b',
    hairStyle: 'messy',
    accessory: 'none',
    bg: '#6b6f5c',
  },
  wei: {
    id: 'wei',
    name: '阿伟',
    role: '4 号床 · 阳台常驻，承包全寝晾衣服',
    skin: '#e6b98f',
    skinDark: '#c28f66',
    hair: '#221c1a',
    shirt: '#ded9cd',
    shirtDark: '#bcb6a8',
    pants: '#6f7f98',
    pantsDark: '#57647a',
    shoe: '#4a4d52',
    hairStyle: 'buzz',
    accessory: 'towel',
    bg: '#5f7288',
  },
};

export const CAST_ORDER: CastId[] = ['you', 'zhe', 'pang', 'k', 'wei'];
