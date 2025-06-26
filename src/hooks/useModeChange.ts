import { useEffect, useRef } from 'react';
import { determineModeChangeActions } from '../utils/appBusinessLogic';

interface UseModeChangeProps {
  playMode: 'SP' | 'DP';
  isAutoAssigning: boolean;
  cancelAssignment: () => void;
  resetCount: () => void;
  resetGamepad: () => void;
  resetDPGamepadMapping: () => void;
  startAutoAssignment: () => void;
}

export const useModeChange = ({
  playMode,
  isAutoAssigning,
  cancelAssignment,
  resetCount,
  resetGamepad,
  resetDPGamepadMapping,
  startAutoAssignment,
}: UseModeChangeProps) => {
  const prevModeRef = useRef(playMode);
  
  useEffect(() => {
    if (prevModeRef.current !== playMode) {
      console.log('[App] Mode changed from', prevModeRef.current, 'to', playMode);
      
      const actions = determineModeChangeActions(
        prevModeRef.current,
        playMode,
        isAutoAssigning
      );
      
      if (actions.shouldCancelAutoAssignment) {
        cancelAssignment();
      }
      if (actions.shouldResetCount) {
        resetCount();
      }
      if (actions.shouldResetGamepad) {
        resetGamepad();
      }
      if (actions.shouldResetDPMapping) {
        resetDPGamepadMapping();
      }
      if (actions.shouldStartAutoAssignment) {
        startAutoAssignment();
      }
      
      prevModeRef.current = playMode;
    }
  }, [playMode, resetGamepad, isAutoAssigning, cancelAssignment, resetCount, resetDPGamepadMapping, startAutoAssignment]);
};