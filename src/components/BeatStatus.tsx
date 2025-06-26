import React from 'react';
import { ControllerStatus } from "../types/controller";

export const BeatStatus: React.FC<{ status: ControllerStatus }> = ({
  status,
}) => {
  const count =
    status.keys.reduce((val, key) => val + key.strokeCount, 0) +
    status.scratch.count;

  const unixTime = new Date().getTime();
  const buttonDensity = status.record.pressedTimes.filter(
    (pressedTime) => pressedTime > unixTime - 1000
  ).length;
  const scratchDensity = (status.record.scratchTimes || []).filter(
    (scratchTime) => scratchTime > unixTime - 1000
  ).length;
  const density = buttonDensity + scratchDensity;
  status.record.releaseTimes.length =
    status.record.releaseTimes.length > 2000
      ? 2000
      : status.record.releaseTimes.length;
  const releaseAverage =
    status.record.releaseTimes.length > 0
      ? Math.ceil(
          status.record.releaseTimes.reduce((v, c) => v + c, 0) /
            status.record.releaseTimes.length
        )
      : 0;

  return (
    <p 
      className="absolute left-2 bottom-2 text-lg" 
      style={{ textShadow: '0 0 3px #000, 0 0 3px #000, 0 0 3px #000, 0 0 3px #000' }}
    >
      {releaseAverage.toString().padStart(2, '0')} ms | {density.toString().padStart(2, '0')} / s <br />Total: {count}
    </p>
  );
};
