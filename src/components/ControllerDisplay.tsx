/**
 * コントローラー表示コンポーネント
 */

import React, { memo } from 'react';
import { IIDXController } from './IIDXController';
import { BeatStatus } from './BeatStatus';
import { ControllerStatus } from '../types/controller';
import { useAppSettings } from '../contexts/AppSettingsContext';

interface ControllerDisplayProps {
  /** コントローラーの状態 */
  status: ControllerStatus;
}

/**
 * コントローラー表示
 * IIDXコントローラーの視覚表現とビート統計を表示
 */
const ControllerDisplayComponent: React.FC<ControllerDisplayProps> = ({ status }) => {
  const { is2P, setIs2P, isTransparent } = useAppSettings();
  return (
    <>
      {!isTransparent && (
        <div style={{ position:"absolute", bottom:"0.5rem", right:"1rem",display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <label style={{ textShadow: '0 0 3px #000, 0 0 3px #000, 0 0 3px #000, 0 0 3px #000' }}>
            <input
              type="radio"
              name="playerSide"
              checked={!is2P}
              onChange={() => setIs2P(false)}
            />
            1P
          </label>
          <label style={{ textShadow: '0 0 3px #000, 0 0 3px #000, 0 0 3px #000, 0 0 3px #000' }}>
            <input
              type="radio"
              name="playerSide"
              checked={is2P}
              onChange={() => setIs2P(true)}
            />
            2P
          </label>
        </div>
      )}
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