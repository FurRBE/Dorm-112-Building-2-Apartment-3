import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { UIScene } from './scenes/UIScene';
import { DormScene } from './scenes/DormScene';
import { BalconyScene } from './scenes/BalconyScene';
import { CorridorScene } from './scenes/CorridorScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  backgroundColor: '#0b0a09',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1080,
    height: 720,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  render: {
    antialias: true,
    roundPixels: false,
    powerPreference: 'high-performance',
  },
  disableContextMenu: true,
  // 注意顺序：UIScene 最后加入，才能盖在房间场景之上
  scene: [BootScene, DormScene, BalconyScene, CorridorScene, UIScene],
};

const game = new Phaser.Game(config);

// 手机上防止页面被拖动
window.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches.length > 1) e.preventDefault();
  },
  { passive: false },
);

export default game;
