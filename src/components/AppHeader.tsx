/**
 * アプリケーションヘッダーコンポーネント
 */

import React, { memo } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import { HEADER_STYLES } from '../constants/styles';
import { APP } from '../constants/app';

interface AppHeaderProps {
  /** サーバーモードかどうか */
  isServerMode: boolean;
  /** リロードボタンクリック時のハンドラ */
  onReload: () => void;
  /** クローズボタンクリック時のハンドラ */
  onClose: () => void;
}

/**
 * アプリケーションヘッダー
 * タイトル、リロードボタン、クローズボタンを表示
 */
const AppHeaderComponent: React.FC<AppHeaderProps> = ({
  isServerMode,
  onReload,
  onClose,
}) => {
  return (
    <header data-tauri-drag-region style={HEADER_STYLES}>
      <span style={{ marginLeft: '0' }}>
        {APP.NAME}[{isServerMode ? 'Server' : 'Client'} Mode]
      </span>
      <span
        onClick={onReload}
        style={{
          marginLeft: 'auto',
          cursor: 'pointer',
        }}
      >
        <RefreshIcon />
      </span>
      <span onClick={onClose} style={{ cursor: 'pointer' }}>
        <CloseIcon />
      </span>
    </header>
  );
};

// メモ化してプロップスが変更されない限り再レンダリングを防ぐ
export const AppHeader = memo(AppHeaderComponent);