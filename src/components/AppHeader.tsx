/**
 * アプリケーションヘッダーコンポーネント
 */

import React, { memo } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import { HEADER_STYLES } from '../constants/styles';
import { APP } from '../constants/app';
import { useLocalIp } from '../hooks/useLocalIp';
import { PlayMode } from '../types/controller';
import styled from 'styled-components';

const ModeButtonGroup = styled.div`
  display: flex;
  gap: 2px;
  margin-right: 10px;
`;

const ModeButton = styled.button<{ active: boolean }>`
  padding: 2px 8px;
  background-color: ${props => props.active ? '#4a9eff' : 'rgba(255, 255, 255, 0.1)'};
  color: #fff;
  border: 1px solid ${props => props.active ? '#4a9eff' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 10px;
  font-weight: ${props => props.active ? '600' : '400'};
  line-height: 1.2;

  &:hover {
    background-color: ${props => props.active ? '#3a8eef' : 'rgba(255, 255, 255, 0.2)'};
    border-color: ${props => props.active ? '#3a8eef' : 'rgba(255, 255, 255, 0.3)'};
  }

  &:active {
    transform: scale(0.95);
  }
`;

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
    <header data-tauri-drag-region style={HEADER_STYLES}>
      <span style={{ marginLeft: '0', fontSize: '12px', color: 'gray' }}>
        [{isServerMode ? 'Server' : 'Client'}] 
        {isServerMode && localIp && (
          <span style={{ marginLeft: '5px', opacity: 0.8 }}>
            {localIp}
          </span>
        )}
      </span>
      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
        <ModeButtonGroup>
          <ModeButton
            active={currentMode === 'SP'}
            onClick={() => onModeChange('SP')}
          >
            SP
          </ModeButton>
          <ModeButton
            active={currentMode === 'DP'}
            onClick={() => onModeChange('DP')}
          >
            DP
          </ModeButton>
        </ModeButtonGroup>
        <span
          onClick={onReload}
          style={{
            cursor: 'pointer',
            marginRight: '10px',
          }}
        >
          <RefreshIcon />
        </span>
        <span onClick={onClose} style={{ cursor: 'pointer' }}>
          <CloseIcon />
        </span>
      </span>
    </header>
  );
};

// メモ化してプロップスが変更されない限り再レンダリングを防ぐ
export const AppHeader = memo(AppHeaderComponent);