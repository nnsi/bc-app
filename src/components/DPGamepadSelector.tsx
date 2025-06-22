/**
 * DPモード用ゲームパッド選択コンポーネント
 */

import React, { memo } from 'react';
import { TEXT_STYLES } from '../constants/styles';
import styled from 'styled-components';

const Container = styled.div`
  text-align: center;
  padding: 20px 0;
`;

const StatusMessage = styled.p`
  color: #4a9eff;
  font-size: 16px;
  margin-bottom: 10px;
`;

const AssignmentInfo = styled.div`
  margin-top: 15px;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 12px;
  color: #ccc;
`;

const PlayerStatus = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  margin: 5px 0;
`;

const PlayerLabel = styled.span`
  color: #4a9eff;
  font-weight: 600;
`;

const GamepadInfo = styled.span`
  color: #fff;
`;

interface DPGamepadSelectorProps {
  /** エラーメッセージ */
  error?: string | null;
  /** 割り当て状況 */
  assignments: {
    player1: { index: number; id: string } | null;
    player2: { index: number; id: string } | null;
  };
  /** 割り当て中かどうか */
  isAssigning: boolean;
}

/**
 * DPモード用ゲームパッド選択UI
 * 1P→2Pの順でコントローラーのボタンを押すよう促すメッセージを表示
 */
const DPGamepadSelectorComponent: React.FC<DPGamepadSelectorProps> = ({ 
  error, 
  assignments,
  isAssigning 
}) => {
  const getMessage = () => {
    if (error) return error;
    
    if (!assignments.player1) {
      return '1P側のコントローラーでボタンを押してください';
    } else if (!assignments.player2) {
      return '2P側のコントローラーでボタンを押してください';
    } else {
      return '両方のコントローラーが認識されました';
    }
  };

  return (
    <Container>
      <StatusMessage>
        {getMessage()}
      </StatusMessage>
      
      {(assignments.player1 || assignments.player2) && (
        <AssignmentInfo>
          <PlayerStatus>
            <PlayerLabel>1P側:</PlayerLabel>
            <GamepadInfo>
              {assignments.player1 
                ? `${assignments.player1.id} (Index: ${assignments.player1.index})`
                : '未接続'}
            </GamepadInfo>
          </PlayerStatus>
          <PlayerStatus>
            <PlayerLabel>2P側:</PlayerLabel>
            <GamepadInfo>
              {assignments.player2 
                ? `${assignments.player2.id} (Index: ${assignments.player2.index})`
                : '未接続'}
            </GamepadInfo>
          </PlayerStatus>
        </AssignmentInfo>
      )}
      
      {error && (
        <p style={{ ...TEXT_STYLES.CENTER, color: '#ff6b6b', fontSize: '12px', marginTop: '10px' }}>
          {error}
        </p>
      )}
    </Container>
  );
};

export const DPGamepadSelector = memo(DPGamepadSelectorComponent);