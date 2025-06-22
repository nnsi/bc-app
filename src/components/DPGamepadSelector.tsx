/**
 * DPモード用ゲームパッド選択コンポーネント
 */

import React, { memo } from 'react';

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
  assignments
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
    <div className="text-center py-5">
      <p className="text-[#4a9eff] text-[16px] mb-[10px]">
        {getMessage()}
      </p>
      
      {(assignments.player1 || assignments.player2) && (
        <div className="mt-[15px] p-[10px] bg-white/5 rounded-md text-[12px] text-[#ccc]">
          <div className="flex justify-between items-center px-[10px] py-[5px] my-[5px]">
            <span className="text-[#4a9eff] font-semibold">1P側:</span>
            <span className="text-white">
              {assignments.player1 
                ? `${assignments.player1.id} (Index: ${assignments.player1.index})`
                : '未接続'}
            </span>
          </div>
          <div className="flex justify-between items-center px-[10px] py-[5px] my-[5px]">
            <span className="text-[#4a9eff] font-semibold">2P側:</span>
            <span className="text-white">
              {assignments.player2 
                ? `${assignments.player2.id} (Index: ${assignments.player2.index})`
                : '未接続'}
            </span>
          </div>
        </div>
      )}
      
      {error && (
        <p className="text-center text-[#ff6b6b] text-[12px] mt-[10px]">
          {error}
        </p>
      )}
    </div>
  );
};

export const DPGamepadSelector = memo(DPGamepadSelectorComponent);