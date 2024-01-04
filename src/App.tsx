import { useEffect, useState } from "react";
import { getGamepads } from "tauri-plugin-gamepad-api";
import useController from "./useController";
import { IIDXController } from "./components/IIDXController";

function App() {
  const [gamepads, setGamepads] = useState<Gamepad[] | any[]>([]);
  const [selectedGamepadIndex, setSelectedGamepadIndex] = useState(-1);
  const controllerStatus = useController(selectedGamepadIndex);

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
    console.log(e.target.value);
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
    </div>
  );
}

// 5,1,2,4,7,8,9
export default App;
