import React from "react";
import { ControllerStatus } from "../types/controller";
import { IIDXController } from "./IIDXController";

interface IIDXControllerDPProps {
  className?: string;
  player1Status: ControllerStatus | null;
  player2Status: ControllerStatus | null;
  mode: 'SP' | 'DP';
  currentPlayerSide?: '1P' | '2P';  // SPモード時に使用
}

export const IIDXControllerDP: React.FC<IIDXControllerDPProps> = ({ 
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
      <div className={`flex items-center justify-center ${className || ""}`}>
        <IIDXController 
          status={status} 
          is2P={is2P}
          disabled={!status}
        />
      </div>
    );
  }

  // DPモードの場合は両方のコントローラーを表示
  return (
    <div className={`w-[760px] flex items-center justify-center gap-[30px] ${className || ""}`}>
      <IIDXController 
        status={player1Status} 
        is2P={false}
        disabled={!player1Status}
      />
      <IIDXController 
        status={player2Status} 
        is2P={true}
        disabled={!player2Status}
      />
    </div>
  );
};