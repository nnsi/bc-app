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
}> = ({ className, isPressed, index }) => {
  return (
    <p
      className={`${className} ${isPressed && "pressed"} ${
        index % 2 === 0 ? "even" : "odd"
      }`}
    ></p>
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
  
  &.even {
    background: #999;
  }
  &.odd {
    background: #666;
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
  
  &.pressed {
    background: #ccffff;
    transform: scale(0.95);
    border-color: #ccffff;
    box-shadow: 
      0 0 20px 2px rgba(204, 255, 255, 0.8),
      0 0 40px 4px rgba(204, 255, 255, 0.4),
      inset 0 0 10px rgba(255, 255, 255, 0.5);
    
    &::before {
      width: 150%;
      height: 150%;
    }
  }
`;

const IIDXControllerComponent: React.FC<{
  className?: string;
  status: ControllerStatus;
  is2P?: boolean;
}> = ({ className, status, is2P = false }) => {

  if (is2P) {
    return (
      <div className={className}>
        <div className="keys">
          {status.keys.map((key, i) => (
            <StyledButton isPressed={key.isPressed} index={i} key={i} />
          ))}
        </div>
        <StyledScratch state={status.scratch.state} style={{ marginRight: "-30px", marginLeft: "20px" }} />
      </div>
    );
  }

  return (
    <div className={className}>
      <StyledScratch state={status.scratch.state} style={{ marginLeft: "-10px" }} />
      <div className="keys">
        {status.keys.map((key, i) => (
          <StyledButton isPressed={key.isPressed} index={i} key={i} />
        ))}
      </div>
    </div>
  );
};

export const IIDXController = styled(IIDXControllerComponent)`
  display: flex;
  align-items: center;
  justify-content: center;
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
