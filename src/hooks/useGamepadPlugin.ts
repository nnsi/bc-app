/**
 * Tauriゲームパッドプラグインのロード用共通フック
 */

import { useState, useEffect } from 'react';
import type { getGamepads as GetGamepadsType } from 'tauri-plugin-gamepad-api';
import { APP } from '../constants/app';

interface UseGamepadPluginReturn {
  /** getGamepads関数（ロード完了前はnull） */
  getGamepads: typeof GetGamepadsType | null;
  /** プラグインロードエラー */
  error: string | null;
}

/**
 * Tauriゲームパッドプラグインを動的にロードする共通フック
 */
export function useGamepadPlugin(): UseGamepadPluginReturn {
  const [getGamepads, setGetGamepads] = useState<typeof GetGamepadsType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
        setError('Tauriが利用できません');
        return;
      }
      try {
        const mod = await import('tauri-plugin-gamepad-api');
        setGetGamepads(() => mod.getGamepads);
        setError(null);
      } catch (err) {
        const msg = 'ゲームパッドプラグインの読み込みに失敗しました';
        if (APP.DEBUG) {
          console.warn(msg, err);
        }
        setError(msg);
      }
    };
    load();
  }, []);

  return { getGamepads, error };
}
