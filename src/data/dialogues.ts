import type { CastId } from './cast';

/** 说话人：人物 id，或者 'narration' 表示旁白 */
export type Speaker = CastId | 'narration';

export interface Line {
  who: Speaker;
  text: string;
}

export interface Reply {
  label: string;
  lines: Line[];
}

export interface Dialogue {
  lines: Line[];
  replies?: Reply[];
}

export const INTRO: Line[] = [
  { who: 'narration', text: '晚上十点四十。你端着洗脸盆从水房走回来，拖鞋还带着水。' },
  { who: 'narration', text: '走廊的灯管闪了两下。112 寝的门虚掩着，里面有人敲键盘。' },
  { who: 'you', text: '……到家了。' },
  { who: 'narration', text: '【移动：WASD / 方向键 · 交互：E / 空格 / F 或点击】' },
];

/** 四位舍友的对话，照片里的细节都塞进去了 */
export const DIALOGUES: Record<CastId, Dialogue> = {
  you: { lines: [] },
  zhe: {
    lines: [
      { who: 'narration', text: '他耳机里的鼓点漏出来，敲了两下空格才回头。' },
      { who: 'zhe', text: '啊？你说什么——哦，洗澡回来了啊。' },
      { who: 'zhe', text: '今天的热水从四楼一路凉到一楼，我在里面蹲了二十分钟，出来腿都是软的。' },
      { who: 'zhe', text: '别管我，这个跑不完今晚我不睡了。你看这条曲线，比我感情生活还平。' },
    ],
    replies: [
      {
        label: '早点睡吧',
        lines: [{ who: 'zhe', text: '睡什么睡，我还在给导师的邮箱增加未读。' }],
      },
      {
        label: '我帮你看看',
        lines: [{ who: 'zhe', text: '你敢碰我的键盘？上次你把 .git 删了那件事，我们还没算完。' }],
      },
      {
        label: '耳机里什么歌',
        lines: [{ who: 'zhe', text: '循环的是我们高中合唱比赛的伴奏。别问了，问到就尴尬。' }],
      },
    ],
  },
  pang: {
    lines: [
      { who: 'pang', text: '回来啦？我桌上那个黄袋子别动！里面是我攒了三天的零食。' },
      { who: 'pang', text: '你闻到没，走廊那头在煎蛋。四楼那个哥们的锅估计又没刷。' },
      { who: 'pang', text: '我今早六点半就起来背单词了，真的。' },
      { who: 'narration', text: '他面前的可乐罐还有一层水珠，说明它半小时前还是冰的。' },
    ],
    replies: [
      {
        label: '早饭吃了吗',
        lines: [{ who: 'pang', text: '吃两顿——早一顿，加餐一顿，这叫合理分配。' }],
      },
      {
        label: '分我一口',
        lines: [
          { who: 'pang', text: '零食不行，水可以。' },
          { who: 'pang', text: '看到那个蓝保温瓶没有？我泡的菊花茶，热的。' },
        ],
      },
      {
        label: '明天叫我起床',
        lines: [{ who: 'pang', text: '我叫你？我连自己的闹钟都能按掉三次。' }],
      },
    ],
  },
  k: {
    lines: [
      { who: 'narration', text: '被子里传出一个闷闷的声音。' },
      { who: 'k', text: '门关了没——' },
      { who: 'k', text: '关了就行。今天有没有人动我床头的充电器？' },
      { who: 'k', text: '上铺太吵了，我搬下来住。结果现在外卖小哥每次都在楼下喊我名字，全楼都认识我。' },
    ],
    replies: [
      {
        label: '起来了',
        lines: [{ who: 'k', text: '起来干嘛？明天第一节是选修，老师比我们还不想来。' }],
      },
      {
        label: '被子怎么叠的',
        lines: [{ who: 'k', text: '那不是我叠的，是它自己塌成这个形状的。很有艺术感，别动。' }],
      },
      {
        label: '阳台的风好大',
        lines: [{ who: 'k', text: '那你去看看阿伟，他晾的衣服都快飞到对面楼了。' }],
      },
    ],
  },
  wei: {
    lines: [
      { who: 'wei', text: '你来得正好，帮我拽一下这个衣架，风太大了。' },
      { who: 'wei', text: '我把我们五个的外套全洗了。绿色柜子最上层夹缝里有洗衣液，别告诉小胖。' },
      { who: 'wei', text: '你看外面那片楼，一格一格的灯。' },
      { who: 'wei', text: '我每次晾衣服就在想，以后会不会有一格是我们的。' },
    ],
    replies: [
      {
        label: '想这么远干嘛',
        lines: [{ who: 'wei', text: '不远。再过一年，我们连这间屋子都得腾出来。' }],
      },
      {
        label: '衣服我来晾',
        lines: [{ who: 'wei', text: '算了。你上次把袜子挂在栏杆外面，掉到三楼晾的内裤上，人家上来敲门了。' }],
      },
      {
        label: '进来吧，外面冷',
        lines: [{ who: 'wei', text: '再等两分钟，最后一件挂完我就进。' }],
      },
    ],
  },
};

