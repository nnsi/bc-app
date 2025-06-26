/**
 * ゲームパッド選択コンポーネント
 */

import React, { memo } from 'react';

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
      <p className="text-center">
        コントローラーのボタンを長押ししてください
      </p>
      {error && (
        <p className="text-center mb-[10px] text-[#ff6b6b] text-[12px]">
          {error}
        </p>
      )}
    </>
  );
};

export const GamepadSelector = memo(GamepadSelectorComponent);