/**
 * 単一コントローラーの状態管理フック
 * useDPController.ts の captureControllerStatus を抽出・共通化したもの。
 * SP/DPどちらでも同じhookを使い、DPモードでは2つインスタンス化する。
 *
 * イベント駆動方式: Tauriゲームパッドプラグインのイベントをトリガーに状態更新。
 * スクラッチ減衰はタイムスタンプベースで計算し、setTimeoutワンショットで停止を検出。
 */

import { useState, useEffect, useCallback } from 'react';
import type { ControllerStatus, KeyStatus, ScratchStatus, Record } from '../types/controller';
import { KEY_MAPPING } from '../types/controller';
import type { ControllerSettings } from '../types/settings';

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
 * 単一コントローラーの状態をイベント駆動で管理するフック
 *
 * @param gamepadIndex ゲームパッドインデックス（< 0 なら無効）
 * @param controllerSettings コントローラー設定（閾値等）
 */
export const useController = (gamepadIndex: number, controllerSettings: ControllerSettings): UseControllerReturn => {
  const [status, setStatus] = useState<ControllerStatus>();
  const [getGamepads, setGetGamepads] = useState<(() => (Gamepad | null)[]) | null>(null);

  // 単一コントローラーの状態を取得する関数（副作用なし）
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
    const now = performance.now();

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
          ? now
          : prevState?.beforeStateTime ?? 0,
        releaseTime:
          prevState && isChangedState && button.pressed === false
            ? now - (prevState?.beforeStateTime ?? 0)
            : prevState?.releaseTime ?? 0,
        strokeCount,
      };

      if (prevState && isChangedState && button.pressed === false) {
        newReleaseTimes.push(keyState.releaseTime);
        newKeyReleaseTimes[keyIndex].push(keyState.releaseTime);
      }

      if (isChangedState && keyState.isPressed) {
        newPressedTimes.push(now);
      }

      if (i === 5) {
        arr.unshift(keyState);
      } else {
        arr.push(keyState);
      }
      return arr;
    }, [] as KeyStatus[]);

    const prevScratchState = prevStatus?.scratch;

    // タイムスタンプベースの fixedStateTime 計算
    const axesChanged = pad.axes[1] !== prevScratchState?.currentAxes;
    const axesChangedAt = axesChanged
      ? now
      : (prevScratchState?.axesChangedAt ?? now);
    const fixedStateScratchTime = axesChanged
      ? controllerSettings.fixedScratchStateTime
      : Math.max(controllerSettings.fixedScratchStateTime - (now - axesChangedAt), 0);

    const scratchState = getScratchType({
      current: pad.axes[1],
      prev: prevStatus?.scratch.currentAxes ?? pad.axes[1],
    });

    const scratchStateType =
      fixedStateScratchTime === 0
        ? 0
        : fixedStateScratchTime === controllerSettings.fixedScratchStateTime ||
          fixedStateScratchTime <= 10
        ? scratchState
        : prevScratchState?.state || 0;

    const scratchCount =
      scratchState !== 0 && prevScratchState?.state !== scratchStateType
        ? (prevScratchState?.count ?? 0) + 1
        : prevScratchState?.count ?? 0;

    if (scratchState !== 0 && prevScratchState?.state !== scratchStateType) {
      newScratchTimes.push(now);
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
      rotationTime: now,
      strokeDistance: strokeDistance,
      axesChangedAt: axesChangedAt,
    };

    const filteredReleaseTimes = newReleaseTimes.filter((time) => time < controllerSettings.longNoteThreshold);
    const filteredKeyReleaseTimes = newKeyReleaseTimes.map(times =>
      times.filter(time => time < controllerSettings.longNoteThreshold)
    );

    // スクラッチ回転距離の記録（ストローク単位）
    const newScratchRotationDistances: number[] = [];

    if (isStateChanged && prevScratchState && prevScratchState.strokeDistance > 0) {
      const normalizedStrokeDistance = prevScratchState.strokeDistance * 43.3;
      newScratchRotationDistances.push(normalizedStrokeDistance);
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
    if (record.releaseTimes.length > controllerSettings.maxReleaseTimes) {
      record.releaseTimes = record.releaseTimes.slice(0, controllerSettings.maxReleaseTimes);
    }
    record.keyReleaseTimes = record.keyReleaseTimes.map(times =>
      times.length > controllerSettings.maxKeyReleaseTimes
        ? times.slice(0, controllerSettings.maxKeyReleaseTimes)
        : times
    );
    record.pressedTimes.length = Math.min(record.pressedTimes.length, controllerSettings.maxPressedTimes);
    record.scratchTimes.length = Math.min(record.scratchTimes.length, controllerSettings.maxScratchTimes);
    if (record.scratchRotationDistances.length > 1) {
      record.scratchRotationDistances = record.scratchRotationDistances.slice(0, 1);
    }

    return {
      keys: keyStatus,
      scratch: scratchStatus,
      record: record,
    };
  }, [getGamepads, controllerSettings]);

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

  // イベント駆動メインループ
  useEffect(() => {
    if (gamepadIndex < 0 || !getGamepads) return;

    let unlistenPromise: Promise<() => void> | undefined;

    if (isTauriAvailable()) {
      const setup = async () => {
        const { listen } = await import('@tauri-apps/api/event');
        return await listen('event', () => {
          setStatus(prev =>
            captureControllerStatus(gamepadIndex, prev) ?? prev
          );
        });
      };
      unlistenPromise = setup();
    }

    return () => {
      unlistenPromise?.then(unlisten => unlisten());
    };
  }, [gamepadIndex, getGamepads, captureControllerStatus]);

  // スクラッチ減衰タイマー（ワンショット）
  // イベントが来ない間もfixedStateTimeを0にするための安全弁
  const scratchFixedStateTime = status?.scratch.fixedStateTime ?? 0;
  const scratchAxesChangedAt = status?.scratch.axesChangedAt ?? 0;

  useEffect(() => {
    if (scratchFixedStateTime <= 0 || gamepadIndex < 0 || !getGamepads) return;

    const timer = setTimeout(() => {
      setStatus(prev => {
        if (!prev) return prev;
        return captureControllerStatus(gamepadIndex, prev) ?? prev;
      });
    }, scratchFixedStateTime + 1);

    return () => clearTimeout(timer);
  }, [scratchFixedStateTime, scratchAxesChangedAt, gamepadIndex, getGamepads, captureControllerStatus]);

  const resetCount = useCallback(() => {
    setStatus(undefined);
  }, []);

  return {
    status,
    resetCount,
  };
};
