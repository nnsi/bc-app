/**
 * プレイモード設定コンポーネント
 */

import React, { memo, useCallback } from 'react';
import styled from 'styled-components';
import { PlayMode } from '../types/controller';
import { TEXT_STYLES } from '../constants/styles';

const SettingsContainer = styled.div`
  padding: 5px;
  margin: 5px;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;


const ModeButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const ModeButton = styled.button<{ active: boolean }>`
  padding: 4px 10px;
  background-color: ${props => props.active ? '#4a9eff' : 'rgba(255, 255, 255, 0.1)'};
  color: #fff;
  border: 1px solid ${props => props.active ? '#4a9eff' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px;
  font-weight: ${props => props.active ? '600' : '400'};

  &:hover {
    background-color: ${props => props.active ? '#3a8eef' : 'rgba(255, 255, 255, 0.2)'};
    border-color: ${props => props.active ? '#3a8eef' : 'rgba(255, 255, 255, 0.3)'};
  }

  &:active {
    transform: scale(0.95);
  }
`;


interface PlayModeSettingsProps {
  /** 現在のプレイモード */
  currentMode: PlayMode;
  /** プレイモード変更時のコールバック */
  onModeChange: (mode: PlayMode) => void;
}

/**
 * プレイモード設定UI
 * SP/DPモードの切り替えとDPモード時のコントローラー割り当てを管理
 */
const PlayModeSettingsComponent: React.FC<PlayModeSettingsProps> = ({
  currentMode,
  onModeChange,
}) => {
  const handleModeChange = useCallback((mode: PlayMode) => {
    onModeChange(mode);
  }, [onModeChange]);

  return (
    <SettingsContainer>
      <SettingRow>
        <ModeButtonGroup>
          <ModeButton
            active={currentMode === 'SP'}
            onClick={() => handleModeChange('SP')}
          >
            SP
          </ModeButton>
          <ModeButton
            active={currentMode === 'DP'}
            onClick={() => handleModeChange('DP')}
          >
            DP
          </ModeButton>
        </ModeButtonGroup>
      </SettingRow>
    </SettingsContainer>
  );
};

export const PlayModeSettings = memo(PlayModeSettingsComponent);