import { useState, useEffect } from 'react';
import { transformGamepadData } from '../utils/appBusinessLogic';
import { useGamepadPlugin } from './useGamepadPlugin';
import type { GamepadInfo } from '../types/gamepad';

export const useGamepadInfo = () => {
  const [gamepads, setGamepads] = useState<GamepadInfo[]>([]);
  const { getGamepads } = useGamepadPlugin();

  useEffect(() => {
    if (!getGamepads) return;

    const checkGamepads = () => {
      try {
        const currentGamepads = [...getGamepads()];
        const gamepadInfos = transformGamepadData(currentGamepads);
        setGamepads(gamepadInfos);
      } catch (err) {
        console.error('Failed to get gamepads:', err);
      }
    };

    checkGamepads();
    const interval = setInterval(checkGamepads, 500);
    return () => clearInterval(interval);
  }, [getGamepads]);

  return gamepads;
};
