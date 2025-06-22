import React from "react";
import styled from "styled-components";
import { ControllerStatus } from "../types/controller";

const Scratch: React.FC<{ className?: string; state: number; style?: React.CSSProperties }> = ({
  className,
  state,
  style,
}) => (
  <p
    className={`${className} ${
      state === 1 ? "up" : state === -1 ? "down" : "neutral"
    }`}
    style={style}
  >
    scratch
  </p>
);

const StyledScratch = styled(Scratch)`
  width: 100px;
  height: 100px;
  background: #666;
  border-radius: 50px;
  font-size: 0;
  margin: 0 50px;
  transition: all 0.05s ease-out;
  position: relative;
  overflow: hidden;
  border: 2px solid #333;
  
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 50%;
    left: 0;
    transition: all 0.1s ease-out;
    opacity: 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    border-radius: 50%;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  &.up {
    background: linear-gradient(to bottom, #ccffff 0%, #999 50%, #666 100%);
    transform: scale(0.98);
    border-color: #ccffff;
    
    &::before {
      top: 0;
      background: linear-gradient(to bottom, rgba(255, 255, 255, 0.9) 0%, transparent 100%);
      opacity: 1;
    }
    
    &::after {
      opacity: 1;
    }
    
    box-shadow: 
      0 -10px 30px 5px rgba(204, 255, 255, 0.8),
      0 0 50px 10px rgba(204, 255, 255, 0.4),
      inset 0 20px 30px rgba(255, 255, 255, 0.6);
  }
  
  &.down {
    background: linear-gradient(to top, #ccffff 0%, #999 50%, #666 100%);
    transform: scale(0.98);
    border-color: #ccffff;
    
    &::before {
      bottom: 0;
      background: linear-gradient(to top, rgba(255, 255, 255, 0.9) 0%, transparent 100%);
      opacity: 1;
    }
    
    &::after {
      opacity: 1;
    }
    
    box-shadow: 
      0 10px 30px 5px rgba(204, 255, 255, 0.8),
      0 0 50px 10px rgba(204, 255, 255, 0.4),
      inset 0 -20px 30px rgba(255, 255, 255, 0.6);
  }
`;

const Button: React.FC<{
  className?: string;
  isPressed: boolean;
  index: number;
  releaseSpeed?: number;
  disabled?: boolean;
}> = ({ className, isPressed, index, releaseSpeed, disabled = false }) => {
  return (
    <p
      className={`${className} ${isPressed && "pressed"} ${
        index % 2 === 0 ? "even" : "odd"
      } ${disabled ? "disabled" : ""}`}
    >
      {releaseSpeed !== undefined && releaseSpeed > 0 && !disabled && (
        <span className="release-speed">{releaseSpeed}</span>
      )}
    </p>
  );
};

const StyledButton = styled(Button)`
  width: 40px;
  height: 70px;
  color: red;
  transition: all 0.05s ease-out;
  position: relative;
  overflow: hidden;
  border: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.even {
    background: #999;
  }
  &.odd {
    background: #666;
  }
  
  &.disabled {
    background: #444;
    opacity: 0.5;
    border-color: #222;
  }
  
  .release-speed {
    font-size: 14px;
    font-weight: bold;
    color: #fff;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    z-index: 10;
    position: relative;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: radial-gradient(circle, #ffffff 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: width 0.2s, height 0.2s;
  }
  
  &.pressed:not(.disabled) {
    background: #ccffff;
    transform: scale(0.95);
    border-color: #ccffff;
    box-shadow: 
      0 0 20px 2px rgba(204, 255, 255, 0.8),
      0 0 40px 4px rgba(204, 255, 255, 0.4),
      inset 0 0 10px rgba(255, 255, 255, 0.5);
    
    .release-speed {
      color: #333;
    }
    
    &::before {
      width: 150%;
      height: 150%;
    }
  }
`;

// 単体のコントローラーコンポーネント
const SingleController: React.FC<{
  status: ControllerStatus | null;
  is2P: boolean;
  disabled?: boolean;
}> = ({ status, is2P, disabled = false }) => {
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

  return (
    <div className={`single-controller ${disabled ? 'disabled' : ''}`}>
      <div className="controller-content">
        {is2P ? (
          <>
            <div className="keys">
              {displayStatus.keys.map((key, i) => (
                <StyledButton 
                  isPressed={key.isPressed} 
                  index={i} 
                  key={i} 
                  releaseSpeed={keyReleaseAverages[i]}
                  disabled={disabled}
                />
              ))}
            </div>
            <StyledScratch 
              state={displayStatus.scratch.state} 
              style={{ marginRight: "-30px", marginLeft: "20px", opacity: disabled ? 0.5 : 1 }} 
            />
          </>
        ) : (
          <>
            <StyledScratch 
              state={displayStatus.scratch.state} 
              style={{ marginLeft: "-10px", opacity: disabled ? 0.5 : 1 }} 
            />
            <div className="keys">
              {displayStatus.keys.map((key, i) => (
                <StyledButton 
                  isPressed={key.isPressed} 
                  index={i} 
                  key={i} 
                  releaseSpeed={keyReleaseAverages[i]}
                  disabled={disabled}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface IIDXControllerDPProps {
  className?: string;
  player1Status: ControllerStatus | null;
  player2Status: ControllerStatus | null;
  mode: 'SP' | 'DP';
  currentPlayerSide?: '1P' | '2P';  // SPモード時に使用
}

const IIDXControllerDPComponent: React.FC<IIDXControllerDPProps> = ({ 
  className, 
  player1Status, 
  player2Status, 
  mode,
  currentPlayerSide = '1P'
}) => {
  if (mode === 'SP') {
    // SPモードの場合は、currentPlayerSideに応じて単一のコントローラーを表示
    const status = currentPlayerSide === '1P' ? player1Status : player2Status;
    const is2P = currentPlayerSide === '2P';
    
    return (
      <div className={className}>
        <SingleController 
          status={status} 
          is2P={is2P}
          disabled={!status}
        />
      </div>
    );
  }

  // DPモードの場合は両方のコントローラーを表示
  return (
    <div className={className}>
      <SingleController 
        status={player1Status} 
        is2P={false}
        disabled={!player1Status}
      />
      <SingleController 
        status={player2Status} 
        is2P={true}
        disabled={!player2Status}
      />
    </div>
  );
};

export const IIDXControllerDP = styled(IIDXControllerDPComponent)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.mode === 'DP' ? '40px' : '0'};
  
  .single-controller {
    position: relative;
    
    &.disabled {
      opacity: 0.6;
      filter: grayscale(50%);
    }
    
    .player-label {
      position: absolute;
      top: -25px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 16px;
      font-weight: bold;
      color: #ccc;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    }
    
    .controller-content {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  
  .keys {
    display: flex;
    gap: 20px;
    p:nth-child(odd) {
      margin-top: 85px;
      margin-left: -30px;
    }
    p:nth-child(even) {
      margin-left: -30px;
    }
  }
`;