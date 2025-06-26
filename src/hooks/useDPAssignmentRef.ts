import { useRef, useEffect } from 'react';

interface UseDPAssignmentRefProps {
  dp1PGamepadIndex: number | null;
  dp2PGamepadIndex: number | null;
}

export const useDPAssignmentRef = ({ dp1PGamepadIndex, dp2PGamepadIndex }: UseDPAssignmentRefProps) => {
  const dpAssignmentRef = useRef<{ player1: number | null; player2: number | null }>({
    player1: dp1PGamepadIndex,
    player2: dp2PGamepadIndex,
  });
  
  useEffect(() => {
    dpAssignmentRef.current = {
      player1: dp1PGamepadIndex,
      player2: dp2PGamepadIndex,
    };
  }, [dp1PGamepadIndex, dp2PGamepadIndex]);
  
  return dpAssignmentRef;
};