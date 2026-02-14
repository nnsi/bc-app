import React from 'react';
import { ControllerStatus } from "../types/controller";
import { calculateStats } from '../utils/calculateStats';

export const BeatStatus: React.FC<{ status: ControllerStatus }> = ({
  status,
}) => {
  const { count, density, releaseAverage } = calculateStats(status);

  return (
    <p
      className="absolute left-2 bottom-2 text-lg"
      style={{ textShadow: '0 0 3px #000, 0 0 3px #000, 0 0 3px #000, 0 0 3px #000' }}
    >
      {releaseAverage.toString().padStart(2, '0')} ms | {density.toString().padStart(2, '0')} / s <br />Total: {count}
    </p>
  );
};