/** 聊过之后再搭话 */
export const SHORT_TALK: Record<CastId, Line[]> = {
  you: [],
  zhe: [{ who: 'zhe', text: '（他摘下一边耳机）……嗯，你先睡，我马上。' }],
  pang: [{ who: 'pang', text: '嘘，我在背第十八个单词。' }],
  k: [{ who: 'k', text: '（被子里伸出一只手摆了摆）晚安。' }],
  wei: [{ who: 'wei', text: '风小一点了。你先回屋吧，我把灯关了。' }],
};

/** 场景里可交互杂物的旁白 */
export const FLAVOR = {
  thermos: '早上打的热水已经温了。瓶身贴着一圈胶布，写着「别喝我的」，字是小胖的。',
  snackBag: '快递单上印着「易碎品」，拆开其实是三包辣条，已经空了。',
  boxes: '走廊那堆纸箱是上学期搬宿舍留下的。谁也没扔，谁也没用。',
  fanSwitch: '吊扇转到三档会“咔、咔”响，还会轻轻晃。没人修，也没人敢关。',
  net: '蚊帐是去年开学买的，破了两个洞，用小夹子别着。夏天它救过我们五条命。',
  window: '窗外是教学楼。灯一格一格地灭下去，说明又到熄灯时间了。',
  switch112: '墙上的开关面板被按得发亮。按下去，这间屋子才算真正安静。',
  balconyView: '楼下小卖部的灯还亮着，老板在数硬币。远处高架上的车灯连成一条线。',
  washer: '洗衣机上堆着三个人的衣服。谁也不肯先动手，于是它们就在那躺了一周。',
  neighborDoor: '门里传出键盘声，还有一句「再打一局，最后一局」。你不太想推门进去。',
  stairs: '楼梯间的感应灯坏了半年。物业说下个月修，这句话从上学期说到现在。',
  notice: '公告栏贴着「严禁使用大功率电器」，右下角压着上个月的电费单，被红笔圈了三遍。',
  water: '饮水机出水的声音像叹气。桶里的水只剩一个底。',
  balconyDoor: '推拉门的玻璃上有一层水雾，是你刚才洗澡带出来的热气。',
} as const;

export const ENDING: Line[] = [
  { who: 'narration', text: '你按下了开关。' },
  { who: 'narration', text: '吊扇慢慢停下来。走廊的光从门缝里斜进来，落在绿柜子上。' },
  { who: 'zhe', text: '……灯关了，那我也睡了。明天早上叫我。' },
  { who: 'pang', text: '（含糊地）零食在我抽屉第二格，谁都能拿，反正我明天买新的。' },
  { who: 'k', text: '谁把门反锁一下。' },
  { who: 'wei', text: '锁了。阳台的衣服我收进来了，挂在你床头。' },
  { who: 'narration', text: '三公寓二号楼 · 112 寝。' },
  { who: 'narration', text: '第 一 夜 · 完' },
];
