/**
 * コントローラー関連の型定義
 */

/**
 * 各鍵盤の状態
 */
export interface KeyStatus {
  /** 現在押されているか */
  isPressed: boolean;
  /** 状態が変化したか */
  isChangedState: boolean;
  /** 前の状態 */
  beforeState: boolean;
  /** 前の状態の開始時刻(UNIX時間) */
  beforeStateTime: number;
  /** リリース時間(ミリ秒) */
  releaseTime: number;
  /** 打鍵回数 */
  strokeCount: number;
}

/**
 * スクラッチの状態
 */
export interface ScratchStatus {
  /** 現在の軸の値 */
  currentAxes: number;
  /** 前の軸の値 */
  previousAxes: number | undefined;
  /** 状態固定時間(ミリ秒) */
  fixedStateTime: number;
  /** スクラッチ状態 (-1:下回転, 0:中立, 1:上回転) */
  state: -1 | 0 | 1;
  /** スクラッチ回数 */
  count: number;
  /** 今回の回転距離 */
  rotationDistance: number;
  /** 回転距離記録時刻(UNIX時間) */
  rotationTime: number;
  /** 現在のストロークの累積回転距離 */
  strokeDistance: number;
}

/**
 * 記録データ
 */
export interface Record {
  /** リリース時間の配列 */
  releaseTimes: number[];
  /** 各鍵盤ごとのリリース時間の配列 */
  keyReleaseTimes: number[][];
  /** 打鍵時刻の配列(UNIX時間) */
  pressedTimes: number[];
  /** スクラッチ回転時刻の配列(UNIX時間) */
  scratchTimes: number[];
  /** スクラッチ回転距離の配列 */
  scratchRotationDistances: number[];
}

/**
 * コントローラー全体の状態
 */
export interface ControllerStatus {
  /** 7つの鍵盤の状態配列 */
  keys: KeyStatus[];
  /** スクラッチの状態 */
  scratch: ScratchStatus;
  /** 記録データ */
  record: Record;
}

/**
 * プレイモード（シングルプレイ/ダブルプレイ）
 */
export type PlayMode = 'SP' | 'DP';

/**
 * ダブルプレイ時のコントローラー状態
 */
export interface DPControllerStatus {
  /** プレイモード */
  mode: 'DP';
  /** 1P側コントローラー状態 */
  player1: ControllerStatus | null;
  /** 2P側コントローラー状態 */
  player2: ControllerStatus | null;
  /** タイムスタンプ */
  timestamp: number;
}

/**
 * 物理ボタン番号から鍵盤番号へのマッピング
 */
export const KEY_MAPPING = {
  "5": 0,  // 1鍵
  "1": 1,  // 2鍵
  "2": 2,  // 3鍵
  "4": 3,  // 4鍵
  "7": 4,  // 5鍵
  "8": 5,  // 6鍵
  "9": 6,  // 7鍵
} as const;

/**
 * コントローラー関連の定数
 */
export const CONTROLLER_CONSTANTS = {
  /** スクラッチ状態保持時間(ミリ秒) */
  FIXED_SCRATCH_STATE_TIME: 200,
  /** ポーリング間隔(ミリ秒) */
  LOOP_MILLI_SECONDS: 5,
  /** 記録するリリース時間の最大数 */
  MAX_RELEASE_TIMES: 2000,
  /** 各鍵盤ごとに記録するリリース時間の最大数 */
  MAX_KEY_RELEASE_TIMES: Math.floor(2000 / 6),
  /** 記録する打鍵時刻の最大数 */
  MAX_PRESSED_TIMES: 500,
  /** 記録するスクラッチ時刻の最大数 */
  MAX_SCRATCH_TIMES: 500,
  /** ロングノートとみなす最小時間(ミリ秒) */
  LONG_NOTE_THRESHOLD: 200,
} as const;