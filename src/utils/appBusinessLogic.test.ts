import { describe, it, expect } from 'vitest';
import {
  determineDisplayStatus,
  shouldStartAutoAssignment,
  shouldConnectWebSocketForDP,
  determineModeChangeActions,
  playerSideToString,
  stringToPlayerSide,
  transparencyToString,
  stringToTransparency,
  transformGamepadData,
  buildDPAssignments,
  type GamepadInfo,
} from './appBusinessLogic';
import type { ControllerStatus, DPControllerStatus } from '../types/controller';

// モックデータ作成ヘルパー
const createMockControllerStatus = (): ControllerStatus => ({
  keys: Array(7).fill({ isPressed: false, strokeCount: 0 }),
  scratch: { 
    state: 0, 
    count: 0,
    currentAxes: 0,
    previousAxes: 0,
    fixedStateTime: 0,
    rotationDistance: 0,
    rotationTime: 0,
    strokeDistance: 0
  },
  record: { 
    releaseTimes: [], 
    pressedTimes: [],
    keyReleaseTimes: [[], [], [], [], [], [], []],
    scratchTimes: [],
    scratchRotationDistances: []
  }
});

const createMockDPControllerStatus = (): DPControllerStatus => ({
  mode: 'DP',
  player1: createMockControllerStatus(),
  player2: createMockControllerStatus(),
  timestamp: Date.now()
});

describe('determineDisplayStatus', () => {
  const mockSPStatus = createMockControllerStatus();
  const mockDPStatus = createMockDPControllerStatus();

  it('受信モードでSPデータを受信した場合、そのデータを返す', () => {
    const receivedData = createMockControllerStatus();
    const result = determineDisplayStatus(
      true, // isReceiveMode
      receivedData,
      'SP',
      mockSPStatus,
      mockDPStatus
    );
    expect(result).toBe(receivedData);
  });

  it('受信モードでDPデータを受信した場合、DPControllerStatusとして返す', () => {
    const receivedData = createMockDPControllerStatus();
    const result = determineDisplayStatus(
      true, // isReceiveMode
      receivedData,
      'SP',
      mockSPStatus,
      mockDPStatus
    );
    expect(result).toBe(receivedData);
    expect(result).toHaveProperty('mode', 'DP');
  });

  it('受信モードでない場合、SPモードならspControllerStatusを返す', () => {
    const result = determineDisplayStatus(
      false, // isReceiveMode
      null,
      'SP',
      mockSPStatus,
      mockDPStatus
    );
    expect(result).toBe(mockSPStatus);
  });

  it('受信モードでない場合、DPモードならdpControllerStatusを返す', () => {
    const result = determineDisplayStatus(
      false, // isReceiveMode
      null,
      'DP',
      mockSPStatus,
      mockDPStatus
    );
    expect(result).toBe(mockDPStatus);
  });

  it('受信モードだがデータがない場合、ローカルステータスを返す', () => {
    const result = determineDisplayStatus(
      true, // isReceiveMode
      null, // receivedData
      'SP',
      mockSPStatus,
      mockDPStatus
    );
    expect(result).toBe(mockSPStatus);
  });
});

