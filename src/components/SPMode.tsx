/**
 * SPモード（シングルプレイ）の自己完結コンポーネント
 * ゲームパッド検出、コントローラーポーリング、WebSocket送信、UI表示を一括管理
 */

import React from 'react';
import { useGamepadDetection } from '../hooks/useGamepadDetection';
import { useController } from '../hooks/useController';
import { useWebSocketData } from '../hooks/useWebSocketData';
import { GamepadSelector } from './GamepadSelector';
import { ConnectionSettings } from './ConnectionSettings';
import { ControllerDisplay } from './ControllerDisplay';
import type { ControllerStatus } from '../types/controller';
import type { ControllerSettings } from '../types/settings';

interface SPModeProps {
  ws: WebSocket | null;
  sendSP: (data: ControllerStatus) => void;
  connectWebSocket: () => void;
  ipAddress: string;
  onIpAddressChange: (value: string) => void;
  onReceiveModeClick: () => void;
  controllerSettings: ControllerSettings;
}

const noop = () => {};

export const SPMode: React.FC<SPModeProps> = ({
  ws,
  sendSP,
  connectWebSocket,
  ipAddress,
  onIpAddressChange,
  onReceiveModeClick,
  controllerSettings,
}) => {
  // ゲームパッド自動検出
  const { selectedGamepadIndex, error: gamepadError } = useGamepadDetection({
    enabled: true,
    onDetected: () => {
      if (!ws) connectWebSocket();
    },
  });

  // コントローラー状態のポーリング
  const { status } = useController(selectedGamepadIndex, controllerSettings);

  // コントローラーデータをWebSocket送信（変更時のみ）
  useWebSocketData({
    ws,
    isReceiveMode: false,
    playMode: 'SP',
    spControllerStatus: status ?? null,
    dpControllerStatus: null,
    sendSP,
    sendDP: noop,
  });

  // ゲームパッド未検出: セットアップ画面
  if (!status) {
    return (
      <div className="flex flex-col gap-4">
        <GamepadSelector error={gamepadError} />
        <ConnectionSettings
          ipAddress={ipAddress}
          onIpAddressChange={onIpAddressChange}
          onReceiveModeClick={onReceiveModeClick}
        />
      </div>
    );
  }

  // ゲームパッド検出済: コントローラー表示
  return <ControllerDisplay status={status} />;
};
