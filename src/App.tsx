import { useEffect, useState } from "react";
import { getGamepads } from "tauri-plugin-gamepad-api";
import useController from "./hooks/useController";
import { IIDXController } from "./components/IIDXController";
import { BeatStatus } from "./components/BeatStatus";
import { appWindow } from "@tauri-apps/api/window";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";

function App() {
  const [gamepads, setGamepads] = useState<Gamepad[] | any[]>([]);
  const [selectedGamepadIndex, setSelectedGamepadIndex] = useState(-1);
  const { controllerStatus, resetCount } = useController(selectedGamepadIndex);

  const updateGamepads = () => {
    setGamepads([...getGamepads()].filter(Boolean));
    console.log("test");
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

  const handleReloadClick = () => {
    resetCount();
    setSelectedGamepadIndex(-1);
    updateGamepads();
  };

  return (
    <>
      <header
        data-tauri-drag-region
        style={{
          borderBottom: "1px solid white",
          padding: "5px 5px 0 5px",
          fontSize: "10px",
          lineHeight: 1,
          cursor: "default",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span style={{ marginLeft: "0" }}>打鍵カウンタ</span>
        <span
          onClick={handleReloadClick}
          style={{
            marginLeft: "auto",
          }}
        >
          <RefreshIcon />
        </span>
        <span onClick={close}>
          <CloseIcon />
        </span>
      </header>
      <div className="container">
        {!controllerStatus && (
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
        )}
        {controllerStatus && <IIDXController status={controllerStatus} />}
        {controllerStatus && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <BeatStatus status={controllerStatus} />
          </div>
        )}
      </div>
    </>
  );
}

export default App;
