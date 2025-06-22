/**
 * ダブルプレイモード対応のコントローラー管理フック
 */

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import type { ControllerStatus, KeyStatus, ScratchStatus, Record, DPControllerStatus } from '../types/controller';
import { KEY_MAPPING, CONTROLLER_CONSTANTS } from '../types/controller';
import { PlayMode } from '../types/controller';

// Tauri型定義の拡張
declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

// Tauriが利用可能かチェック
const isTauriAvailable = () => {
  return typeof window !== 'undefined' && 
         typeof window.__TAURI_INTERNALS__ !== 'undefined';
};

function getScratchType({
  current,
  prev,
}: {
  current: number;
  prev: number;
}): -1 | 0 | 1 {
  if (current === prev) return 0;
  if (current > 0.9 && prev < -0.9) return -1;
  if (current > prev || (current < -0.9 && prev > 0.9)) return 1;
  return -1;
}

interface UseDPControllerProps {
  /** プレイモード */
  playMode: PlayMode;
  /** SPモード時のゲームパッドインデックス */
  spGamepadIndex: number;
  /** DPモード時の1P側ゲームパッドインデックス */
  dp1PGamepadIndex: number | null;
  /** DPモード時の2P側ゲームパッドインデックス */
  dp2PGamepadIndex: number | null;
}

interface UseDPControllerReturn {
  /** SPモード時のコントローラー状態 */
  spControllerStatus: ControllerStatus | undefined;
  /** DPモード時のコントローラー状態 */
  dpControllerStatus: DPControllerStatus | undefined;
  /** カウントをリセット */
  resetCount: () => void;
}

/**
 * SPモードとDPモードの両方に対応したコントローラー管理フック
 */
