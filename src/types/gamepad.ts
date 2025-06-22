/**
 * ゲームパッド関連の型定義
 */


/**
 * カスタムGamepad型（Tauri gamepad APIとブラウザGamepad APIの共通インターフェース）
 */
export interface IGamepad {
  /** ゲームパッドのインデックス */
  index: number;
  /** ゲームパッドのID/名前 */
  id: string;
  /** ボタンの配列 */
  buttons: GamepadButton[];
  /** 軸（スティック、トリガーなど）の値の配列 */
  axes: number[];
  /** 接続状態 */
  connected: boolean;
  /** タイムスタンプ */
  timestamp?: DOMHighResTimeStamp;
}


/**
 * ゲームパッド関連の定数
 */
export const GAMEPAD_CONSTANTS = {
  /** 自動検出のデフォルト間隔（ミリ秒） */
  AUTO_DETECTION_INTERVAL: 100,
  /** スクラッチに使用する軸のインデックス */
  SCRATCH_AXIS_INDEX: 0,
} as const;