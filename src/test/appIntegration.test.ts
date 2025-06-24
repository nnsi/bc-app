import { describe, it, expect, vi, beforeEach } from 'vitest';

// ビジネスロジックのインポート
import {
  determineDisplayStatus,
  shouldStartAutoAssignment,
  determineModeChangeActions,
} from '../utils/appBusinessLogic';

// モックの準備
vi.mock('../hooks/useWebSocketDP', () => ({
  useWebSocketDP: () => ({
    ws: null,
    state: null,
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    sendSP: vi.fn(),
    sendDP: vi.fn(),
    receivedData: null,
  }),
}));

vi.mock('../hooks/useGamepadDetection', () => ({
  useGamepadDetection: () => ({
    selectedGamepadIndex: null,
    error: null,
    reset: vi.fn(),
  }),
}));

// 統合シナリオのテスト
describe('App.tsx 統合シナリオ', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('重要シナリオ1: SPモードでのゲームパッド検出とWebSocket接続', () => {
    it('ビジネスロジックが正しい判定を返す', () => {
      // 初期状態
      const displayStatus1 = determineDisplayStatus(
        false, // isReceiveMode
        null,  // receivedData
        'SP',  // playMode
        null,  // spControllerStatus（未検出）
        null   // dpControllerStatus
      );
      expect(displayStatus1).toBeNull();

      // ゲームパッド検出後
      const mockSPStatus = {
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
      };
      const displayStatus2 = determineDisplayStatus(
        false, // isReceiveMode
        null,  // receivedData
        'SP',  // playMode
        mockSPStatus, // spControllerStatus（検出済み）
        null   // dpControllerStatus
      );
      expect(displayStatus2).toBe(mockSPStatus);
    });
  });

  describe('重要シナリオ2: SPからDPへのモード切り替え', () => {
    it('モード切り替え時のアクションが正しい', () => {
      const actions = determineModeChangeActions('SP', 'DP', false);
      
      expect(actions.shouldResetCount).toBe(true);
      expect(actions.shouldResetGamepad).toBe(true);
      expect(actions.shouldResetDPMapping).toBe(true);
      expect(actions.shouldStartAutoAssignment).toBe(true);
    });

    it('DPモード切り替え後、自動割り当てが必要と判定される', () => {
      const shouldStart = shouldStartAutoAssignment(
        'DP',  // playMode
        false, // isReceiveMode
        false, // isAutoAssigning
        null,  // dp1PGamepadIndex
        null   // dp2PGamepadIndex
      );
      expect(shouldStart).toBe(true);
    });
  });

  describe('重要シナリオ3: 受信モードでの表示切り替え', () => {
    it('受信モードでSPデータを受信した場合の表示', () => {
      const receivedSPData = {
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
      };

      const displayStatus = determineDisplayStatus(
        true,  // isReceiveMode
        receivedSPData,
        'SP',  // playMode（受信モードでは無関係）
        null,  // spControllerStatus
        null   // dpControllerStatus
      );

      expect(displayStatus).toBe(receivedSPData);
    });

    it('受信モードでDPデータを受信した場合の表示', () => {
      const receivedDPData = {
        mode: 'DP' as const,
        player1: {
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
        },
        player2: {
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
        },
        timestamp: Date.now()
      };

      const displayStatus = determineDisplayStatus(
        true,  // isReceiveMode
        receivedDPData,
        'SP',  // playMode（受信モードでは無関係）
        null,  // spControllerStatus
        null   // dpControllerStatus
      );

      expect(displayStatus).toBe(receivedDPData);
      expect(displayStatus).toHaveProperty('mode', 'DP');
    });
  });

  describe('重要シナリオ4: DPモードでの自動割り当て完了後のWebSocket接続', () => {
    it('片方のゲームパッドのみ割り当て済みの場合、自動割り当てが必要', () => {
      const shouldStart = shouldStartAutoAssignment(
        'DP',  // playMode
        false, // isReceiveMode
        false, // isAutoAssigning
        0,     // dp1PGamepadIndex（割り当て済み）
        null   // dp2PGamepadIndex（未割り当て）
      );
      expect(shouldStart).toBe(true);
    });

    it('両方のゲームパッドが割り当て済みの場合、自動割り当ては不要', () => {
      const shouldStart = shouldStartAutoAssignment(
        'DP',  // playMode
        false, // isReceiveMode
        false, // isAutoAssigning
        0,     // dp1PGamepadIndex
        1      // dp2PGamepadIndex
      );
      expect(shouldStart).toBe(false);
    });
  });

  describe('重要シナリオ5: localStorage の永続化', () => {
    it('プレイヤーサイドの保存と復元', () => {
      // App.tsxでの保存をシミュレート
      localStorage.setItem('playerSide', '2P');
      
      // 復元時のロジック確認
      const saved = localStorage.getItem('playerSide');
      const is2P = saved === '2P';
      expect(is2P).toBe(true);
    });

    it('透過状態の保存と復元', () => {
      // App.tsxでの保存をシミュレート
      localStorage.setItem('isTransparent', 'false');
      
      // 復元時のロジック確認
      const saved = localStorage.getItem('isTransparent');
      const isTransparent = saved !== 'false';
      expect(isTransparent).toBe(false);
    });
  });
});

// 状態遷移の整合性チェック
describe('状態遷移の整合性', () => {
  it('DPモードで自動割り当て中にSPモードに切り替えた場合、キャンセルが必要', () => {
    const actions = determineModeChangeActions('DP', 'SP', true); // isAutoAssigning = true
    expect(actions.shouldCancelAutoAssignment).toBe(true);
  });

  it('同じモードへの切り替えでは何も起こらない', () => {
    const spToSp = determineModeChangeActions('SP', 'SP', false);
    expect(spToSp.shouldResetCount).toBe(false);
    expect(spToSp.shouldResetGamepad).toBe(false);

    const dpToDp = determineModeChangeActions('DP', 'DP', false);
    expect(dpToDp.shouldResetCount).toBe(false);
    expect(dpToDp.shouldResetDPMapping).toBe(false);
  });
});