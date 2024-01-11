import { useEffect, useState } from "react";
import { getGamepads } from "tauri-plugin-gamepad-api";
import useController from "./hooks/useController";
import { IIDXController } from "./components/IIDXController";
import { BeatStatus } from "./components/BeatStatus";
import { appWindow } from "@tauri-apps/api/window";

function App() {
  const [gamepads, setGamepads] = useState<Gamepad[] | any[]>([]);
  const [selectedGamepadIndex, setSelectedGamepadIndex] = useState(-1);
  const { controllerStatus, resetCount } = useController(selectedGamepadIndex);

  const updateGamepads = () => {
    setGamepads([...getGamepads()].filter(Boolean));
  };

  useEffect(() => {
    window.addEventListener("gamepadconnected", updateGamepads);
    window.addEventListener("gamepaddisconnected", updateGamepads);

    // 初回ロード時にゲームパッドの状態を更新
    updateGamepads();

    return () => {
      window.removeEventListener("gamepadconnected", updateGamepads);
      window.removeEventListener("gamepaddisconnected", updateGamepads);
    };
  }, []);

  const handleGamepadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGamepadIndex(parseInt(e.target.value, 10));
  };

  const close = () => {
    appWindow.close();
  };

  return (
    <>
      <header
        data-tauri-drag-region
        style={{
          borderBottom: "1px solid white",
          padding: "2px 0 2px 5px",
          fontSize: "10px",
          cursor: "default",
        }}
      >
        打鍵カウンタ
        <span onClick={close}>x</span>
      </header>
      <div className="container">
        <select
          onChange={handleGamepadChange}
          value={selectedGamepadIndex}
          style={{ width: "100%", maxWidth: "100%", marginBottom: "5px" }}
        >
          <option value="-1">コントローラーを選択してください</option>
          {gamepads.map((gamepad: Gamepad) => (
            <option key={gamepad.index} value={gamepad.index}>
              {gamepad.id}
            </option>
          ))}
        </select>
        {controllerStatus && <IIDXController status={controllerStatus} />}
        {controllerStatus && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <BeatStatus status={controllerStatus} />
            <p style={{ marginTop: 0 }}>
              <button
                onClick={() => resetCount()}
                style={{
                  background: "transparent",
                  border: "1px solid #999",
                  color: "white",
                }}
              >
                reset
              </button>
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