describe('shouldStartAutoAssignment', () => {
  it('DPモードで両方のゲームパッドが未割り当ての場合、trueを返す', () => {
    const result = shouldStartAutoAssignment(
      'DP',
      false, // isReceiveMode
      false, // isAutoAssigning
      null,  // dp1PGamepadIndex
      null   // dp2PGamepadIndex
    );
    expect(result).toBe(true);
  });

  it('DPモードで1Pのみ未割り当ての場合、trueを返す', () => {
    const result = shouldStartAutoAssignment(
      'DP',
      false, // isReceiveMode
      false, // isAutoAssigning
      null,  // dp1PGamepadIndex
      1      // dp2PGamepadIndex
    );
    expect(result).toBe(true);
  });

  it('DPモードで2Pのみ未割り当ての場合、trueを返す', () => {
    const result = shouldStartAutoAssignment(
      'DP',
      false, // isReceiveMode
      false, // isAutoAssigning
      0,     // dp1PGamepadIndex
      null   // dp2PGamepadIndex
    );
    expect(result).toBe(true);
  });

  it('受信モードの場合、falseを返す', () => {
    const result = shouldStartAutoAssignment(
      'DP',
      true,  // isReceiveMode
      false, // isAutoAssigning
      null,  // dp1PGamepadIndex
      null   // dp2PGamepadIndex
    );
    expect(result).toBe(false);
  });

  it('既に自動割り当て中の場合、falseを返す', () => {
    const result = shouldStartAutoAssignment(
      'DP',
      false, // isReceiveMode
      true,  // isAutoAssigning
      null,  // dp1PGamepadIndex
      null   // dp2PGamepadIndex
    );
    expect(result).toBe(false);
  });

  it('SPモードの場合、falseを返す', () => {
    const result = shouldStartAutoAssignment(
      'SP',
      false, // isReceiveMode
      false, // isAutoAssigning
      null,  // dp1PGamepadIndex
      null   // dp2PGamepadIndex
    );
    expect(result).toBe(false);
  });

  it('DPモードで両方のゲームパッドが割り当て済みの場合、falseを返す', () => {
    const result = shouldStartAutoAssignment(
      'DP',
      false, // isReceiveMode
      false, // isAutoAssigning
      0,     // dp1PGamepadIndex
      1      // dp2PGamepadIndex
    );
    expect(result).toBe(false);
  });
});

describe('shouldConnectWebSocketForDP', () => {
  it('DPモードで両方のゲームパッドが割り当て済みでWS未接続の場合、trueを返す', () => {
    const result = shouldConnectWebSocketForDP(
      'DP',
      false, // isReceiveMode
      0,     // dp1PGamepadIndex
      1,     // dp2PGamepadIndex
      false  // wsConnected
    );
    expect(result).toBe(true);
  });

  it('既にWebSocket接続済みの場合、falseを返す', () => {
    const result = shouldConnectWebSocketForDP(
      'DP',
      false, // isReceiveMode
      0,     // dp1PGamepadIndex
      1,     // dp2PGamepadIndex
      true   // wsConnected
    );
    expect(result).toBe(false);
  });

  it('受信モードの場合、falseを返す', () => {
    const result = shouldConnectWebSocketForDP(
      'DP',
      true,  // isReceiveMode
      0,     // dp1PGamepadIndex
      1,     // dp2PGamepadIndex
      false  // wsConnected
    );
    expect(result).toBe(false);
  });

  it('ゲームパッドが未割り当ての場合、falseを返す', () => {
    const result = shouldConnectWebSocketForDP(
      'DP',
      false, // isReceiveMode
      null,  // dp1PGamepadIndex
      1,     // dp2PGamepadIndex
      false  // wsConnected
    );
    expect(result).toBe(false);
  });
});

describe('determineModeChangeActions', () => {
  it('同じモードの場合、何もアクションを起こさない', () => {
    const result = determineModeChangeActions('SP', 'SP', false);
    expect(result).toEqual({
      shouldCancelAutoAssignment: false,
      shouldResetCount: false,
      shouldResetGamepad: false,
      shouldResetDPMapping: false,
      shouldStartAutoAssignment: false,
    });
  });

  it('DPからSPへの切り替え時、適切なアクションを返す', () => {
    const result = determineModeChangeActions('DP', 'SP', false);
    expect(result).toEqual({
      shouldCancelAutoAssignment: false,
      shouldResetCount: true,
      shouldResetGamepad: true,
      shouldResetDPMapping: false,
      shouldStartAutoAssignment: false,
    });
  });

  it('DPからSPへの切り替え時、自動割り当て中ならキャンセルする', () => {
    const result = determineModeChangeActions('DP', 'SP', true);
    expect(result).toEqual({
      shouldCancelAutoAssignment: true,
      shouldResetCount: true,
      shouldResetGamepad: true,
      shouldResetDPMapping: false,
      shouldStartAutoAssignment: false,
    });
  });

  it('SPからDPへの切り替え時、適切なアクションを返す', () => {
    const result = determineModeChangeActions('SP', 'DP', false);
    expect(result).toEqual({
      shouldCancelAutoAssignment: false,
      shouldResetCount: true,
      shouldResetGamepad: true,
      shouldResetDPMapping: true,
      shouldStartAutoAssignment: true,
    });
  });
});

