/**
 * ウィンドウリサイズ管理フック
 */

import { useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { PlayMode } from '../types/controller';
import { UI } from '../constants/app';

interface UseWindowResizeProps {
  /** 現在のプレイモード */
  playMode: PlayMode;
  /** 自動リサイズを有効にするか */
  autoResize?: boolean;
}

/**
 * プレイモードに応じてウィンドウサイズを自動調整するフック
 */
export const useWindowResize = ({ playMode, autoResize = true }: UseWindowResizeProps) => {
  // ウィンドウサイズを変更する関数
  const resizeWindow = useCallback(async (mode: PlayMode) => {
    try {
      const width = mode === 'DP' ? UI.WINDOW_DP.WIDTH : UI.WINDOW.WIDTH;
      const height = mode === 'DP' ? UI.WINDOW_DP.HEIGHT : UI.WINDOW.HEIGHT;
      
      await invoke('resize_window', { width, height });
    } catch (error) {
      console.error('Failed to resize window:', error);
    }
  }, []);

  // プレイモードが変更されたときに自動でリサイズ
  useEffect(() => {
    if (autoResize) {
      resizeWindow(playMode);
    }
  }, [playMode, autoResize, resizeWindow]);

  return { resizeWindow };
};