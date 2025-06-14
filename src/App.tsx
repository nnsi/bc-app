import { useEffect, useState } from "react";
import type { getGamepads as GetGamepadsType } from "tauri-plugin-gamepad-api";
import useController from "./hooks/useController";
import { IIDXController } from "./components/IIDXController";
import { BeatStatus } from "./components/BeatStatus";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import { invoke } from "@tauri-apps/api/core";

// Tauriが利用可能かチェック
const isTauriAvailable = () => {
  return typeof window !== 'undefined' && 
         typeof window.__TAURI_INTERNALS__ !== 'undefined';
};

const appWindow = isTauriAvailable() ? getCurrentWebviewWindow() : null;

function App() {
  const [gamepads, setGamepads] = useState<Gamepad[] | any[]>([]);
  const [selectedGamepadIndex, setSelectedGamepadIndex] = useState(-1);
  const [getGamepads, setGetGamepads] = useState<GetGamepadsType | null>(null);
  const { controllerStatus, resetCount } = useController(selectedGamepadIndex);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isRecievedMode, setIsRecievedMode] = useState(false);
  const [recievedStatus, setRecievedStatus] = useState<any>(null);
  const [ipAddress, setIpAddress] = useState<string>("127.0.0.1");
  const [isServerMode, setIsServerMode] = useState(false);

  const status = isRecievedMode ? recievedStatus : controllerStatus;

  if (ws && controllerStatus) {
    ws.send(JSON.stringify(controllerStatus));
  }

  const updateGamepads = () => {
    if (isTauriAvailable() && getGamepads) {
      try {
        setGamepads([...getGamepads()].filter(Boolean));
      } catch (error) {
        console.warn("Gamepad not available:", error);
        setGamepads([]);
      }
    } else {
      setGamepads([]);
    }
  };

  const connectWebSocket = () => {
    const webSocket = new WebSocket(`ws://${ipAddress}:2356/ws`);

    webSocket.onopen = () => {
      if (ws) ws.close();
      console.log("connected");
      setWs(webSocket);
    };

    webSocket.onmessage = async (e) => {
      const text = e.data instanceof Blob ? await e.data.text() : e.data;
      setRecievedStatus(JSON.parse(text));
    };

    webSocket.onerror = () => {
      console.log("error");
      setWs(null);
    };

    webSocket.onclose = () => {
      console.log("closed");
      setWs(null);
    };
  };

  useEffect(() => {
    // gamepadプラグインを動的にロード
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

    window.addEventListener("gamepadconnected", updateGamepads);
    window.addEventListener("gamepaddisconnected", updateGamepads);

    // 初回ロード時にゲームパッドの状態を更新
    updateGamepads();

    (async () => {
      if (isTauriAvailable()) {
        try {
          setIsServerMode(await invoke("check_websocket_status"));
        } catch (e) {
          console.error(e);
        }
      }
    })();
    return () => {
      window.removeEventListener("gamepadconnected", updateGamepads);
      window.removeEventListener("gamepaddisconnected", updateGamepads);
      if (ws) ws.close();
    };
  }, []);

  const handleGamepadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGamepadIndex(parseInt(e.target.value, 10));
    if (!ws) connectWebSocket();
  };

  const close = () => {
    if (appWindow) {
      appWindow.close();
    }
    if (ws) ws.close();
  };

  const handleReloadClick = () => {
    resetCount();
    setSelectedGamepadIndex(-1);
    updateGamepads();
    if (ws) ws.close();
    setIsRecievedMode(false);
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
        <span style={{ marginLeft: "0" }}>
          打鍵カウンタ[{isServerMode ? "Server" : "Client"} Mode]
        </span>
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
        {!controllerStatus && !isRecievedMode && (
          <>
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
            <p>
              <input
                type="text"
                placeholder="接続先"
                value={ipAddress}
                onChange={(e) => {
                  setIpAddress(e.target.value);
                }}
              />
              <button
                onClick={() => {
                  if (!ws) connectWebSocket();
                  setIsRecievedMode(true);
                }}
              >
                受信モード
              </button>
            </p>
          </>
        )}
        {status && <IIDXController status={status} />}
        {status && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <BeatStatus status={status} />
          </div>
        )}
      </div>
    </>
  );
}

export default App;
