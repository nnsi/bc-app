/**
 * 単一コントローラーの状態管理フック
 * useDPController.ts の captureControllerStatus を抽出・共通化したもの。
 * SP/DPどちらでも同じhookを使い、DPモードでは2つインスタンス化する。
 */

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import type { ControllerStatus, KeyStatus, ScratchStatus, Record } from '../types/controller';
import { KEY_MAPPING, CONTROLLER_CONSTANTS } from '../types/controller';

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

interface UseControllerReturn {
  /** コントローラー状態 */
  status: ControllerStatus | undefined;
  /** カウントをリセット */
  resetCount: () => void;
}

/**
 * 単一コントローラーの状態をポーリングするフック
 *
 * @param gamepadIndex ゲームパッドインデックス（< 0 ならポーリング無効）
 */
export const useController = (gamepadIndex: number): UseControllerReturn => {
  const [status, setStatus] = useState<ControllerStatus>();
  const [getGamepads, setGetGamepads] = useState<(() => (Gamepad | null)[]) | null>(null);

  const statusRef = useRef<ControllerStatus>();
  const gamepadIndexRef = useRef(gamepadIndex);

  // gamepadIndexの変更をrefで追跡
  useEffect(() => {
    gamepadIndexRef.current = gamepadIndex;
  }, [gamepadIndex]);

  // 状態が更新されたらRefも更新
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // 単一コントローラーの状態を取得する関数
  const captureControllerStatus = useCallback((
    currentGamepadIndex: number,
    prevStatus: ControllerStatus | undefined
  ): ControllerStatus | undefined => {
    if (currentGamepadIndex < 0 || !isTauriAvailable() || !getGamepads) {
      return undefined;
    }

    let pad;
    try {
      pad = getGamepads()[currentGamepadIndex];
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

      const keyState: KeyStatus = {
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
        newReleaseTimes.push(keyState.releaseTime);
        newKeyReleaseTimes[keyIndex].push(keyState.releaseTime);
      }

      if (isChangedState && keyState.isPressed) {
        newPressedTimes.push(unixTime);
      }

      if (i === 5) {
        arr.unshift(keyState);
      } else {
        arr.push(keyState);
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
      let diff = pad.axes[1] - prevStatus.scratch.currentAxes;

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
    const isStateChanged = prevScratchState && prevScratchState.state !== scratchStateType;

    if (scratchStateType !== 0) {
      if (!isStateChanged && prevStatus?.scratch.strokeDistance) {
        strokeDistance = prevStatus.scratch.strokeDistance + rotationDistance;
      } else {
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

    if (isStateChanged && prevScratchState && prevScratchState.strokeDistance > 0) {
      const normalizedStrokeDistance = prevScratchState.strokeDistance * 43.3;

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
    if (record.releaseTimes.length > CONTROLLER_CONSTANTS.MAX_RELEASE_TIMES) {
      record.releaseTimes = record.releaseTimes.slice(0, CONTROLLER_CONSTANTS.MAX_RELEASE_TIMES);
    }
    record.keyReleaseTimes = record.keyReleaseTimes.map(times =>
      times.length > CONTROLLER_CONSTANTS.MAX_KEY_RELEASE_TIMES
        ? times.slice(0, CONTROLLER_CONSTANTS.MAX_KEY_RELEASE_TIMES)
        : times
    );
    record.pressedTimes.length = Math.min(record.pressedTimes.length, CONTROLLER_CONSTANTS.MAX_PRESSED_TIMES);
    record.scratchTimes.length = Math.min(record.scratchTimes.length, CONTROLLER_CONSTANTS.MAX_SCRATCH_TIMES);
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
  const updateController = useCallback(() => {
    const currentIndex = gamepadIndexRef.current;
    if (currentIndex < 0) return;

    const newStatus = captureControllerStatus(currentIndex, statusRef.current);
    setStatus(newStatus);
  }, [captureControllerStatus]);

  const savedCallback = useRef(updateController);

  useLayoutEffect(() => {
    savedCallback.current = updateController;
  }, [updateController]);

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

  const resetCount = useCallback(() => {
    setStatus(undefined);
  }, []);

  return {
    status,
    resetCount,
  };
};
