import type { GamepadInfo } from '../types/gamepad';

/**
 * DPモードで自動割り当てを開始すべきか判定
 */
export const shouldStartAutoAssignment = (
  playMode: 'SP' | 'DP',
  isReceiveMode: boolean,
  isAutoAssigning: boolean,
  dp1PGamepadIndex: number | null,
  dp2PGamepadIndex: number | null
): boolean => {
  return playMode === 'DP' &&
         !isReceiveMode &&
         !isAutoAssigning &&
         (dp1PGamepadIndex === null || dp2PGamepadIndex === null);
};

/**
 * DPモードでWebSocket接続すべきか判定
 */
export const shouldConnectWebSocketForDP = (
  playMode: 'SP' | 'DP',
  isReceiveMode: boolean,
  dp1PGamepadIndex: number | null,
  dp2PGamepadIndex: number | null,
  wsConnected: boolean
): boolean => {
  return playMode === 'DP' &&
         !isReceiveMode &&
         dp1PGamepadIndex !== null &&
         dp2PGamepadIndex !== null &&
         !wsConnected;
};

/**
 * ゲームパッド情報の変換
 */
export const transformGamepadData = (gamepads: any[]): GamepadInfo[] => {
  return gamepads
    .filter(Boolean)
    .map((gp) => ({
      index: gp.index,
      id: gp.id,
    }));
};

/**
 * DPモード用の割り当て情報
 */
export interface GamepadAssignment {
  index: number;
  id: string;
}

export interface DPAssignments {
  player1: GamepadAssignment | null;
  player2: GamepadAssignment | null;
}

export const buildDPAssignments = (
  dp1PGamepadIndex: number | null,
  dp2PGamepadIndex: number | null,
  gamepads: GamepadInfo[]
): DPAssignments => {
  return {
    player1: dp1PGamepadIndex !== null ? {
      index: dp1PGamepadIndex,
      id: gamepads.find(g => g.index === dp1PGamepadIndex)?.id || 'Unknown',
    } : null,
    player2: dp2PGamepadIndex !== null ? {
      index: dp2PGamepadIndex,
      id: gamepads.find(g => g.index === dp2PGamepadIndex)?.id || 'Unknown',
    } : null,
  };
};
