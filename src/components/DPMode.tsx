/**
 * DPモード（ダブルプレイ）の自己完結コンポーネント
 * 2台のゲームパッド割り当て、コントローラーポーリング×2、WebSocket送信、UI表示を一括管理
 */

import React, { useEffect, useRef } from 'react';
import { useGamepadAssignment } from '../hooks/useGamepadAssignment';
import { useController } from '../hooks/useController';
import { useGamepadInfo } from '../hooks/useGamepadInfo';
import { useWebSocketData } from '../hooks/useWebSocketData';
import { DPGamepadSelector } from './DPGamepadSelector';
import { ConnectionSettings } from './ConnectionSettings';
import { IIDXControllerDP } from './IIDXControllerDP';
import { BeatStatusDP } from './BeatStatusDP';
import {
  shouldStartAutoAssignment,
  shouldConnectWebSocketForDP,
  buildDPAssignments,
} from '../utils/appBusinessLogic';
import type { DPControllerStatus } from '../types/controller';

interface DPModeProps {
  ws: WebSocket | null;
  sendDP: (data: DPControllerStatus) => void;
  connectWebSocket: () => void;
  dp1PGamepadIndex: number | null;
  dp2PGamepadIndex: number | null;
  onGamepadMapping: (p1: number | null, p2: number | null) => void;
  ipAddress: string;
  onIpAddressChange: (value: string) => void;
  onReceiveModeClick: () => void;
}

const noop = () => {};

export const DPMode: React.FC<DPModeProps> = ({
  ws,
  sendDP,
  connectWebSocket,
  dp1PGamepadIndex,
  dp2PGamepadIndex,
  onGamepadMapping,
  ipAddress,
  onIpAddressChange,
  onReceiveModeClick,
}) => {
  // DP割り当てのref追跡（stale closure対策、useDPAssignmentRefを吸収）
  const dpRef = useRef<{ player1: number | null; player2: number | null }>({
    player1: dp1PGamepadIndex,
    player2: dp2PGamepadIndex,
  });

  useEffect(() => {
    dpRef.current = { player1: dp1PGamepadIndex, player2: dp2PGamepadIndex };
  }, [dp1PGamepadIndex, dp2PGamepadIndex]);

  // ゲームパッド情報（割り当て画面の表示用）
  const gamepads = useGamepadInfo();

  // ゲームパッド順次割り当て
  const {
    error: assignmentError,
    startAutoAssignment,
    isAutoAssigning,
  } = useGamepadAssignment({
    onAssign1P: (index) => {
      dpRef.current.player1 = index;
      onGamepadMapping(index, dpRef.current.player2);
    },
    onAssign2P: (index) => {
      dpRef.current.player2 = index;
      onGamepadMapping(dpRef.current.player1, index);
    },
  });

  // 未割り当ての場合、自動割り当てを開始
  useEffect(() => {
    if (shouldStartAutoAssignment('DP', false, isAutoAssigning, dp1PGamepadIndex, dp2PGamepadIndex)) {
      startAutoAssignment();
    }
  }, [dp1PGamepadIndex, dp2PGamepadIndex, startAutoAssignment, isAutoAssigning]);

  // 両方のゲームパッドが割り当てられたらWebSocket接続
  useEffect(() => {
    if (shouldConnectWebSocketForDP('DP', false, dp1PGamepadIndex, dp2PGamepadIndex, !!ws)) {
      connectWebSocket();
    }
  }, [dp1PGamepadIndex, dp2PGamepadIndex, ws, connectWebSocket]);

  // 1P / 2P コントローラー状態のポーリング
  const { status: p1Status } = useController(dp1PGamepadIndex ?? -1);
  const { status: p2Status } = useController(dp2PGamepadIndex ?? -1);

  // DPControllerStatusの組み立て
  const dpControllerStatus: DPControllerStatus | null =
    (p1Status || p2Status) ? {
      mode: 'DP',
      player1: p1Status || null,
      player2: p2Status || null,
      timestamp: Date.now(),
    } : null;

  // コントローラーデータをWebSocket送信（変更時のみ）
  useWebSocketData({
    ws,
    isReceiveMode: false,
    playMode: 'DP',
    spControllerStatus: null,
    dpControllerStatus,
    sendSP: noop,
    sendDP,
  });

  // ゲームパッド未割り当て: セットアップ画面
  if (dp1PGamepadIndex === null || dp2PGamepadIndex === null) {
    return (
      <>
        <DPGamepadSelector
          error={assignmentError}
          assignments={buildDPAssignments(dp1PGamepadIndex, dp2PGamepadIndex, gamepads)}
          isAssigning={isAutoAssigning}
        />
        <ConnectionSettings
          ipAddress={ipAddress}
          onIpAddressChange={onIpAddressChange}
          onReceiveModeClick={onReceiveModeClick}
        />
      </>
    );
  }

  // 割り当て済: コントローラー表示
  return (
    <>
      <IIDXControllerDP
        player1Status={p1Status || null}
        player2Status={p2Status || null}
        mode="DP"
        currentPlayerSide="1P"
      />
      <div className="mt-5">
        <BeatStatusDP
          player1Status={p1Status || null}
          player2Status={p2Status || null}
          mode="DP"
        />
      </div>
    </>
  );
};
