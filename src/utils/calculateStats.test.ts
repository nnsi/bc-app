import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateStats } from './calculateStats';
import type { ControllerStatus } from '../types/controller';

// テスト用ヘルパー: 最小限のControllerStatusを生成
function createStatus(overrides?: {
  strokeCounts?: number[];
  scratchCount?: number;
  releaseTimes?: number[];
  pressedTimes?: number[];
  scratchTimes?: number[];
}): ControllerStatus {
  const strokeCounts = overrides?.strokeCounts ?? [0, 0, 0, 0, 0, 0, 0];
  return {
    keys: strokeCounts.map((strokeCount) => ({
      isPressed: false,
      isChangedState: false,
      beforeState: false,
      beforeStateTime: 0,
      releaseTime: 0,
      strokeCount,
    })),
    scratch: {
      currentAxes: 0,
      previousAxes: 0,
      fixedStateTime: 0,
      state: 0,
      count: overrides?.scratchCount ?? 0,
      rotationDistance: 0,
      rotationTime: 0,
      strokeDistance: 0,
      axesChangedAt: 0,
    },
    record: {
      releaseTimes: overrides?.releaseTimes ?? [],
      keyReleaseTimes: [[], [], [], [], [], [], []],
      pressedTimes: overrides?.pressedTimes ?? [],
      scratchTimes: overrides?.scratchTimes ?? [],
      scratchRotationDistances: [],
    },
  };
}

describe('calculateStats', () => {
  // performance.now()を固定して密度計算をテスト可能にする
  const NOW = 10000;
  let performanceNowSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(NOW);
  });
  afterEach(() => {
    performanceNowSpy.mockRestore();
  });

  // --- null/undefined ---

  it('null を渡すとゼロ値を返す', () => {
    expect(calculateStats(null)).toEqual({ count: 0, density: 0, releaseAverage: 0 });
  });

  it('undefined を渡すとゼロ値を返す', () => {
    expect(calculateStats(undefined)).toEqual({ count: 0, density: 0, releaseAverage: 0 });
  });

  // --- count ---

  it('全キーの strokeCount + scratch.count を合計する', () => {
    const status = createStatus({
      strokeCounts: [10, 20, 5, 0, 3, 0, 2],
      scratchCount: 7,
    });
    const { count } = calculateStats(status);
    expect(count).toBe(10 + 20 + 5 + 0 + 3 + 0 + 2 + 7);
  });

  it('全てゼロの場合 count は 0', () => {
    const status = createStatus();
    expect(calculateStats(status).count).toBe(0);
  });

  // --- density ---

  it('直近1秒以内の pressedTimes と scratchTimes を合算する', () => {
    const status = createStatus({
      pressedTimes: [NOW - 500, NOW - 999, NOW - 1001], // 2件が1秒以内
      scratchTimes: [NOW - 100, NOW - 2000],             // 1件が1秒以内
    });
    const { density } = calculateStats(status);
    expect(density).toBe(3); // 2 + 1
  });

  it('全て1秒より古い場合 density は 0', () => {
    const status = createStatus({
      pressedTimes: [NOW - 1001, NOW - 2000],
      scratchTimes: [NOW - 5000],
    });
    expect(calculateStats(status).density).toBe(0);
  });

  it('pressedTimes/scratchTimes が空なら density は 0', () => {
    const status = createStatus();
    expect(calculateStats(status).density).toBe(0);
  });

  it('scratchTimes が undefined でも動作する', () => {
    const status = createStatus();
    // scratchTimes を undefined に（|| [] でフォールバックされる）
    (status.record as any).scratchTimes = undefined;
    expect(calculateStats(status).density).toBe(0);
  });

  // --- releaseAverage ---

  it('releaseTimes の切り上げ平均を返す', () => {
    const status = createStatus({
      releaseTimes: [10, 20, 30],
    });
    // (10 + 20 + 30) / 3 = 20.0 → ceil → 20
    expect(calculateStats(status).releaseAverage).toBe(20);
  });

  it('割り切れない場合は切り上げ', () => {
    const status = createStatus({
      releaseTimes: [10, 11],
    });
    // (10 + 11) / 2 = 10.5 → ceil → 11
    expect(calculateStats(status).releaseAverage).toBe(11);
  });

  it('releaseTimes が空なら releaseAverage は 0', () => {
    const status = createStatus({ releaseTimes: [] });
    expect(calculateStats(status).releaseAverage).toBe(0);
  });

  it('releaseTimes が1件でもそのまま返す', () => {
    const status = createStatus({ releaseTimes: [42] });
    expect(calculateStats(status).releaseAverage).toBe(42);
  });

  // --- 複合 ---

  it('全フィールドを同時に正しく計算する', () => {
    const status = createStatus({
      strokeCounts: [5, 5, 5, 5, 5, 5, 5],
      scratchCount: 10,
      pressedTimes: [NOW - 100, NOW - 200, NOW - 1500],
      scratchTimes: [NOW - 50],
      releaseTimes: [30, 50, 40],
    });
    const result = calculateStats(status);
    expect(result.count).toBe(35 + 10);
    expect(result.density).toBe(3); // 2 pressed + 1 scratch
    expect(result.releaseAverage).toBe(40); // (30+50+40)/3 = 40
  });
});
