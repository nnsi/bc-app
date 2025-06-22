import React from "react";
import { ControllerStatus } from "../types/controller";

const Scratch: React.FC<{ state: number; style?: React.CSSProperties }> = ({
  state,
  style,
}) => (
  <div
    className={`
      w-[100px] h-[100px] rounded-[50px] text-[0px]
      transition-all duration-[50ms] ease-out relative overflow-hidden
      ${state === 0 ? 'bg-[#666] border-2 border-[#333]' : ''}
      ${state === 1 ? 'scratch-up' : ''}
      ${state === -1 ? 'scratch-down' : ''}
    `}
    style={style}
  >
    <span className="sr-only">scratch</span>
  </div>
);

const Button: React.FC<{
  isPressed: boolean;
  index: number;
  releaseSpeed?: number;
}> = ({ isPressed, index, releaseSpeed }) => {
  return (
    <div
      className={`
        w-[40px] h-[70px] transition-all duration-[50ms] ease-out
        relative overflow-hidden border border-[#333] flex items-center justify-center
        ${index % 2 === 0 ? 'bg-[#999]' : 'bg-[#666]'}
        ${isPressed ? 'button-pressed' : ''}
      `}
    >
      {releaseSpeed !== undefined && releaseSpeed > 0 && (
        <span className={`
          text-[14px] font-bold z-10 relative
          ${isPressed ? 'text-[#333]' : 'text-white'}
          [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]
        `}>
          {releaseSpeed}
        </span>
      )}
    </div>
  );
};

export const IIDXController: React.FC<{
  status: ControllerStatus | null;
  is2P?: boolean;
  disabled?: boolean;
}> = ({ status, is2P = false, disabled = false }) => {
  // 無効化状態の場合はダミーデータを表示
  const displayStatus = status || {
    keys: Array(7).fill({ isPressed: false }),
    scratch: { state: 0 },
    record: { keyReleaseTimes: [] }
  };

  // 各鍵盤のリリーススピード平均を計算
  const keyReleaseAverages = (displayStatus.record.keyReleaseTimes || [[], [], [], [], [], [], []]).map((times) => {
    return times.length > 0
      ? Math.ceil(times.reduce((v, c) => v + c, 0) / times.length)
      : 0;
  });

  if (is2P) {
    return (
      <div className={`flex items-center justify-center ${disabled ? 'opacity-60 grayscale' : ''}`}>
        <div className="keys-container">
          {displayStatus.keys.map((key, i) => (
            <div key={i}>
              <Button 
                isPressed={key.isPressed} 
                index={i} 
                releaseSpeed={keyReleaseAverages[i]}
              />
            </div>
          ))}
        </div>
        <Scratch state={displayStatus.scratch.state} style={{ marginRight: "-30px", marginLeft: "20px" }} />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${disabled ? 'opacity-60 grayscale' : ''}`}>
      <Scratch state={displayStatus.scratch.state} style={{ marginRight: "30px" }} />
      <div className="keys-container">
        {displayStatus.keys.map((key, i) => (
          <div key={i}>
            <Button 
              isPressed={key.isPressed} 
              index={i} 
              releaseSpeed={keyReleaseAverages[i]}
            />
          </div>
        ))}
      </div>
    </div>
  );
};