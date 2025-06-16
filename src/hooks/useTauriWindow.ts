/**
 * Tauriウィンドウ操作を管理するカスタムフック
 */

import { useCallback, useEffect, useState } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { invoke } from '@tauri-apps/api/core';
import { APP } from '../constants/app';

interface UseTauriWindowReturn {
  /** Tauriが利用可能か */
  isTauriAvailable: boolean;
  /** サーバーモードかどうか */
  isServerMode: boolean;
  /** ウィンドウを閉じる */
  closeWindow: () => void;
}

/**
 * Tauriウィンドウ操作を管理するカスタムフック
 * 
 * @example
 * ```tsx
 * const { isTauriAvailable, isServerMode, closeWindow } = useTauriWindow();
 * ```
 */
export function useTauriWindow(): UseTauriWindowReturn {
  const [isServerMode, setIsServerMode] = useState(false);

  // Tauriが利用可能かチェック
  const isTauriAvailable = useCallback(() => {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  }, []);

  // ウィンドウを閉じる
  const closeWindow = useCallback(() => {
    if (isTauriAvailable()) {
      const appWindow = getCurrentWebviewWindow();
      appWindow.close();
    }
  }, [isTauriAvailable]);

  // サーバーモードのチェック
  useEffect(() => {
    const checkServerMode = async () => {
      if (isTauriAvailable()) {
        try {
          const result = await invoke<boolean>('check_websocket_status');
          setIsServerMode(result);
        } catch (error) {
          if (APP.DEBUG) {
            console.error('Failed to check WebSocket status:', error);
          }
        }
      }
    };

    checkServerMode();
  }, [isTauriAvailable]);

  return {
    isTauriAvailable: isTauriAvailable(),
    isServerMode,
    closeWindow,
  };
}