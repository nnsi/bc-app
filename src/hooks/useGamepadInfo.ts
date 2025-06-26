import { useState, useEffect } from 'react';
import { transformGamepadData } from '../utils/appBusinessLogic';

export const useGamepadInfo = () => {
  const [gamepads, setGamepads] = useState<Array<{ index: number; id: string }>>([]);
  
  useEffect(() => {
    const checkGamepads = async () => {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        try {
          const gamepadModule = await import('tauri-plugin-gamepad-api');
          const currentGamepads = [...gamepadModule.getGamepads()];
          const gamepadInfos = transformGamepadData(currentGamepads);
          setGamepads(gamepadInfos);
        } catch (err) {
          console.error('Failed to get gamepads:', err);
        }
      }
    };
    
    checkGamepads();
    const interval = setInterval(checkGamepads, 500);
    return () => clearInterval(interval);
  }, []);
  
  return gamepads;
};