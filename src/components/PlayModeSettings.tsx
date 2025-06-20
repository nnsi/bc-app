/**
 * プレイモード設定コンポーネント
 */

import React, { memo, useCallback } from 'react';
import styled from 'styled-components';
import { PlayMode } from '../types/controller';
import { TEXT_STYLES } from '../constants/styles';

const SettingsContainer = styled.div`
  padding: 15px;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  margin: 5px;
  max-height: 180px;
  overflow-y: auto;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
`;

const Label = styled.label`
  color: #fff;
  font-size: 14px;
  font-weight: 500;
`;

const ModeButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const ModeButton = styled.button<{ active: boolean }>`
  padding: 6px 12px;
  background-color: ${props => props.active ? '#4a9eff' : 'rgba(255, 255, 255, 0.1)'};
  color: #fff;
  border: 1px solid ${props => props.active ? '#4a9eff' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  font-weight: ${props => props.active ? '600' : '400'};

  &:hover {
    background-color: ${props => props.active ? '#3a8eef' : 'rgba(255, 255, 255, 0.2)'};
    border-color: ${props => props.active ? '#3a8eef' : 'rgba(255, 255, 255, 0.3)'};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const GamepadAssignment = styled.div`
  margin-top: 10px;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
`;

const AssignmentRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const PlayerLabel = styled.span`
  color: #4a9eff;
  font-weight: 600;
  font-size: 12px;
  min-width: 35px;
`;

const GamepadInfo = styled.div`
  flex: 1;
  margin-left: 10px;
  padding: 6px 10px;
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  color: #ccc;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AssignButton = styled.button`
  margin-left: 8px;
  padding: 5px 10px;
  background-color: rgba(74, 158, 255, 0.2);
  color: #4a9eff;
  border: 1px solid #4a9eff;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(74, 158, 255, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface GamepadAssignmentInfo {
  index: number;
  id: string;
}

interface PlayModeSettingsProps {
  /** 現在のプレイモード */
  currentMode: PlayMode;
  /** プレイモード変更時のコールバック */
  onModeChange: (mode: PlayMode) => void;
  /** DPモードのゲームパッド割り当て */
  dpAssignments: {
    player1: GamepadAssignmentInfo | null;
    player2: GamepadAssignmentInfo | null;
  };
  /** ゲームパッド割り当て開始時のコールバック */
  onStartAssignment: (player: '1P' | '2P') => void;
  /** 割り当て中のプレイヤー */
  assigningPlayer: '1P' | '2P' | null;
  /** 利用可能なゲームパッド一覧 */
  availableGamepads: GamepadAssignmentInfo[];
}

/**
 * プレイモード設定UI
 * SP/DPモードの切り替えとDPモード時のコントローラー割り当てを管理
 */
const PlayModeSettingsComponent: React.FC<PlayModeSettingsProps> = ({
  currentMode,
  onModeChange,
  dpAssignments,
  onStartAssignment,
  assigningPlayer,
  availableGamepads,
}) => {
  const handleModeChange = useCallback((mode: PlayMode) => {
    onModeChange(mode);
  }, [onModeChange]);

  return (
    <SettingsContainer>
      <SettingRow>
        <Label>プレイモード</Label>
        <ModeButtonGroup>
          <ModeButton
            active={currentMode === 'SP'}
            onClick={() => handleModeChange('SP')}
          >
            シングルプレイ (SP)
          </ModeButton>
          <ModeButton
            active={currentMode === 'DP'}
            onClick={() => handleModeChange('DP')}
          >
            ダブルプレイ (DP)
          </ModeButton>
        </ModeButtonGroup>
      </SettingRow>

      {currentMode === 'DP' && (
        <GamepadAssignment>
          <h4 style={{ ...TEXT_STYLES.CENTER, marginBottom: '8px', color: '#fff', fontSize: '14px' }}>
            コントローラー割り当て
          </h4>
          
          <AssignmentRow>
            <PlayerLabel>1P側</PlayerLabel>
            <GamepadInfo>
              {assigningPlayer === '1P' ? (
                <span style={{ color: '#4a9eff' }}>
                  コントローラーのボタンを押してください...
                </span>
              ) : dpAssignments.player1 ? (
                `${dpAssignments.player1.id} (Index: ${dpAssignments.player1.index})`
              ) : (
                '未割り当て'
              )}
            </GamepadInfo>
            <AssignButton
              onClick={() => onStartAssignment('1P')}
              disabled={assigningPlayer !== null}
            >
              {assigningPlayer === '1P' ? '検出中...' : '割り当て'}
            </AssignButton>
          </AssignmentRow>

          <AssignmentRow>
            <PlayerLabel>2P側</PlayerLabel>
            <GamepadInfo>
              {assigningPlayer === '2P' ? (
                <span style={{ color: '#4a9eff' }}>
                  コントローラーのボタンを押してください...
                </span>
              ) : dpAssignments.player2 ? (
                `${dpAssignments.player2.id} (Index: ${dpAssignments.player2.index})`
              ) : (
                '未割り当て'
              )}
            </GamepadInfo>
            <AssignButton
              onClick={() => onStartAssignment('2P')}
              disabled={assigningPlayer !== null}
            >
              {assigningPlayer === '2P' ? '検出中...' : '割り当て'}
            </AssignButton>
          </AssignmentRow>

          {availableGamepads.length === 0 && (
            <p style={{ 
              ...TEXT_STYLES.CENTER, 
              marginTop: '15px', 
              color: '#ff6b6b',
              fontSize: '12px' 
            }}>
              接続されているゲームパッドがありません
            </p>
          )}
        </GamepadAssignment>
      )}
    </SettingsContainer>
  );
};

export const PlayModeSettings = memo(PlayModeSettingsComponent);