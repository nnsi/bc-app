/**
 * コントローラーステータスの比較ユーティリティ
 */

import { ControllerStatus } from '../types/controller';

/**
 * 2つのコントローラーステータスが等しいかを効率的に比較
 * @param a 比較対象A
 * @param b 比較対象B
 * @returns 等しい場合はtrue
 */
export function compareControllerStatus(
  a: ControllerStatus | null,
  b: ControllerStatus | null
): boolean {
  // null チェック
  if (a === null || b === null) {
    return a === b;
  }

  // キーの状態を比較
  for (let i = 0; i < a.keys.length; i++) {
    const keyA = a.keys[i];
    const keyB = b.keys[i];
    
    if (keyA.isPressed !== keyB.isPressed ||
        keyA.strokeCount !== keyB.strokeCount) {
      return false;
    }
  }

  // スクラッチの状態を比較
  if (a.scratch.state !== b.scratch.state ||
      a.scratch.count !== b.scratch.count ||
      a.scratch.currentAxes !== b.scratch.currentAxes) {
    return false;
  }

  // 記録データは送信に影響しないため比較しない
  // （リアルタイムデータのみを比較）

  return true;
}