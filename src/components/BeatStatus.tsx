import { ControllerStatus } from "../hooks/useController";

export const BeatStatus: React.FC<{ status: ControllerStatus }> = ({
  status,
}) => {
  const count =
    status.keys.reduce((val, key) => val + key.strokeCount, 0) +
    status.scratch.count;

  const unixTime = new Date().getTime();
  const density = status.record.pressedTimes.filter(
    (pressedTime) => pressedTime > unixTime - 1000
  ).length;
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
    <p>
      {releaseAverage} ms | {density} / s | {count}
    </p>
  );
};
