/**
 * 設定関連の型定義
 */

import { PlayMode, CONTROLLER_CONSTANTS } from './controller';

/**
 * プレイモード設定
 */
export interface PlayModeSettings {
  /** 現在のプレイモード */
  mode: PlayMode;
  /** DPモード時の1P側ゲームパッドインデックス */
  dp1PGamepadIndex: number | null;
  /** DPモード時の2P側ゲームパッドインデックス */
  dp2PGamepadIndex: number | null;
}

/**
 * コントローラー設定
 */
export interface ControllerSettings {
  /** スクラッチ状態保持時間(ミリ秒) */
  fixedScratchStateTime: number;
  /** ポーリング間隔(ミリ秒) */
  loopMilliSeconds: number;
  /** 記録するリリース時間の最大数 */
  maxReleaseTimes: number;
  /** 各鍵盤ごとに記録するリリース時間の最大数 */
  maxKeyReleaseTimes: number;
  /** 記録する打鍵時刻の最大数 */
  maxPressedTimes: number;
  /** 記録するスクラッチ時刻の最大数 */
  maxScratchTimes: number;
  /** ロングノートとみなす最小時間(ミリ秒) */
  longNoteThreshold: number;
}

/**
 * アプリケーション設定
 */
export interface AppSettings {
  /** プレイモード設定 */
  playMode: PlayModeSettings;
  /** コントローラー設定 */
  controller: ControllerSettings;
}

/**
 * LocalStorageのキー
 */
export const STORAGE_KEYS = {
  /** アプリケーション設定 */
  APP_SETTINGS: 'iidx-tracker-settings',
} as const;

/**
 * デフォルトのコントローラー設定
 */
export const DEFAULT_CONTROLLER_SETTINGS: ControllerSettings = {
  fixedScratchStateTime: CONTROLLER_CONSTANTS.FIXED_SCRATCH_STATE_TIME,
  loopMilliSeconds: CONTROLLER_CONSTANTS.LOOP_MILLI_SECONDS,
  maxReleaseTimes: CONTROLLER_CONSTANTS.MAX_RELEASE_TIMES,
  maxKeyReleaseTimes: CONTROLLER_CONSTANTS.MAX_KEY_RELEASE_TIMES,
  maxPressedTimes: CONTROLLER_CONSTANTS.MAX_PRESSED_TIMES,
  maxScratchTimes: CONTROLLER_CONSTANTS.MAX_SCRATCH_TIMES,
  longNoteThreshold: CONTROLLER_CONSTANTS.LONG_NOTE_THRESHOLD,
};

/**
 * デフォルト設定
 */
export const DEFAULT_SETTINGS: AppSettings = {
  playMode: {
    mode: 'SP',
    dp1PGamepadIndex: null,
    dp2PGamepadIndex: null,
  },
  controller: DEFAULT_CONTROLLER_SETTINGS,
};