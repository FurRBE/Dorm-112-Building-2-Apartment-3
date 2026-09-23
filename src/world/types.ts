export interface Interactable {
  x: number;
  y: number;
  label: string;
  /** 触发半径 */
  r?: number;
  /** 站到物件上方或下方都能点：默认不做方向限制 */
  onUse: () => void;
  enabled?: () => boolean;
  /** 高亮圈 */
  ring?: Phaser.GameObjects.Image;
  /** 只触发一次 */
  once?: boolean;
  used?: boolean;
  /** 光圈大小 */
  ringScale?: number;
}
