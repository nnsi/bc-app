import { describe, it, expect } from 'vitest';
import {
  shouldStartAutoAssignment,
  shouldConnectWebSocketForDP,
  transformGamepadData,
  buildDPAssignments,
} from './appBusinessLogic';
import type { GamepadInfo } from '../types/gamepad';

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
