import { ControllerStatus } from "../hooks/useController";

export const BeatStatus: React.FC<{ status: ControllerStatus }> = ({
  status,
}) => {
  const count =
    status.keys.reduce((val, key) => val + key.strokeCount, 0) +
    status.scratch.count;
  const averageReleaseTime = Math.ceil(
    status.keys.reduce((val, key) => val + key.releaseTime, 0) / 7
  );
  return (
    <div>
      <p>Total:{count}</p>
      <p>Speed:{averageReleaseTime}ms</p>
      <p style={{ display: "none" }}>{JSON.stringify(status)}</p>
    </div>
  );
};
