import type { ControllerStatus, DPControllerStatus } from '../types/controller';

/**
 * 表示するコントローラーステータスを決定する
 */
export const determineDisplayStatus = (
  isReceiveMode: boolean,
  receivedData: ControllerStatus | DPControllerStatus | null,
  playMode: 'SP' | 'DP',
  spControllerStatus: ControllerStatus | null,
  dpControllerStatus: DPControllerStatus | null
): ControllerStatus | DPControllerStatus | null => {
  if (isReceiveMode && receivedData) {
    if ('mode' in receivedData && receivedData.mode === 'DP') {
      return receivedData as DPControllerStatus;
    }
    return receivedData as ControllerStatus;
  }
  return playMode === 'SP' ? spControllerStatus : dpControllerStatus;
};

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
 * モード切り替え時のアクション
 */
export interface ModeChangeActions {
  shouldCancelAutoAssignment: boolean;
  shouldResetCount: boolean;
  shouldResetGamepad: boolean;
  shouldResetDPMapping: boolean;
  shouldStartAutoAssignment: boolean;
}

export const determineModeChangeActions = (
  prevMode: 'SP' | 'DP',
  newMode: 'SP' | 'DP',
  isAutoAssigning: boolean
): ModeChangeActions => {
  if (prevMode === newMode) {
    return {
      shouldCancelAutoAssignment: false,
      shouldResetCount: false,
      shouldResetGamepad: false,
      shouldResetDPMapping: false,
      shouldStartAutoAssignment: false,
    };
  }

  if (newMode === 'SP') {
    // DPモードからSPモードへ
    return {
      shouldCancelAutoAssignment: isAutoAssigning,
      shouldResetCount: true,
      shouldResetGamepad: true,
      shouldResetDPMapping: false,
      shouldStartAutoAssignment: false,
    };
  } else {
    // SPモードからDPモードへ
    return {
      shouldCancelAutoAssignment: false,
      shouldResetCount: true,
      shouldResetGamepad: true,
      shouldResetDPMapping: true,
      shouldStartAutoAssignment: true,
    };
  }
};

/**
 * プレイヤーサイドの変換
 */
export const playerSideToString = (is2P: boolean): string => is2P ? '2P' : '1P';
export const stringToPlayerSide = (saved: string | null): boolean => saved === '2P';

/**
 * 透過状態の変換
 */
export const transparencyToString = (isTransparent: boolean): string => String(isTransparent);
export const stringToTransparency = (saved: string | null): boolean => saved !== 'false';

/**
 * ゲームパッド情報の型と変換
 */
export interface GamepadInfo {
  index: number;
  id: string;
}

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