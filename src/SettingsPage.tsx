/**
 * 設定ウィンドウ用のページコンポーネント
 * 別ウィンドウで表示され、メインウィンドウとTauriイベントで連携する
 */

import { useState, useEffect, useCallback } from 'react';
import { emit } from '@tauri-apps/api/event';
import type { ControllerSettings } from './types/settings';
import { DEFAULT_CONTROLLER_SETTINGS, STORAGE_KEYS, DEFAULT_SETTINGS } from './types/settings';

const SETTINGS_FIELDS: { key: keyof ControllerSettings; label: string; unit: string; min: number; max: number }[] = [
  { key: 'fixedScratchStateTime', label: 'スクラッチ保持時間', unit: 'ms', min: 50, max: 1000 },
  { key: 'loopMilliSeconds', label: 'ポーリング間隔', unit: 'ms', min: 1, max: 100 },
  { key: 'longNoteThreshold', label: 'ロングノート閾値', unit: 'ms', min: 50, max: 1000 },
  { key: 'maxReleaseTimes', label: 'リリース記録数', unit: '', min: 100, max: 10000 },
  { key: 'maxKeyReleaseTimes', label: '鍵盤リリース記録打鍵数', unit: '', min: 50, max: 5000 },
  { key: 'maxPressedTimes', label: '打鍵記録数', unit: '', min: 100, max: 5000 },
  { key: 'maxScratchTimes', label: 'スクラッチ記録数', unit: '', min: 100, max: 5000 },
];

export function SettingsPage() {
  const [settings, setSettings] = useState<ControllerSettings>(DEFAULT_CONTROLLER_SETTINGS);

  // localStorageから現在の設定を読み込み
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({
          ...DEFAULT_CONTROLLER_SETTINGS,
          ...(parsed.controller ?? {}),
        });
      }
    } catch {
      // デフォルト値を使用
    }
  }, []);

  // localStorage保存 + メインウィンドウへイベント通知
  const saveAndEmit = useCallback((newSettings: ControllerSettings) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      const appSettings = saved ? JSON.parse(saved) : { ...DEFAULT_SETTINGS };
      appSettings.controller = newSettings;
      localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(appSettings));
    } catch { /* ignore */ }
    emit('settings-changed', newSettings);
  }, []);

  const handleChange = useCallback((update: Partial<ControllerSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...update };
      saveAndEmit(newSettings);
      return newSettings;
    });
  }, [saveAndEmit]);

  const handleReset = useCallback(() => {
    setSettings(DEFAULT_CONTROLLER_SETTINGS);
    saveAndEmit(DEFAULT_CONTROLLER_SETTINGS);
  }, [saveAndEmit]);

  return (
    <div className="min-h-screen bg-neutral-800 text-white p-4 select-none">
      <div className="space-y-1">
        {SETTINGS_FIELDS.map((field) => (
          <div key={field.key} className="flex items-center justify-between py-[3px]">
            <label className="text-[12px] text-gray-300">{field.label}</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={settings[field.key]}
                min={field.min}
                max={field.max}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value) && value >= field.min && value <= field.max) {
                    handleChange({ [field.key]: value });
                  }
                }}
                className="w-[80px] bg-neutral-700 border border-white/20 rounded px-2 py-1 text-[12px] text-white text-right outline-none focus:border-[#4a9eff] transition-colors"
              />
              {field.unit && <span className="text-[10px] text-gray-500 w-5">{field.unit}</span>}
              {!field.unit && <span className="w-5" />}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={handleReset}
        className="mt-4 w-full px-3 py-1.5 text-[12px] text-white bg-white/10 border border-white/20 rounded hover:bg-white/20 transition-colors active:scale-[0.98]"
      >
        デフォルトに戻す
      </button>
    </div>
  );
}
