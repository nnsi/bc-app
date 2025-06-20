/**
 * アプリケーション設定管理フック
 */

import { useState, useEffect, useCallback } from 'react';
import { AppSettings, DEFAULT_SETTINGS, STORAGE_KEYS, PlayModeSettings } from '../types/settings';
import { PlayMode } from '../types/controller';

/**
 * useSettingsフックの戻り値
 */
export interface UseSettingsReturn {
  /** 現在の設定 */
  settings: AppSettings;
  /** プレイモードを変更 */
  setPlayMode: (mode: PlayMode) => void;
  /** DPモードのゲームパッド割り当てを変更 */
  setDPGamepadMapping: (player1Index: number | null, player2Index: number | null) => void;
  /** 設定をリセット */
  resetSettings: () => void;
}

/**
 * アプリケーション設定を管理するフック
 */
export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // 初回読み込み時にlocalStorageから設定を復元
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings) as AppSettings;
        console.log('[useSettings] Loaded settings:', parsed);
        setSettings(parsed);
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
  }, []);

  // 設定が変更されたらlocalStorageに保存
  const saveSettings = useCallback((newSettings: AppSettings) => {
    try {
      localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }, []);

  // プレイモードを変更
  const setPlayMode = useCallback((mode: PlayMode) => {
    const newSettings: AppSettings = {
      ...settings,
      playMode: {
        ...settings.playMode,
        mode,
      },
    };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  // DPモードのゲームパッド割り当てを変更
  const setDPGamepadMapping = useCallback(
    (player1Index: number | null, player2Index: number | null) => {
      const newSettings: AppSettings = {
        ...settings,
        playMode: {
          ...settings.playMode,
          dp1PGamepadIndex: player1Index,
          dp2PGamepadIndex: player2Index,
        },
      };
      saveSettings(newSettings);
    },
    [settings, saveSettings]
  );

  // 設定をリセット
  const resetSettings = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  return {
    settings,
    setPlayMode,
    setDPGamepadMapping,
    resetSettings,
  };
};