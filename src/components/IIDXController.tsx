import React from "react";
import styled from "styled-components";
import { ControllerStatus } from "../useController";

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
  background: black;
  border-radius: 50px;
  font-size: 0;
  &.up {
    background: blue;
  }
  &.down {
    background: red;
  }
`;

const Button: React.FC<{ className?: string; isPressed: boolean }> = ({
  className,
  isPressed,
}) => {
  return <p className={`${className} ${isPressed && "pressed"}`}></p>;
};

const StyledButton = styled(Button)`
  border: 1px solid black;
  width: 40px;
  height: 70px;
  color: red;
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
          <StyledButton isPressed={key.isPressed} key={i} />
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
    padding-left: 50px;
    p:nth-child(odd) {
      background: white;
      margin-top: 100px;
      margin-left: -30px;
    }
    p:nth-child(even) {
      background: black;
      margin-left: -30px;
    }
    p.pressed {
      background: blue;
    }
  }
`;
