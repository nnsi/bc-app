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
}

/**
 * コントローラー表示
 * IIDXコントローラーの視覚表現とビート統計を表示
 */
const ControllerDisplayComponent: React.FC<ControllerDisplayProps> = ({ status }) => {
  return (
    <>
      <IIDXController status={status} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <BeatStatus status={status} />
      </div>
    </>
  );
};

// statusオブジェクトの参照が頻繁に変わるため、深い比較が必要
export const ControllerDisplay = memo(ControllerDisplayComponent, (prevProps, nextProps) => {
  // ここでは単純に常に再レンダリングを許可
  // より高度な最適化が必要な場合は、compareControllerStatus関数を使用
  return false;
});