/**
 * コントローラー表示コンポーネント
 */

import React, { memo } from 'react';
import { IIDXController } from './IIDXController';
import { BeatStatus } from './BeatStatus';
import { ControllerStatus } from '../types/controller';

interface ControllerDisplayProps {
  /** コントローラーの状態 */
  status: ControllerStatus;
  /** 2Pモードかどうか */
  is2P: boolean;
  /** プレイヤーサイド変更ハンドラ */
  onPlayerSideChange: (is2P: boolean) => void;
}

/**
 * コントローラー表示
 * IIDXコントローラーの視覚表現とビート統計を表示
 */
const ControllerDisplayComponent: React.FC<ControllerDisplayProps> = ({ status, is2P, onPlayerSideChange }) => {
  return (
    <>
      <div style={{ position:"absolute", bottom:"0.5rem", "right":"1rem",display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <label>
          <input
            type="radio"
            name="playerSide"
            checked={!is2P}
            onChange={() => onPlayerSideChange(false)}
          />
          1P
        </label>
        <label>
          <input
            type="radio"
            name="playerSide"
            checked={is2P}
            onChange={() => onPlayerSideChange(true)}
          />
          2P
        </label>
      </div>
      <IIDXController status={status} is2P={is2P} />
      <BeatStatus status={status} />
    </>
  );
};

// statusオブジェクトの参照が頻繁に変わるため、深い比較が必要
export const ControllerDisplay = memo(ControllerDisplayComponent, () => {
  // ここでは単純に常に再レンダリングを許可
  // より高度な最適化が必要な場合は、compareControllerStatus関数を使用
  return false;
});