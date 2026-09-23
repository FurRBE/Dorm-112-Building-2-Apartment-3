import type { CastId } from '../data/cast';
import type { SceneKey } from '../world/layout';

export const state = {
  /** 已经聊过的舍友 */
  talked: new Set<CastId>(),
  /** 是否看过开场 */
  started: false,
  /** 是否已经通关 */
  finished: false,
  /** 当前位置 */
  location: 'dorm' as SceneKey,
  /** 从哪个场景过来（用于出生点） */
  from: '' as SceneKey | '',
};

export const ROOMMATES: CastId[] = ['zhe', 'pang', 'k', 'wei'];

export function talkedCount(): number {
  return ROOMMATES.filter((id) => state.talked.has(id)).length;
}

export function allTalked(): boolean {
  return talkedCount() >= ROOMMATES.length;
}

export const LOCATION_NAME: Record<SceneKey, string> = {
  dorm: '112 寝 · 2栋3号房',
  balcony: '112 寝 · 阳台',
  corridor: '2栋 3楼 · 走廊',
};
