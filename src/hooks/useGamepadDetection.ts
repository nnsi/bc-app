/**
 * ゲームパッド自動検出を管理するカスタムフック
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { getGamepads as GetGamepadsType } from 'tauri-plugin-gamepad-api';
import { GAMEPAD_CONSTANTS } from '../types/gamepad';
import { APP } from '../constants/app';

interface UseGamepadDetectionProps {
  /** 自動検出を有効にするか */
  enabled?: boolean;
  /** 検出間隔（ミリ秒） */
  interval?: number;
  /** ゲームパッドが検出された時のコールバック */
  onDetected?: (gamepadIndex: number) => void;
}

interface UseGamepadDetectionReturn {
  /** 選択されたゲームパッドのインデックス */
  selectedGamepadIndex: number;
  /** ゲームパッド取得関数 */
  getGamepads: typeof GetGamepadsType | null;
  /** 自動検出中かどうか */
  isDetecting: boolean;
  /** エラー情報 */
  error: string | null;
  /** 自動検出を開始 */
  startDetection: () => void;
  /** 自動検出を停止 */
  stopDetection: () => void;
  /** ゲームパッドをリセット */
  reset: () => void;
}

/**
 * ゲームパッド自動検出を管理するカスタムフック
 * 
 * @example
 * ```tsx
 * const { selectedGamepadIndex, isDetecting, startDetection } = useGamepadDetection({
 *   enabled: true,
 *   onDetected: (index) => console.log(`Gamepad ${index} detected`),
 * });
 * ```
 */
export function useGamepadDetection({
  enabled = true,
  interval = GAMEPAD_CONSTANTS.AUTO_DETECTION_INTERVAL,
  onDetected,
}: UseGamepadDetectionProps = {}): UseGamepadDetectionReturn {
  const [selectedGamepadIndex, setSelectedGamepadIndex] = useState(-1);
  const [getGamepads, setGetGamepads] = useState<typeof GetGamepadsType | null>(null);
  const [isDetecting, setIsDetecting] = useState(enabled);
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

  // ゲームパッド入力を検出
  const detectGamepadInput = useCallback(() => {
    if (!isDetecting || selectedGamepadIndex !== -1 || !getGamepads) return;

    try {
      const currentGamepads = [...getGamepads()].filter(Boolean);

      if (currentGamepads.length === 0) {
        setError('ゲームパッドが接続されていません');
        return;
      }

      setError(null);

      for (const gamepad of currentGamepads) {
        // buttons配列が存在することを確認
        if (!gamepad?.buttons || !Array.isArray(gamepad.buttons)) {
          if (APP.DEBUG) {
            console.warn(`Gamepad ${gamepad?.index} has invalid buttons array`);
          }
          continue;
        }

        // 各ボタンの状態をチェック
        const pressedButton = gamepad.buttons.findIndex((button: any) => {
          return button && typeof button.pressed === 'boolean' && button.pressed;
        });

        if (pressedButton !== -1) {
          if (APP.DEBUG) {
            console.log(`Button ${pressedButton} pressed on gamepad ${gamepad.index}`);
          }
          setSelectedGamepadIndex(gamepad.index);
          setIsDetecting(false);
          setError(null);
          onDetected?.(gamepad.index);
          break;
        }
      }
    } catch (err) {
      const errorMessage = 'ゲームパッド検出中にエラーが発生しました';
      if (APP.DEBUG) {
        console.error(errorMessage, err);
      }
      setError(errorMessage);
    }
  }, [isDetecting, selectedGamepadIndex, getGamepads, onDetected]);

  // 自動検出の開始
  const startDetection = useCallback(() => {
    setIsDetecting(true);
    setSelectedGamepadIndex(-1);
    if (APP.DEBUG) {
      console.log('Starting gamepad auto-detection');
    }
  }, []);

  // 自動検出の停止
  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    if (APP.DEBUG) {
      console.log('Stopping gamepad auto-detection');
    }
  }, []);

  // リセット
  const reset = useCallback(() => {
    setSelectedGamepadIndex(-1);
    setIsDetecting(enabled);
  }, [enabled]);

  // 自動検出のインターバル設定
  useEffect(() => {
    if (!getGamepads || !isDetecting) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (isDetecting && selectedGamepadIndex === -1) {
        detectGamepadInput();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [getGamepads, isDetecting, selectedGamepadIndex, interval, detectGamepadInput]);

  return {
    selectedGamepadIndex,
    getGamepads,
    isDetecting,
    error,
    startDetection,
    stopDetection,
    reset,
  };
}