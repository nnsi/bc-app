/**
 * アプリケーションヘッダーコンポーネント
 */

import React, { memo } from 'react';
import { useLocalIp } from '../hooks/useLocalIp';
import { PlayMode } from '../types/controller';

interface AppHeaderProps {
  /** サーバーモードかどうか */
  isServerMode: boolean;
  /** リロードボタンクリック時のハンドラ */
  onReload: () => void;
  /** クローズボタンクリック時のハンドラ */
  onClose: () => void;
  /** 現在のプレイモード */
  currentMode: PlayMode;
  /** プレイモード変更時のコールバック */
  onModeChange: (mode: PlayMode) => void;
  /** 透過状態かどうか */
  isTransparent: boolean;
  /** 透過状態変更時のコールバック */
  onTransparencyChange: (isTransparent: boolean) => void;
  /** 設定ボタンクリック時のコールバック */
  onSettingsClick: () => void;
}

/**
 * アプリケーションヘッダー
 * タイトル、リロードボタン、クローズボタンを表示
 */
const AppHeaderComponent: React.FC<AppHeaderProps> = ({
  isServerMode,
  onReload,
  onClose,
  currentMode,
  onModeChange,
  isTransparent,
  onTransparencyChange,
  onSettingsClick,
}) => {
  const { localIp } = useLocalIp();
  
  return (
    <header 
      data-tauri-drag-region 
      className="border-b border-white px-[5px] pt-[5px] pb-0 text-[10px] leading-none cursor-default flex items-center"
    >
      <span className="ml-0 text-[12px] text-gray-400 pointer-events-none select-none">
        [{isServerMode ? 'Server' : 'Client'}] 
        {isServerMode && localIp && (
          <span className="ml-[5px] opacity-80">
            {localIp}
          </span>
        )}
      </span>
      <span className="ml-auto flex items-center">
        <div className="flex gap-[2px] mr-[10px]">
          <button
            className={`
              px-2 py-[2px] text-white border rounded-[3px] text-[10px] leading-[1.2] transition-all duration-200
              active:scale-95
              ${currentMode === 'SP' 
                ? 'bg-[#4a9eff] border-[#4a9eff] font-semibold hover:bg-[#3a8eef] hover:border-[#3a8eef]' 
                : 'bg-white/10 border-white/20 font-normal hover:bg-white/20 hover:border-white/30'
              }
            `}
            onClick={() => onModeChange('SP')}
          >
            SP
          </button>
          <button
            className={`
              px-2 py-[2px] text-white border rounded-[3px] text-[10px] leading-[1.2] transition-all duration-200
              active:scale-95
              ${currentMode === 'DP' 
                ? 'bg-[#4a9eff] border-[#4a9eff] font-semibold hover:bg-[#3a8eef] hover:border-[#3a8eef]' 
                : 'bg-white/10 border-white/20 font-normal hover:bg-white/20 hover:border-white/30'
              }
            `}
            onClick={() => onModeChange('DP')}
          >
            DP
          </button>
        </div>
        <span
          onClick={onSettingsClick}
          className="cursor-pointer mr-[10px] hover:opacity-70 transition-opacity"
          title="コントローラー設定"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor"/>
          </svg>
        </span>
        <span
          onClick={() => onTransparencyChange(!isTransparent)}
          className="cursor-pointer mr-[10px] hover:opacity-70 transition-opacity"
          title={isTransparent ? "背景を不透明にする" : "背景を透明にする"}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {isTransparent ? (
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
            ) : (
              <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor"/>
            )}
          </svg>
        </span>
        <span
          onClick={onReload}
          className="cursor-pointer mr-[10px] hover:opacity-70 transition-opacity"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
          </svg>
        </span>
        <span onClick={onClose} className="cursor-pointer hover:opacity-70 transition-opacity">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
          </svg>
        </span>
      </span>
    </header>
  );
};

// メモ化してプロップスが変更されない限り再レンダリングを防ぐ
export const AppHeader = memo(AppHeaderComponent);