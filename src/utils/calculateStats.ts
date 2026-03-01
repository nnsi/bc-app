/**
 * コントローラー統計計算ユーティリティ
 * BeatStatus / BeatStatusDP 共通
 */

import type { ControllerStatus } from '../types/controller';

export interface BeatStats {
  count: number;
  density: number;
  releaseAverage: number;
}

export function calculateStats(status: ControllerStatus | null | undefined): BeatStats {
  if (!status) {
    return { count: 0, density: 0, releaseAverage: 0 };
  }

  const count =
    status.keys.reduce((val, key) => val + key.strokeCount, 0) +
    status.scratch.count;

  const now = performance.now();
  const buttonDensity = status.record.pressedTimes.filter(
    (pressedTime) => pressedTime > now - 1000
  ).length;
  const scratchDensity = (status.record.scratchTimes || []).filter(
    (scratchTime) => scratchTime > now - 1000
  ).length;
  const density = buttonDensity + scratchDensity;

  const releaseAverage =
    status.record.releaseTimes.length > 0
      ? Math.ceil(
          status.record.releaseTimes.reduce((v, c) => v + c, 0) /
            status.record.releaseTimes.length
        )
      : 0;

  return { count, density, releaseAverage };
}
