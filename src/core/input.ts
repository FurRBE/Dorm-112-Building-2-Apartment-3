/** 跨场景共享的输入状态：键盘在 RoomScene 里读，摇杆在 UIScene 里写 */
export const input = {
  /** 虚拟摇杆方向（-1 ~ 1） */
  jx: 0,
  jy: 0,
  /** 摇杆是否被按下 */
  joystickActive: false,
};

export const flags = {
  /** 对话框打开时锁住移动 */
  locked: false,
  /** 场景切换中 */
  switching: false,
};
