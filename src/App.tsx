import { useEffect, useState } from "react";
import { getGamepads } from "tauri-plugin-gamepad-api";
import useController from "./hooks/useController";
import { IIDXController } from "./components/IIDXController";
import { BeatStatus } from "./components/BeatStatus";

function App() {
  const [gamepads, setGamepads] = useState<Gamepad[] | any[]>([]);
  const [selectedGamepadIndex, setSelectedGamepadIndex] = useState(-1);
  const { controllerStatus, resetCount } = useController(selectedGamepadIndex);

  useEffect(() => {
    const updateGamepads = () => {
      setGamepads([...getGamepads()].filter(Boolean));
    };

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

  return (
    <div className="container">
      <select onChange={handleGamepadChange} value={selectedGamepadIndex}>
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
          <p>
            <button onClick={() => resetCount()}>reset</button>
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
