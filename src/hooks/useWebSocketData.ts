import { useEffect, useRef } from 'react';
import { hasSPControllerChanged, hasDPControllerChanged } from '../utils/controllerCompare';
import type { ControllerStatus, DPControllerStatus } from '../types/controller';

interface UseWebSocketDataProps {
  ws: WebSocket | null;
  isReceiveMode: boolean;
  playMode: 'SP' | 'DP';
  spControllerStatus: ControllerStatus | null;
  dpControllerStatus: DPControllerStatus | null;
  sendSP: (data: ControllerStatus) => void;
  sendDP: (data: DPControllerStatus) => void;
}

export const useWebSocketData = ({
  ws,
  isReceiveMode,
  playMode,
  spControllerStatus,
  dpControllerStatus,
  sendSP,
  sendDP,
}: UseWebSocketDataProps) => {
  const prevControllerStatusRef = useRef<ControllerStatus | null>(null);
  const prevDPControllerStatusRef = useRef<DPControllerStatus | null>(null);
  
  useEffect(() => {
    if (ws && !isReceiveMode) {
      if (playMode === 'SP' && spControllerStatus) {
        const hasChanged = hasSPControllerChanged(prevControllerStatusRef.current, spControllerStatus);
        
        if (hasChanged) {
          sendSP(spControllerStatus);
          prevControllerStatusRef.current = spControllerStatus;
        }
      } else if (playMode === 'DP' && dpControllerStatus) {
        const hasChanged = hasDPControllerChanged(prevDPControllerStatusRef.current, dpControllerStatus);
        
        if (hasChanged) {
          sendDP(dpControllerStatus);
          prevDPControllerStatusRef.current = dpControllerStatus;
        }
      }
    }
  }, [ws, spControllerStatus, dpControllerStatus, isReceiveMode, sendSP, sendDP, playMode]);
};