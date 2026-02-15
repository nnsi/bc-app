/**
 * アプリケーション設定管理フック
 */

import { useState, useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { AppSettings, ControllerSettings, DEFAULT_SETTINGS, DEFAULT_CONTROLLER_SETTINGS, STORAGE_KEYS } from '../types/settings';
import { PlayMode } from '../types/controller';

/**
 * useSettingsフックの戻り値
 */
interface UseSettingsReturn {
  /** 現在の設定 */
  settings: AppSettings;
  /** プレイモードを変更 */
  setPlayMode: (mode: PlayMode) => void;
  /** DPモードのゲームパッド割り当てを変更 */
  setDPGamepadMapping: (player1Index: number | null, player2Index: number | null) => void;
  /** コントローラー設定を変更（部分更新） */
  setControllerSettings: (settings: Partial<ControllerSettings>) => void;
  /** コントローラー設定をデフォルトに戻す */
  resetControllerSettings: () => void;
  /** 設定をリセット */
  resetSettings: () => void;
  /** DPモードのゲームパッド割り当てをリセット */
  resetDPGamepadMapping: () => void;
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
        const parsed = JSON.parse(savedSettings);
        // controller設定が未保存の場合はデフォルト値で補完
        const merged: AppSettings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          controller: {
            ...DEFAULT_CONTROLLER_SETTINGS,
            ...(parsed.controller ?? {}),
          },
        };
        console.log('[useSettings] Loaded settings:', merged);
        setSettings(merged);
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
  }, []);

  // 設定ウィンドウからの変更をリッスン
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    listen<ControllerSettings>('settings-changed', (event) => {
      setSettings(prev => ({
        ...prev,
        controller: {
          ...DEFAULT_CONTROLLER_SETTINGS,
          ...event.payload,
        },
      }));
    }).then(fn => { unlisten = fn; });

    return () => { unlisten?.(); };
  }, []);

  // 設定が変更されたらlocalStorageに保存（functional update対応）
  const saveSettings = useCallback((updater: (prev: AppSettings) => AppSettings) => {
    setSettings(prev => {
      const newSettings = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(newSettings));
      } catch (error) {
        console.error('Failed to save settings to localStorage:', error);
      }
      return newSettings;
    });
  }, []);

  // プレイモードを変更
  const setPlayMode = useCallback((mode: PlayMode) => {
    saveSettings(prev => ({
      ...prev,
      playMode: {
        ...prev.playMode,
        mode,
      },
    }));
  }, [saveSettings]);

  // DPモードのゲームパッド割り当てを変更
  const setDPGamepadMapping = useCallback(
    (player1Index: number | null, player2Index: number | null) => {
      saveSettings(prev => ({
        ...prev,
        playMode: {
          ...prev.playMode,
          dp1PGamepadIndex: player1Index,
          dp2PGamepadIndex: player2Index,
        },
      }));
    },
    [saveSettings]
  );

  // 設定をリセット
  const resetSettings = useCallback(() => {
    saveSettings(() => DEFAULT_SETTINGS);
  }, [saveSettings]);

  // DPモードのゲームパッド割り当てをリセット
  const resetDPGamepadMapping = useCallback(() => {
    saveSettings(prev => ({
      ...prev,
      playMode: {
        ...prev.playMode,
        dp1PGamepadIndex: null,
        dp2PGamepadIndex: null,
      },
    }));
  }, [saveSettings]);

  // コントローラー設定を変更（部分更新）
  const setControllerSettings = useCallback(
    (controllerUpdate: Partial<ControllerSettings>) => {
      saveSettings(prev => ({
        ...prev,
        controller: {
          ...(prev.controller ?? DEFAULT_CONTROLLER_SETTINGS),
          ...controllerUpdate,
        },
      }));
    },
    [saveSettings]
  );

  // コントローラー設定をデフォルトに戻す
  const resetControllerSettings = useCallback(() => {
    saveSettings(prev => ({
      ...prev,
      controller: DEFAULT_CONTROLLER_SETTINGS,
    }));
  }, [saveSettings]);

  return {
    settings,
    setPlayMode,
    setDPGamepadMapping,
    setControllerSettings,
    resetControllerSettings,
    resetSettings,
    resetDPGamepadMapping,
  };
};