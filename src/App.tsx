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
         '__TAURI_INTERNALS__' in window;
};

const appWindow = isTauriAvailable() ? getCurrentWebviewWindow() : null;

function App() {
  const [selectedGamepadIndex, setSelectedGamepadIndex] = useState(-1);
  const [getGamepads, setGetGamepads] = useState<typeof GetGamepadsType | null>(null);
  const { controllerStatus, resetCount } = useController(selectedGamepadIndex);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isRecievedMode, setIsRecievedMode] = useState(false);
  const [recievedStatus, setRecievedStatus] = useState<any>(null);
  const [ipAddress, setIpAddress] = useState<string>("127.0.0.1");
  const [isServerMode, setIsServerMode] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(true);

  const status = isRecievedMode ? recievedStatus : controllerStatus;

  if (ws && controllerStatus) {
    ws.send(JSON.stringify(controllerStatus));
  }


  const detectGamepadInput = () => {
    if (!isAutoDetecting || selectedGamepadIndex !== -1) return;
    
    if (getGamepads) {
      try {
        const currentGamepads = [...getGamepads()].filter(Boolean);
        
        for (const gamepad of currentGamepads) {
          // buttons配列が存在することを確認
          if (!gamepad?.buttons || !Array.isArray(gamepad.buttons)) {
            console.warn(`Gamepad ${gamepad?.index} has invalid buttons array`);
            continue;
          }
          
          // 各ボタンの状態をチェック
          const pressedButton = gamepad.buttons.findIndex((button: any, _: number) => {
            // button オブジェクトの存在とpressedプロパティを確認
            return button && typeof button.pressed === 'boolean' && button.pressed;
          });
          
          if (pressedButton !== -1) {
            console.log(`Button ${pressedButton} pressed on gamepad ${gamepad.index}`);
            setSelectedGamepadIndex(gamepad.index);
            setIsAutoDetecting(false);
            if (!ws) connectWebSocket();
            break;
          }
        }
      } catch (error) {
        console.error("Error during gamepad input detection:", error);
      }
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
      if (ws) ws.close();
    };
  }, []);

  // ゲームパッドの自動検出
  useEffect(() => {
    if (!getGamepads) return;
    
    const interval = setInterval(() => {
      if (isAutoDetecting && selectedGamepadIndex === -1) {
        detectGamepadInput();
      }
    }, 100); // 100msごとに検出

    return () => clearInterval(interval);
  }, [getGamepads, isAutoDetecting, selectedGamepadIndex, ws]);


  const close = () => {
    if (appWindow) {
      appWindow.close();
    }
    if (ws) ws.close();
  };

  const handleReloadClick = () => {
    resetCount();
    setSelectedGamepadIndex(-1);
    if (ws) ws.close();
    setIsRecievedMode(false);
    setIsAutoDetecting(true);
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
            <p style={{ textAlign: "center", marginBottom: "10px" }}>
              コントローラーのボタンを押してください
            </p>
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
