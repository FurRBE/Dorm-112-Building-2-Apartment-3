import Phaser from 'phaser';
import { bakeArt } from '../art';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    bakeArt(this);

    const cover = document.getElementById('boot-cover');
    if (cover) {
      cover.classList.add('hidden');
      window.setTimeout(() => cover.remove(), 700);
    }

    this.scene.launch('ui');
    this.scene.start('dorm');
  }
}
