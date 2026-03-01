/**
 * コントローラー設定パネル
 */

import React, { memo } from 'react';
import type { ControllerSettings } from '../types/settings';

interface SettingsFieldConfig {
  key: keyof ControllerSettings;
  label: string;
  unit: string;
  min: number;
  max: number;
}

const SETTINGS_FIELDS: SettingsFieldConfig[] = [
  { key: 'fixedScratchStateTime', label: 'スクラッチ保持時間', unit: 'ms', min: 50, max: 1000 },
  { key: 'loopMilliSeconds', label: 'ポーリング間隔', unit: 'ms', min: 1, max: 100 },
  { key: 'longNoteThreshold', label: 'ロングノート閾値', unit: 'ms', min: 50, max: 1000 },
  { key: 'maxReleaseTimes', label: 'リリース記録数', unit: '', min: 100, max: 10000 },
  { key: 'maxKeyReleaseTimes', label: '鍵盤リリース記録数', unit: '', min: 50, max: 5000 },
  { key: 'maxPressedTimes', label: '打鍵記録数', unit: '', min: 100, max: 5000 },
  { key: 'maxScratchTimes', label: 'スクラッチ記録数', unit: '', min: 100, max: 5000 },
];

interface SettingsPanelProps {
  settings: ControllerSettings;
  onChange: (update: Partial<ControllerSettings>) => void;
  onReset: () => void;
  onClose: () => void;
}

const SettingsPanelComponent: React.FC<SettingsPanelProps> = ({
  settings,
  onChange,
  onReset,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 z-50 bg-neutral-800/95 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/20">
        <span className="text-[12px] text-gray-300 font-semibold">
          コントローラー設定
        </span>
        <span
          onClick={onClose}
          className="cursor-pointer hover:opacity-70 transition-opacity text-white"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
          </svg>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {SETTINGS_FIELDS.map((field) => (
          <div key={field.key} className="flex items-center justify-between py-[3px]">
            <label className="text-[11px] text-gray-300 shrink-0">
              {field.label}
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={settings[field.key]}
                min={field.min}
                max={field.max}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value) && value >= field.min && value <= field.max) {
                    onChange({ [field.key]: value });
                  }
                }}
                className="w-[70px] bg-neutral-700 border border-white/20 rounded px-2 py-[2px] text-[11px] text-white text-right outline-none focus:border-[#4a9eff] transition-colors"
              />
              {field.unit && (
                <span className="text-[10px] text-gray-500 w-[18px]">{field.unit}</span>
              )}
              {!field.unit && (
                <span className="w-[18px]" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 py-2 border-t border-white/20">
        <button
          onClick={onReset}
          className="w-full px-3 py-[4px] text-[11px] text-white bg-white/10 border border-white/20 rounded hover:bg-white/20 transition-colors active:scale-[0.98]"
        >
          デフォルトに戻す
        </button>
      </div>
    </div>
  );
};

export const SettingsPanel = memo(SettingsPanelComponent);
