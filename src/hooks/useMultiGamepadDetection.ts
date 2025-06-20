/**
 * 複数ゲームパッド検出・管理用カスタムフック
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { getGamepads as GetGamepadsType } from 'tauri-plugin-gamepad-api';
import { GAMEPAD_CONSTANTS, IGamepad } from '../types/gamepad';
import { APP } from '../constants/app';

interface GamepadInfo {
  /** ゲームパッドのインデックス */
  index: number;
  /** ゲームパッドのID/名前 */
  id: string;
  /** 接続状態 */
  connected: boolean;
}

interface UseMultiGamepadDetectionProps {
  /** 自動検出を有効にするか */
  enabled?: boolean;
  /** 検出間隔（ミリ秒） */
  interval?: number;
  /** 最大検出数 */
  maxGamepads?: number;
}

interface UseMultiGamepadDetectionReturn {
  /** 接続されている全てのゲームパッド情報 */
  gamepads: GamepadInfo[];
  /** ゲームパッド取得関数 */
  getGamepads: typeof GetGamepadsType | null;
  /** エラー情報 */
  error: string | null;
  /** 特定のゲームパッドが選択可能か */
  isGamepadAvailable: (index: number) => boolean;
  /** 接続されているゲームパッドの数 */
  connectedCount: number;
}

/**
 * 複数ゲームパッドの検出・管理を行うカスタムフック
 * 
 * @example
 * ```tsx
 * const { gamepads, isGamepadAvailable } = useMultiGamepadDetection({
 *   enabled: true,
 *   maxGamepads: 2,
 * });
 * ```
 */
export function useMultiGamepadDetection({
  enabled = true,
  interval = GAMEPAD_CONSTANTS.AUTO_DETECTION_INTERVAL,
  maxGamepads = 2,
}: UseMultiGamepadDetectionProps = {}): UseMultiGamepadDetectionReturn {
  const [gamepads, setGamepads] = useState<GamepadInfo[]>([]);
  const [getGamepads, setGetGamepads] = useState<typeof GetGamepadsType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tauriが利用可能かチェック
  const isTauriAvailable = useCallback(() => {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  }, []);

  // ゲームパッドプラグインを動的にロード
  useEffect(() => {
    const loadGamepadPlugin = async () => {
      if (isTauriAvailable()) {
        try {
          const gamepadModule = await import('tauri-plugin-gamepad-api');
          setGetGamepads(() => gamepadModule.getGamepads);
          setError(null);
        } catch (err) {
          const errorMessage = 'ゲームパッドプラグインの読み込みに失敗しました';
          if (APP.DEBUG) {
            console.warn(errorMessage, err);
          }
          setError(errorMessage);
        }
      } else {
        setError('Tauriが利用できません');
      }
    };

    loadGamepadPlugin();
  }, [isTauriAvailable]);

  // ゲームパッド一覧を更新
  const updateGamepads = useCallback(() => {
    if (!getGamepads) return;

    try {
      const currentGamepads = [...getGamepads()].filter(Boolean) as IGamepad[];
      
      const gamepadInfos: GamepadInfo[] = currentGamepads
        .slice(0, maxGamepads)
        .map(gamepad => ({
          index: gamepad.index,
          id: gamepad.id,
          connected: gamepad.connected,
        }));

      setGamepads(gamepadInfos);
      setError(null);
    } catch (err) {
      const errorMessage = 'ゲームパッド情報の取得中にエラーが発生しました';
      if (APP.DEBUG) {
        console.error(errorMessage, err);
      }
      setError(errorMessage);
    }
  }, [getGamepads, maxGamepads]);

  // 特定のゲームパッドが利用可能か確認
  const isGamepadAvailable = useCallback((index: number): boolean => {
    return gamepads.some(gp => gp.index === index && gp.connected);
  }, [gamepads]);

  // 接続されているゲームパッドの数を取得
  const connectedCount = gamepads.filter(gp => gp.connected).length;

  // 定期的にゲームパッド一覧を更新
  useEffect(() => {
    if (!getGamepads || !enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 初回実行
    updateGamepads();

    // 定期更新
    intervalRef.current = setInterval(updateGamepads, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [getGamepads, enabled, interval, updateGamepads]);

  return {
    gamepads,
    getGamepads,
    error,
    isGamepadAvailable,
    connectedCount,
  };
}