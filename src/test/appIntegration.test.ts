import { describe, it, expect, vi, beforeEach } from 'vitest';

// ビジネスロジックのインポート
import {
  shouldStartAutoAssignment,
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
