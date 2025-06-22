/**
 * コントローラー状態の比較ユーティリティ
 */

import { ControllerStatus, DPControllerStatus } from '../types/controller';

/**
 * SPモードのコントローラー状態が変更されたかチェック
 */
export function hasSPControllerChanged(
  prev: ControllerStatus | null,
  current: ControllerStatus
): boolean {
  if (!prev) return true;

  // 記録データの変化をチェック
  if (prev.record.pressedTimes.length !== current.record.pressedTimes.length ||
      prev.record.releaseTimes.length !== current.record.releaseTimes.length) {
    return true;
  }

  // スクラッチカウントの変化をチェック
  if (prev.scratch.count !== current.scratch.count) {
    return true;
  }

  // スクラッチの状態変化をチェック
  if (prev.scratch.state !== current.scratch.state) {
    return true;
  }

  // キーの押下状態の変化をチェック
  for (let i = 0; i < prev.keys.length; i++) {
    if (prev.keys[i].isPressed !== current.keys[i].isPressed) {
      return true;
    }
  }

  return false;
}

/**
 * DPモードのコントローラー状態が変更されたかチェック
 */
export function hasDPControllerChanged(
  prev: DPControllerStatus | null,
  current: DPControllerStatus
): boolean {
  if (!prev) return true;

  // Player1の変化をチェック
  if (current.player1) {
    if (!prev.player1) {
      return true;
    }
    if (hasSPControllerChanged(prev.player1, current.player1)) {
      return true;
    }
  } else if (prev.player1) {
    // player1が存在していたが、現在は存在しない
    return true;
  }

  // Player2の変化をチェック
  if (current.player2) {
    if (!prev.player2) {
      return true;
    }
    if (hasSPControllerChanged(prev.player2, current.player2)) {
      return true;
    }
  } else if (prev.player2) {
    // player2が存在していたが、現在は存在しない
    return true;
  }

  return false;
}