/**
 * DPモード用ゲームパッド割り当てフック
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { GAMEPAD_CONSTANTS } from '../types/gamepad';
import { useGamepadPlugin } from './useGamepadPlugin';

interface UseGamepadAssignmentReturn {
  /** エラー情報 */
  error: string | null;
  /** 自動割り当てモードを開始 */
  startAutoAssignment: () => void;
  /** 自動割り当てモード中かどうか */
  isAutoAssigning: boolean;
  /** 割り当てをキャンセル */
  cancelAssignment: () => void;
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
  const [localError, setLocalError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const autoAssignedGamepadsRef = useRef<Set<number>>(new Set());

  // 共通プラグインロード
  const { getGamepads, error: pluginError } = useGamepadPlugin();

  // エラーはプラグインエラーとローカルエラーをマージ
  const error = localError ?? pluginError;

  // ゲームパッド入力を検出
  const detectGamepadInput = useCallback(() => {
    if (!isAutoAssigning || !getGamepads) {
      return;
    }

    try {
      const currentGamepads = [...getGamepads()].filter(Boolean);

      if (currentGamepads.length === 0) {
        setLocalError('ゲームパッドが接続されていません');
        return;
      }

      setLocalError(null);

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
          console.log(`[GamepadAssignment] Button ${pressedButton} pressed on gamepad ${gamepad.index}`);

          // まだ割り当てられていないゲームパッドの場合のみ処理
          if (!autoAssignedGamepadsRef.current.has(gamepad.index)) {
            if (autoAssignedGamepadsRef.current.size === 0) {
              // 最初のゲームパッドは1Pに割り当て
              console.log('[GamepadAssignment] Auto-assigning first gamepad to 1P:', gamepad.index);
              console.log('[GamepadAssignment] Current assigned:', Array.from(autoAssignedGamepadsRef.current));
              onAssign1P(gamepad.index);
              autoAssignedGamepadsRef.current.add(gamepad.index);
            } else if (autoAssignedGamepadsRef.current.size === 1) {
              // 2番目のゲームパッドは2Pに割り当て
              console.log('[GamepadAssignment] Auto-assigning second gamepad to 2P:', gamepad.index);
              console.log('[GamepadAssignment] Current assigned:', Array.from(autoAssignedGamepadsRef.current));
              onAssign2P(gamepad.index);
              autoAssignedGamepadsRef.current.add(gamepad.index);
              // 両方割り当て完了したら自動割り当てモードを終了
              setIsAutoAssigning(false);
              setLocalError(null);
            }
          }
          break;
        }
      }
    } catch (err) {
      const errorMessage = 'ゲームパッド検出中にエラーが発生しました';
      setLocalError(errorMessage);
    }
  }, [getGamepads, onAssign1P, onAssign2P, isAutoAssigning]);

  // 割り当てをキャンセル
  const cancelAssignment = useCallback(() => {
    setLocalError(null);
    setIsAutoAssigning(false);
    autoAssignedGamepadsRef.current = new Set();
  }, []);

  // 自動割り当てモードを開始
  const startAutoAssignment = useCallback(() => {
    setIsAutoAssigning(true);
    autoAssignedGamepadsRef.current = new Set();
    setLocalError(null);
    console.log('[GamepadAssignment] Starting auto assignment mode');
  }, []);

  // 自動検出のインターバル設定
  useEffect(() => {
    if (!getGamepads || !isAutoAssigning) {
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
  }, [getGamepads, isAutoAssigning]); // detectGamepadInputを依存配列から削除

  return {
    error,
    startAutoAssignment,
    isAutoAssigning,
    cancelAssignment,
  };
}