describe('プレイヤーサイドの変換', () => {
  it('playerSideToString が正しく変換する', () => {
    expect(playerSideToString(false)).toBe('1P');
    expect(playerSideToString(true)).toBe('2P');
  });

  it('stringToPlayerSide が正しく変換する', () => {
    expect(stringToPlayerSide('1P')).toBe(false);
    expect(stringToPlayerSide('2P')).toBe(true);
    expect(stringToPlayerSide(null)).toBe(false);
    expect(stringToPlayerSide('invalid')).toBe(false);
  });
});

describe('透過状態の変換', () => {
  it('transparencyToString が正しく変換する', () => {
    expect(transparencyToString(true)).toBe('true');
    expect(transparencyToString(false)).toBe('false');
  });

  it('stringToTransparency が正しく変換する', () => {
    expect(stringToTransparency('true')).toBe(true);
    expect(stringToTransparency('false')).toBe(false);
    expect(stringToTransparency(null)).toBe(true); // デフォルトは透過
    expect(stringToTransparency('invalid')).toBe(true);
  });
});

describe('transformGamepadData', () => {
  it('有効なゲームパッドデータを変換する', () => {
    const input = [
      { index: 0, id: 'Xbox Controller' },
      { index: 1, id: 'PS4 Controller' },
    ];
    const result = transformGamepadData(input);
    expect(result).toEqual([
      { index: 0, id: 'Xbox Controller' },
      { index: 1, id: 'PS4 Controller' },
    ]);
  });

  it('null/undefinedを除外する', () => {
    const input = [
      { index: 0, id: 'Xbox Controller' },
      null,
      undefined,
      { index: 2, id: 'PS4 Controller' },
    ];
    const result = transformGamepadData(input);
    expect(result).toEqual([
      { index: 0, id: 'Xbox Controller' },
      { index: 2, id: 'PS4 Controller' },
    ]);
  });

  it('空配列を正しく処理する', () => {
    const result = transformGamepadData([]);
    expect(result).toEqual([]);
  });
});

describe('buildDPAssignments', () => {
  const gamepads: GamepadInfo[] = [
    { index: 0, id: 'Xbox Controller' },
    { index: 1, id: 'PS4 Controller' },
  ];

  it('両方のゲームパッドが割り当てられている場合', () => {
    const result = buildDPAssignments(0, 1, gamepads);
    expect(result).toEqual({
      player1: { index: 0, id: 'Xbox Controller' },
      player2: { index: 1, id: 'PS4 Controller' },
    });
  });

  it('1Pのみ割り当てられている場合', () => {
    const result = buildDPAssignments(0, null, gamepads);
    expect(result).toEqual({
      player1: { index: 0, id: 'Xbox Controller' },
      player2: null,
    });
  });

  it('2Pのみ割り当てられている場合', () => {
    const result = buildDPAssignments(null, 1, gamepads);
    expect(result).toEqual({
      player1: null,
      player2: { index: 1, id: 'PS4 Controller' },
    });
  });

  it('どちらも割り当てられていない場合', () => {
    const result = buildDPAssignments(null, null, gamepads);
    expect(result).toEqual({
      player1: null,
      player2: null,
    });
  });

  it('ゲームパッドリストにない番号が指定された場合、Unknownを返す', () => {
    const result = buildDPAssignments(5, 6, gamepads);
    expect(result).toEqual({
      player1: { index: 5, id: 'Unknown' },
      player2: { index: 6, id: 'Unknown' },
    });
  });
});