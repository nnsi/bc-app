/**
 * DP対応のビート統計表示コンポーネント
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ControllerStatus } from '../types/controller';
import { calculateStats } from '../utils/calculateStats';

interface BeatStatusDPProps {
  /** 1P側のコントローラー状態 */
  player1Status?: ControllerStatus | null;
  /** 2P側のコントローラー状態 */
  player2Status?: ControllerStatus | null;
  /** プレイモード */
  mode: 'SP' | 'DP';
}

/**
 * 2つの統計を結合する関数
 */
function combineStats(stats1: ReturnType<typeof calculateStats>, stats2: ReturnType<typeof calculateStats>) {
  const totalCount = stats1.count + stats2.count;
  const totalDensity = stats1.density + stats2.density;
  
  // 平均リリース時間は両方の重み付き平均を計算
  let combinedReleaseAverage = 0;
  if (stats1.releaseAverage > 0 && stats2.releaseAverage > 0) {
    const weight1 = stats1.count / totalCount;
    const weight2 = stats2.count / totalCount;
    combinedReleaseAverage = Math.ceil(stats1.releaseAverage * weight1 + stats2.releaseAverage * weight2);
  } else if (stats1.releaseAverage > 0) {
    combinedReleaseAverage = stats1.releaseAverage;
  } else if (stats2.releaseAverage > 0) {
    combinedReleaseAverage = stats2.releaseAverage;
  }

  return {
    count: totalCount,
    density: totalDensity,
    releaseAverage: combinedReleaseAverage,
  };
}

export const BeatStatusDP: React.FC<BeatStatusDPProps> = ({
  player1Status,
  player2Status,
  mode,
}) => {
  // 各プレイヤーの統計を計算
  const player1Stats = useMemo(() => calculateStats(player1Status), [player1Status]);
  const player2Stats = useMemo(() => calculateStats(player2Status), [player2Status]);
  const combinedStats = useMemo(() => combineStats(player1Stats, player2Stats), [player1Stats, player2Stats]);

  // density > 0 の間だけ 200ms ごとに再レンダーして now を更新
  const [, setTick] = useState(0);
  useEffect(() => {
    if (combinedStats.density <= 0) return;
    const timer = setInterval(() => setTick(t => t + 1), 200);
    return () => clearInterval(timer);
  }, [combinedStats.density > 0]);

  // SPモードの場合は常に単一の統計を表示
  if (mode === 'SP') {
    const stats = player1Status ? player1Stats : player2Stats;
    return (
      <div className="mt-0 text-white text-left">
        <p className="my-1 text-left text-lg" style={{ textShadow: '0 0 3px #000, 0 0 3px #000, 0 0 3px #000, 0 0 3px #000' }}>
          {stats.releaseAverage.toString().padStart(2, '0')} ms | {stats.density.toString().padStart(2, '0')} / s
        </p>
        <p className="my-1 text-left text-lg" style={{ textShadow: '0 0 3px #000, 0 0 3px #000, 0 0 3px #000, 0 0 3px #000' }}>Total: {stats.count}</p>
      </div>
    );
  }

  // DPモードは統合統計のみ表示
  return (
    <div className="text-white text-left absolute left-2 bottom-2">
      <p className="my-1 text-left text-lg" style={{ textShadow: '0 0 3px #000, 0 0 3px #000, 0 0 3px #000, 0 0 3px #000' }}>
        {combinedStats.releaseAverage.toString().padStart(2, '0')} ms | {combinedStats.density.toString().padStart(2, '0')} / s
      </p>
      <p className="my-1 text-left text-lg" style={{ textShadow: '0 0 3px #000, 0 0 3px #000, 0 0 3px #000, 0 0 3px #000' }}>
        Total: {combinedStats.count}
      </p>
    </div>
  );
};