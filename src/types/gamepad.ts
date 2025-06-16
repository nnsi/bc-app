/**
 * ゲームパッド関連の型定義
 */

/**
 * ゲームパッドボタンの状態
 */
export interface GamepadButton {
  /** ボタンが押されているか */
  pressed: boolean;
  /** ボタンがタッチされているか（タッチ対応の場合） */
  touched?: boolean;
  /** ボタンの圧力値（0.0-1.0） */
  value?: number;
}

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
 * ゲームパッド自動検出の設定
 */
export interface GamepadDetectionConfig {
  /** 自動検出が有効か */
  enabled: boolean;
  /** 検出間隔（ミリ秒） */
  interval: number;
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