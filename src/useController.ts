import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { getGamepads } from "tauri-plugin-gamepad-api";

type KeyStatus = {
  isPressed: boolean;
  beforeState: boolean;
  beforeStateTime: number;
};

type ScratchStatus = {
  currentAxes: number;
  previousAxes: number | undefined;
  fixedStateTime: number;
  state: -1 | 0 | 1;
};

export type ControllerStatus = {
  keys: KeyStatus[];
  scratch: ScratchStatus;
};

const KEY_MAPPING = {
  "5": 0,
  "1": 1,
  "2": 2,
  "4": 3,
  "7": 4,
  "8": 5,
  "9": 6,
};

// スクラッチの状態を保存するミリ秒数
const FIXED_SCRATCH_STATE_TIME = 300;

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

    // 5,1,2,4,7,8,9
    const keyStatus = pad.buttons.reduce((arr, button, i) => {
      // 1鍵がbutton5なので先頭に配置
      if (i === 5) {
        arr.unshift({
          isPressed: button.pressed,
          beforeState:
            controllerStatus?.keys[KEY_MAPPING[i]].isPressed ?? false,
          beforeStateTime: new Date().getTime(),
        });
      }
      // 他の鍵盤は順番通り
      if (i === 1 || i === 2 || i === 4 || i === 7 || i === 8 || i === 9) {
        arr.push({
          isPressed: button.pressed,
          beforeState:
            controllerStatus?.keys[KEY_MAPPING[i]].isPressed ?? false,
          beforeStateTime: new Date().getTime(),
        });
      }
      return arr;
    }, [] as KeyStatus[]);

    const fixedStateScratchTime =
      pad.axes[1] != controllerStatus?.scratch.currentAxes
        ? FIXED_SCRATCH_STATE_TIME
        : Math.max(controllerStatus.scratch.fixedStateTime - 10, 0);
    const scratchStatus = {
      currentAxes: pad.axes[1],
      previousAxes: controllerStatus?.scratch.currentAxes,
      fixedStateTime: fixedStateScratchTime,
      state:
        fixedStateScratchTime === 0
          ? controllerStatus?.scratch.state || 0
          : fixedStateScratchTime === FIXED_SCRATCH_STATE_TIME ||
            fixedStateScratchTime === 10
          ? getScratchType({
              current: pad.axes[1],
              prev: controllerStatus?.scratch.currentAxes || 0,
            })
          : controllerStatus?.scratch.state || 0,
    };

    const status: ControllerStatus = {
      keys: keyStatus,
      scratch: scratchStatus,
    };
    setControllerStatus(status);
  }

  const savedCallback = useRef(captureControllerStatus);

  useLayoutEffect(() => {
    savedCallback.current = captureControllerStatus;
  }, [captureControllerStatus]);

  useEffect(() => {
    const timerId = setInterval(() => savedCallback.current(), 10);

    return () => {
      clearInterval(timerId);
    };
  }, [index]);

  return controllerStatus;
};
export default useController;
