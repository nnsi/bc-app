import React, { useState, useEffect } from 'react';
import { ControllerStatus } from "../types/controller";
import { calculateStats } from '../utils/calculateStats';

export const BeatStatus: React.FC<{ status: ControllerStatus }> = ({
  status,
}) => {
  const [, setTick] = useState(0);
  const { count, density, releaseAverage } = calculateStats(status);

  // density > 0 の間だけ 200ms ごとに再レンダーして now を更新
  // イベント駆動では無入力時にレンダーされないため、density が古くならないようにする
  useEffect(() => {
    if (density <= 0) return;
    const timer = setInterval(() => setTick(t => t + 1), 200);
    return () => clearInterval(timer);
  }, [density > 0]);

  return (
    <p
      className="absolute left-2 bottom-[-30px] text-lg"
      style={{ textShadow: '0 0 3px #000, 0 0 3px #000, 0 0 3px #000, 0 0 3px #000' }}
    >
      {releaseAverage.toString().padStart(2, '0')} ms | {density.toString().padStart(2, '0')} / s <br />Total: {count}
    </p>
  );
};
