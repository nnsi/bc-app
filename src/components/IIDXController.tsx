import React from "react";
import styled from "styled-components";
import { ControllerStatus } from "../hooks/useController";

const Scratch: React.FC<{ className?: string; state: number }> = ({
  className,
  state,
}) => (
  <p
    className={`${className} ${
      state === 1 ? "up" : state === -1 ? "down" : "neutral"
    }`}
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
  transition: 0.1s;
  &.up {
    background: #6666ff;
    box-shadow: 0px 0px 5px 5px rgba(128, 128, 255, 0.25);
  }
  &.down {
    background: #ff6666;
    box-shadow: 0px 0px 5px 5px rgba(255, 128, 128, 0.25);
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
  transition: 0.1s;
  &.even {
    background: #999;
  }
  &.odd {
    background: #666;
  }
  &.pressed {
    background: #ccffff;
    box-shadow: 0px 0px 5px 5px rgba(255, 255, 255, 0.25);
  }
`;

const IIDXControllerComponent: React.FC<{
  className?: string;
  status: ControllerStatus;
}> = ({ className, status }) => {
  return (
    <div className={className}>
      <StyledScratch state={status.scratch.state} />
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
  .keys {
    display: flex;
    gap: 20px;
    p:nth-child(odd) {
      margin-top: 100px;
      margin-left: -30px;
    }
    p:nth-child(even) {
      margin-left: -30px;
    }
  }
`;
