import React from 'react';
import { ErrorMessage } from './ErrorMessage';
import { GamepadSelector } from './GamepadSelector';
import { ConnectionSettings } from './ConnectionSettings';
import { DPGamepadSelector } from './DPGamepadSelector';
import { ControllerDisplay } from './ControllerDisplay';
import { IIDXControllerDP } from './IIDXControllerDP';
import { BeatStatusDP } from './BeatStatusDP';
import type { ControllerStatus, DPControllerStatus } from '../types/controller';

interface AppContentProps {
  wsError: Error | null;
  connectWebSocket: () => void;
  isReceiveMode: boolean;
  displayStatus: ControllerStatus | DPControllerStatus | null;
  playMode: 'SP' | 'DP';
  spControllerStatus: ControllerStatus | null;
  dpControllerStatus: DPControllerStatus | null;
  gamepadError: string | null;
  ipAddress: string;
  onIpAddressChange: (value: string) => void;
  onReceiveModeClick: () => void;
  dp1PGamepadIndex: number | null;
  dp2PGamepadIndex: number | null;
  assignmentError: string | null;
  assignments: {
    player1: { index: number; id: string } | null;
    player2: { index: number; id: string } | null;
  };
  isAutoAssigning: boolean;
}

export const AppContent: React.FC<AppContentProps> = ({
  wsError,
  connectWebSocket,
  isReceiveMode,
  displayStatus,
  playMode,
  spControllerStatus,
  dpControllerStatus,
  gamepadError,
  ipAddress,
  onIpAddressChange,
  onReceiveModeClick,
  dp1PGamepadIndex,
  dp2PGamepadIndex,
  assignmentError,
  assignments,
  isAutoAssigning,
}) => {
  return (
    <div className="p-[5px] mt-4">
      {wsError && (
        <ErrorMessage
          message={wsError.message}
          showRetry={true}
          onRetry={connectWebSocket}
        />
      )}
      
      {/* コントローラー未選択時の画面（受信モードでは表示しない） */}
      {!isReceiveMode && !displayStatus && (
        <>
          {/* SPモード */}
          {playMode === 'SP' && !spControllerStatus && (
            <div className="flex flex-col gap-4">
              <GamepadSelector error={gamepadError} />
              <ConnectionSettings
                ipAddress={ipAddress}
                onIpAddressChange={onIpAddressChange}
                onReceiveModeClick={onReceiveModeClick}
              />
            </div>
          )}
          
          {/* DPモード */}
          {playMode === 'DP' && (!dpControllerStatus || 
            dp1PGamepadIndex === null || 
            dp2PGamepadIndex === null) && (
            <>
              <DPGamepadSelector 
                error={assignmentError}
                assignments={assignments}
                isAssigning={isAutoAssigning}
              />
              <ConnectionSettings
                ipAddress={ipAddress}
                onIpAddressChange={onIpAddressChange}
                onReceiveModeClick={onReceiveModeClick}
              />
            </>
          )}
        </>
      )}
      
      {/* 受信モードの状態表示 */}
      {isReceiveMode && !displayStatus && (
        <div className="text-center p-5 text-[#4a9eff] text-[16px]">
          受信モードで待機中...
        </div>
      )}
      
      {/* コントローラー表示 */}
      {displayStatus && (
        <>
          {/* SPモードまたは旧ControllerStatus形式 */}
          {(!('mode' in displayStatus) || (displayStatus.mode !== 'DP')) && (
            <>
              <ControllerDisplay 
                status={displayStatus as ControllerStatus} 
              />
            </>
          )}
          
          {/* DPモード */}
          {'mode' in displayStatus && displayStatus.mode === 'DP' && (
            <>
              <IIDXControllerDP
                player1Status={displayStatus.player1}
                player2Status={displayStatus.player2}
                mode="DP"
                currentPlayerSide="1P"
              />
              <div className="mt-5">
                <BeatStatusDP
                  player1Status={displayStatus.player1}
                  player2Status={displayStatus.player2}
                  mode="DP"
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};