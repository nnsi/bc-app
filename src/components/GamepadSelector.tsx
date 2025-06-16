/**
 * ゲームパッド選択コンポーネント
 */

import React, { memo } from 'react';
import { TEXT_STYLES } from '../constants/styles';

interface GamepadSelectorProps {
  /** エラーメッセージ */
  error?: string | null;
}

/**
 * ゲームパッド選択UI
 * コントローラーのボタンを押すよう促すメッセージを表示
 */
const GamepadSelectorComponent: React.FC<GamepadSelectorProps> = ({ error }) => {
  return (
    <>
      <p style={TEXT_STYLES.CENTER}>
        {error || 'コントローラーのボタンを押してください'}
      </p>
      {error && (
        <p style={{ ...TEXT_STYLES.CENTER, color: '#ff6b6b', fontSize: '12px' }}>
          {error}
        </p>
      )}
    </>
  );
};

export const GamepadSelector = memo(GamepadSelectorComponent);