/**
 * アプリケーションモードを管理するカスタムフック
 */

import { useState, useCallback } from 'react';
import { AppMode } from '../constants/app';

interface UseAppModeReturn {
  /** 現在のアプリケーションモード */
  mode: AppMode;
  /** 受信モードかどうか */
  isReceiveMode: boolean;
  /** クライアントモードに切り替え */
  setClientMode: () => void;
  /** 受信モードに切り替え */
  setReceiveMode: () => void;
  /** モードをリセット */
  resetMode: () => void;
}

/**
 * アプリケーションモードを管理するカスタムフック
 * 
 * @example
 * ```tsx
 * const { mode, isReceiveMode, setReceiveMode } = useAppMode();
 * 
 * if (isReceiveMode) {
 *   // WebSocket経由でデータを受信
 * }
 * ```
 */
export function useAppMode(): UseAppModeReturn {
  const [isReceiveMode, setIsReceiveMode] = useState(false);

  // クライアントモードに切り替え
  const setClientMode = useCallback(() => {
    setIsReceiveMode(false);
  }, []);

  // 受信モードに切り替え
  const setReceiveMode = useCallback(() => {
    setIsReceiveMode(true);
  }, []);

  // モードをリセット
  const resetMode = useCallback(() => {
    setIsReceiveMode(false);
  }, []);

  return {
    mode: isReceiveMode ? AppMode.CLIENT : AppMode.CLIENT,
    isReceiveMode,
    setClientMode,
    setReceiveMode,
    resetMode,
  };
}