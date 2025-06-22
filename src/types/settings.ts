/**
 * 設定関連の型定義
 */

import { PlayMode } from './controller';

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
 * アプリケーション設定
 */
export interface AppSettings {
  /** プレイモード設定 */
  playMode: PlayModeSettings;
}

/**
 * LocalStorageのキー
 */
export const STORAGE_KEYS = {
  /** アプリケーション設定 */
  APP_SETTINGS: 'iidx-tracker-settings',
} as const;

/**
 * デフォルト設定
 */
export const DEFAULT_SETTINGS: AppSettings = {
  playMode: {
    mode: 'SP',
    dp1PGamepadIndex: null,
    dp2PGamepadIndex: null,
  },
};