import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { getGamepads } from "tauri-plugin-gamepad-api";

type KeyStatus = {
  isPressed: boolean;
  isChangedState: boolean;
  beforeState: boolean;
  beforeStateTime: number;
  releaseTime: number;
  strokeCount: number;
};

type ScratchStatus = {
  currentAxes: number;
  previousAxes: number | undefined;
  fixedStateTime: number;
  state: -1 | 0 | 1;
  count: number;
};

type Record = {
  releaseTimes: number[];
  pressedTimes: number[];
};

export type ControllerStatus = {
  keys: KeyStatus[];
  scratch: ScratchStatus;
  record: Record;
};

const KEY_MAPPING = {
  "5": 0,
  "1": 1,
  "2": 2,
  "4": 3,
  "7": 4,
  "8": 5,
  "9": 6,
} as const;

// スクラッチの状態を保存するミリ秒数
const FIXED_SCRATCH_STATE_TIME = 200;

// ループのミリ秒数
const LOOP_MILLI_SECONDS = 5;

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

const useController = (index: number) => {
  const [controllerStatus, setControllerStatus] = useState<ControllerStatus>();

  function captureControllerStatus(): void {
    // コントローラーが指定されていなかったら処理終了
    if (index < 0) return setControllerStatus(undefined);
    const pad = getGamepads()[index];
    if (!pad) return;

    const newReleaseTimes: number[] = [];
    const newPressedTimes: number[] = [];
    const unixTime = new Date().getTime();

    const keyStatus = pad.buttons.reduce((arr, button, i) => {
      // マッピングに存在しないボタンはスルー
      if (!(i in KEY_MAPPING)) return arr;

      const prevState =
        controllerStatus?.keys[
          KEY_MAPPING[i as unknown as keyof typeof KEY_MAPPING]
        ];
      const isChangedState = button.pressed !== prevState?.isPressed;

      const strokeCount =
        button.pressed && isChangedState
          ? prevState!.strokeCount + 1
          : prevState?.strokeCount ?? 0;

      const status = {
        isPressed: button.pressed,
        isChangedState,
        beforeState: prevState?.isPressed ?? false,
        beforeStateTime: isChangedState
          ? unixTime ?? 0
          : prevState?.beforeStateTime ?? 0,
        releaseTime:
          prevState && isChangedState && button.pressed === false
            ? unixTime - (prevState?.beforeStateTime ?? 0)
            : prevState?.releaseTime ?? 0,
        strokeCount,
      };

      // リリース時にnewReleaseTimesに突っ込む
      if (prevState && isChangedState && button.pressed === false) {
        newReleaseTimes.push(status.releaseTime);
      }
      // 打鍵時にnewPressedTimesに突っ込む
      if (isChangedState && status.isPressed) {
        newPressedTimes.push(unixTime);
      }

      // 1鍵だけbutton5なので先頭に配置
      // 1~7鍵:5,1,2,4,7,8,9
      if (i === 5) {
        arr.unshift(status);
      } else {
        arr.push(status);
      }
      return arr;
    }, [] as KeyStatus[]);

    const prevScratchState = controllerStatus?.scratch;
    const fixedStateScratchTime =
      pad.axes[1] != prevScratchState?.currentAxes
        ? FIXED_SCRATCH_STATE_TIME
        : Math.max(prevScratchState?.fixedStateTime - LOOP_MILLI_SECONDS, 0);
    const scratchState = getScratchType({
      current: pad.axes[1],
      prev: controllerStatus?.scratch.currentAxes ?? pad.axes[1],
    });
    const scratchStateType =
      fixedStateScratchTime === 0
        ? prevScratchState?.state || 0
        : fixedStateScratchTime === FIXED_SCRATCH_STATE_TIME ||
          fixedStateScratchTime === 10
        ? scratchState
        : prevScratchState?.state || 0;
    const scratchCount =
      scratchState !== 0 && prevScratchState?.state !== scratchStateType
        ? (prevScratchState?.count ?? 0) + 1
        : prevScratchState?.count ?? 0;

    const scratchStatus = {
      currentAxes: pad.axes[1],
      previousAxes: controllerStatus?.scratch.currentAxes,
      fixedStateTime: fixedStateScratchTime,
      state: scratchStateType,
      beforeState: prevScratchState?.state ?? 0,
      count: scratchCount,
    };

    // ボタンを叩いた時間（UNIXTIME）と、離した時間（ミリ秒）を保存する
    // 200ミリ秒以上はCNとみなして保存しない
    const filteredReleaseTimes = newReleaseTimes.filter((time) => time < 200);
    const record: Record = {
      releaseTimes: controllerStatus
        ? [...filteredReleaseTimes, ...controllerStatus.record.releaseTimes]
        : filteredReleaseTimes,
      pressedTimes: controllerStatus
        ? [...newPressedTimes, ...controllerStatus.record.pressedTimes]
        : newPressedTimes,
    };

    record.releaseTimes.length =
      record.releaseTimes.length > 2000 ? 2000 : record.releaseTimes.length;

    record.pressedTimes.length =
      record.pressedTimes.length > 500 ? 500 : record.pressedTimes.length;

    setControllerStatus({
      keys: keyStatus,
      scratch: scratchStatus,
      record: record,
    });
  }

  // setInterval内のコールバック関数でStateの値を参照できるようにする
  // https://zenn.dev/uhyo/articles/useeffect-taught-by-extremist
  const savedCallback = useRef(captureControllerStatus);

  useLayoutEffect(() => {
    savedCallback.current = captureControllerStatus;
  }, [captureControllerStatus]);

  useEffect(() => {
    const timerId = setInterval(
      () => savedCallback.current(),
      LOOP_MILLI_SECONDS
    );

    return () => {
      clearInterval(timerId);
    };
  }, [index]);

  const resetCount = () => {
    setControllerStatus(undefined);
  };

  return { controllerStatus, resetCount };
};
export default useController;
