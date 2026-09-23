import Phaser from 'phaser';
import { Character } from './Character';
import { CAST } from '../data/cast';

export class Player extends Character {
  pbody: Phaser.Physics.Arcade.Body;
  /** 走路音效节流 */
  stepTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, CAST.you);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(22, 14);
    body.setOffset(-11, -13);
    body.setCollideWorldBounds(true);
    this.pbody = body;
  }

  move(vx: number, vy: number, speed: number): void {
    this.pbody.setVelocity(vx * speed, vy * speed);
  }

  stop(): void {
    this.pbody.setVelocity(0, 0);
  }
}
