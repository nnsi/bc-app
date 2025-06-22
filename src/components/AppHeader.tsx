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
}) => {
  const { localIp } = useLocalIp();
  
  return (
    <header 
      data-tauri-drag-region 
      className="border-b border-white px-[5px] pt-[5px] pb-0 text-[10px] leading-none cursor-default flex items-center"
    >
      <span className="ml-0 text-[12px] text-gray-400">
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