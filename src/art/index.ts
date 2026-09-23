import { bakeAllTextures } from '../core/canvas';
import './rooms';
import './furniture';
import './exterior';
import './portraits';

export function bakeArt(scene: Phaser.Scene): void {
  bakeAllTextures(scene);
}
