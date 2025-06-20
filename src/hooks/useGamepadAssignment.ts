/**
 * DPモード用ゲームパッド割り当てフック
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { getGamepads as GetGamepadsType } from 'tauri-plugin-gamepad-api';
import { GAMEPAD_CONSTANTS } from '../types/gamepad';
import { APP } from '../constants/app';

interface UseGamepadAssignmentReturn {
  /** 割り当て中のプレイヤー */
  assigningPlayer: '1P' | '2P' | null;
  /** 1P側の割り当てを開始 */
  startAssign1P: () => void;
  /** 2P側の割り当てを開始 */
  startAssign2P: () => void;
  /** 割り当てをキャンセル */
  cancelAssignment: () => void;
  /** エラー情報 */
  error: string | null;
}

interface UseGamepadAssignmentProps {
  /** 1P側が割り当てられた時のコールバック */
  onAssign1P: (gamepadIndex: number) => void;
  /** 2P側が割り当てられた時のコールバック */
  onAssign2P: (gamepadIndex: number) => void;
}

/**
 * DPモード用のゲームパッド割り当て管理フック
 */
export function useGamepadAssignment({
  onAssign1P,
  onAssign2P,
}: UseGamepadAssignmentProps): UseGamepadAssignmentReturn {
  const [assigningPlayer, setAssigningPlayer] = useState<'1P' | '2P' | null>(null);
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

  // ゲームパッド入力を検出
  const detectGamepadInput = useCallback(() => {
    if (!assigningPlayer || !getGamepads) {
      return;
    }

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
          continue;
        }

        // 各ボタンの状態をチェック
        const pressedButton = gamepad.buttons.findIndex((button: any) => {
          return button && typeof button.pressed === 'boolean' && button.pressed;
        });

        if (pressedButton !== -1) {
          console.log(`[GamepadAssignment] Button ${pressedButton} pressed on gamepad ${gamepad.index} for ${assigningPlayer}`);
          
          // 割り当て実行
          if (assigningPlayer === '1P') {
            console.log('[GamepadAssignment] Assigning to 1P:', gamepad.index);
            onAssign1P(gamepad.index);
          } else if (assigningPlayer === '2P') {
            console.log('[GamepadAssignment] Assigning to 2P:', gamepad.index);
            onAssign2P(gamepad.index);
          }
          
          setAssigningPlayer(null);
          setError(null);
          break;
        }
      }
    } catch (err) {
      const errorMessage = 'ゲームパッド検出中にエラーが発生しました';
      setError(errorMessage);
    }
  }, [assigningPlayer, getGamepads, onAssign1P, onAssign2P]);

  // 1P側の割り当てを開始
  const startAssign1P = useCallback(() => {
    setAssigningPlayer('1P');
    setError(null);
  }, []);

  // 2P側の割り当てを開始
  const startAssign2P = useCallback(() => {
    setAssigningPlayer('2P');
    setError(null);
    console.log('[GamepadAssignment] Starting 2P gamepad assignment');
  }, []);

  // 割り当てをキャンセル
  const cancelAssignment = useCallback(() => {
    setAssigningPlayer(null);
    setError(null);
  }, []);

  // 自動検出のインターバル設定
  useEffect(() => {
    if (!getGamepads || !assigningPlayer) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 即座に1回実行
    detectGamepadInput();
    
    intervalRef.current = setInterval(() => {
      detectGamepadInput();
    }, GAMEPAD_CONSTANTS.AUTO_DETECTION_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [getGamepads, assigningPlayer]); // detectGamepadInputを依存配列から削除

  return {
    assigningPlayer,
    startAssign1P,
    startAssign2P,
    cancelAssignment,
    error,
  };
}