export const useDPController = ({
  playMode,
  spGamepadIndex,
  dp1PGamepadIndex,
  dp2PGamepadIndex,
}: UseDPControllerProps): UseDPControllerReturn => {
  const [spControllerStatus, setSPControllerStatus] = useState<ControllerStatus>();
  const [player1Status, setPlayer1Status] = useState<ControllerStatus>();
  const [player2Status, setPlayer2Status] = useState<ControllerStatus>();
  const [getGamepads, setGetGamepads] = useState<(() => (Gamepad | null)[]) | null>(null);

  // 単一コントローラーの状態を取得する関数
  const captureControllerStatus = useCallback((
    gamepadIndex: number,
    prevStatus: ControllerStatus | undefined
  ): ControllerStatus | undefined => {
    if (gamepadIndex < 0 || !isTauriAvailable() || !getGamepads) {
      return undefined;
    }

    let pad;
    try {
      pad = getGamepads()[gamepadIndex];
    } catch (error) {
      console.warn("Gamepad access failed:", error);
      return undefined;
    }

    if (!pad) return undefined;

    const newReleaseTimes: number[] = [];
    const newKeyReleaseTimes: number[][] = [[], [], [], [], [], [], []];
    const newPressedTimes: number[] = [];
    const newScratchTimes: number[] = [];
    const unixTime = new Date().getTime();

    const keyStatus = pad.buttons.reduce<KeyStatus[]>((arr, button, i) => {
      if (!(i in KEY_MAPPING)) return arr;

      const keyIndex = KEY_MAPPING[i as unknown as keyof typeof KEY_MAPPING];
      const prevState = prevStatus?.keys[keyIndex];
      const isChangedState = button.pressed !== prevState?.isPressed;

      const strokeCount =
        button.pressed && isChangedState
          ? (prevState?.strokeCount ?? 0) + 1
          : prevState?.strokeCount ?? 0;

      const status: KeyStatus = {
        isPressed: button.pressed,
        isChangedState,
        beforeState: prevState?.isPressed ?? false,
        beforeStateTime: isChangedState
          ? unixTime
          : prevState?.beforeStateTime ?? 0,
        releaseTime:
          prevState && isChangedState && button.pressed === false
            ? unixTime - (prevState?.beforeStateTime ?? 0)
            : prevState?.releaseTime ?? 0,
        strokeCount,
      };

      if (prevState && isChangedState && button.pressed === false) {
        newReleaseTimes.push(status.releaseTime);
        newKeyReleaseTimes[keyIndex].push(status.releaseTime);
      }

      if (isChangedState && status.isPressed) {
        newPressedTimes.push(unixTime);
      }

      if (i === 5) {
        arr.unshift(status);
      } else {
        arr.push(status);
      }
      return arr;
    }, [] as KeyStatus[]);

    const prevScratchState = prevStatus?.scratch;
    const fixedStateScratchTime =
      pad.axes[1] != prevScratchState?.currentAxes
        ? CONTROLLER_CONSTANTS.FIXED_SCRATCH_STATE_TIME
        : Math.max((prevScratchState?.fixedStateTime ?? 0) - CONTROLLER_CONSTANTS.LOOP_MILLI_SECONDS, 0);
    
    const scratchState = getScratchType({
      current: pad.axes[1],
      prev: prevStatus?.scratch.currentAxes ?? pad.axes[1],
    });

    const scratchStateType =
      fixedStateScratchTime === 0
        ? prevScratchState?.state || 0
        : fixedStateScratchTime === CONTROLLER_CONSTANTS.FIXED_SCRATCH_STATE_TIME ||
          fixedStateScratchTime === 10
        ? scratchState
        : prevScratchState?.state || 0;

    const scratchCount =
      scratchState !== 0 && prevScratchState?.state !== scratchStateType
        ? (prevScratchState?.count ?? 0) + 1
        : prevScratchState?.count ?? 0;

    if (scratchState !== 0 && prevScratchState?.state !== scratchStateType) {
      newScratchTimes.push(unixTime);
    }

    // スクラッチ回転距離の計算
    let rotationDistance = 0;
    if (prevStatus?.scratch.currentAxes !== undefined && pad.axes[1] !== prevStatus.scratch.currentAxes) {
      // 軸の値の差分を計算（-1から1の範囲）
      let diff = pad.axes[1] - prevStatus.scratch.currentAxes;
      
      // 境界を跨いだ場合の処理（例：0.9から-0.9への移動）
      if (Math.abs(diff) > 1) {
        if (diff > 0) {
          diff = diff - 2;
        } else {
          diff = diff + 2;
        }
      }
      
      rotationDistance = Math.abs(diff);
      
    }

    // ストローク距離の計算
    let strokeDistance = 0;
    
    // スクラッチ状態が変化した場合（方向転換または停止）
    const isStateChanged = prevScratchState && prevScratchState.state !== scratchStateType;
    
    if (scratchStateType !== 0) {
      if (!isStateChanged && prevStatus?.scratch.strokeDistance) {
        // 同じ方向への回転が継続中は累積距離を加算
        strokeDistance = prevStatus.scratch.strokeDistance + rotationDistance;
      } else {
        // 新しいストロークの開始
        strokeDistance = rotationDistance;
      }
    }
    
    const scratchStatus: ScratchStatus = {
      currentAxes: pad.axes[1],
      previousAxes: prevStatus?.scratch.currentAxes,
      fixedStateTime: fixedStateScratchTime,
      state: scratchStateType,
      count: scratchCount,
      rotationDistance: rotationDistance,
      rotationTime: unixTime,
      strokeDistance: strokeDistance,
    };

    const filteredReleaseTimes = newReleaseTimes.filter((time) => time < CONTROLLER_CONSTANTS.LONG_NOTE_THRESHOLD);
    const filteredKeyReleaseTimes = newKeyReleaseTimes.map(times => 
      times.filter(time => time < CONTROLLER_CONSTANTS.LONG_NOTE_THRESHOLD)
    );

    // スクラッチ回転距離の記録（ストローク単位）
    const newScratchRotationDistances: number[] = [];
    
    // スクラッチ状態が変化した場合（方向転換または停止）、前回のストローク距離を記録
    if (isStateChanged && prevScratchState && prevScratchState.strokeDistance > 0) {
      // 一周を100とするため、移動距離を正規化
      // 実測値: 一周で累積距離約2.31なので、100/2.31≈43.3
      const normalizedStrokeDistance = prevScratchState.strokeDistance * 43.3;
      
      // 前回の記録から200ms以内の場合のみ記録
      const elapsedTime = unixTime - prevScratchState.rotationTime;
      if (elapsedTime < CONTROLLER_CONSTANTS.LONG_NOTE_THRESHOLD) {
        newScratchRotationDistances.push(normalizedStrokeDistance);
      }
    }

    const record: Record = {
      releaseTimes: prevStatus
        ? [...filteredReleaseTimes, ...prevStatus.record.releaseTimes]
        : filteredReleaseTimes,
      keyReleaseTimes: prevStatus
        ? filteredKeyReleaseTimes.map((times, index) => 
            [...times, ...(prevStatus.record.keyReleaseTimes?.[index] || [])])
        : filteredKeyReleaseTimes,
      pressedTimes: prevStatus
        ? [...newPressedTimes, ...prevStatus.record.pressedTimes]
        : newPressedTimes,
      scratchTimes: prevStatus
        ? [...newScratchTimes, ...(prevStatus.record.scratchTimes || [])]
        : newScratchTimes,
      scratchRotationDistances: prevStatus
        ? [...newScratchRotationDistances, ...prevStatus.record.scratchRotationDistances]
        : newScratchRotationDistances,
    };

    // 配列のサイズ制限
    record.releaseTimes.length = Math.min(record.releaseTimes.length, CONTROLLER_CONSTANTS.MAX_RELEASE_TIMES);
    record.keyReleaseTimes = record.keyReleaseTimes.map(times => 
      times.slice(0, CONTROLLER_CONSTANTS.MAX_RELEASE_TIMES)
    );
    record.pressedTimes.length = Math.min(record.pressedTimes.length, CONTROLLER_CONSTANTS.MAX_PRESSED_TIMES);
    record.scratchTimes.length = Math.min(record.scratchTimes.length, CONTROLLER_CONSTANTS.MAX_SCRATCH_TIMES);
    // スクラッチ回転距離は最新1件のみ保持
    if (record.scratchRotationDistances.length > 1) {
      record.scratchRotationDistances = record.scratchRotationDistances.slice(0, 1);
    }

    return {
      keys: keyStatus,
      scratch: scratchStatus,
      record: record,
    };
  }, [getGamepads]);

  // メインの更新関数
  const updateControllers = useCallback(() => {
    if (playMode === 'SP') {
      const status = captureControllerStatus(spGamepadIndex, spControllerStatus);
      setSPControllerStatus(status);
      setPlayer1Status(undefined);
      setPlayer2Status(undefined);
    } else {
      // DPモード
      const p1Status = dp1PGamepadIndex !== null 
        ? captureControllerStatus(dp1PGamepadIndex, player1Status)
        : undefined;
      const p2Status = dp2PGamepadIndex !== null
        ? captureControllerStatus(dp2PGamepadIndex, player2Status)
        : undefined;
      
      setPlayer1Status(p1Status);
      setPlayer2Status(p2Status);
      setSPControllerStatus(undefined);
    }
  }, [playMode, spGamepadIndex, dp1PGamepadIndex, dp2PGamepadIndex, 
      spControllerStatus, player1Status, player2Status, captureControllerStatus]);

  const savedCallback = useRef(updateControllers);

  useLayoutEffect(() => {
    savedCallback.current = updateControllers;
  }, [updateControllers]);

  // Gamepadプラグインのロード
  useEffect(() => {
    const loadGamepadPlugin = async () => {
      if (isTauriAvailable()) {
        try {
          const gamepadModule = await import("tauri-plugin-gamepad-api");
          setGetGamepads(() => gamepadModule.getGamepads);
        } catch (error) {
          console.warn("Failed to load gamepad plugin:", error);
        }
      }
    };

    loadGamepadPlugin();
  }, []);

  // メインループ
  useEffect(() => {
    const timerId = setInterval(
      () => savedCallback.current(),
      CONTROLLER_CONSTANTS.LOOP_MILLI_SECONDS
    );

    return () => {
      clearInterval(timerId);
    };
  }, []);

  // DPControllerStatusの生成
  const dpControllerStatus: DPControllerStatus | undefined = 
    playMode === 'DP' ? {
      mode: 'DP',
      player1: player1Status || null,
      player2: player2Status || null,
      timestamp: Date.now(),
    } : undefined;

  const resetCount = useCallback(() => {
    setSPControllerStatus(undefined);
    setPlayer1Status(undefined);
    setPlayer2Status(undefined);
  }, []);

  return {
    spControllerStatus: playMode === 'SP' ? spControllerStatus : undefined,
    dpControllerStatus,
    resetCount,
  };
};