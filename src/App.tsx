import { useEffect, useState, useRef, useCallback } from "react";
import useController from "./hooks/useController";
import { AppHeader } from "./components/AppHeader";
import { GamepadSelector } from "./components/GamepadSelector";
import { ConnectionSettings } from "./components/ConnectionSettings";
import { ControllerDisplay } from "./components/ControllerDisplay";
import { ErrorMessage } from "./components/ErrorMessage";
import type { ControllerStatus } from "./types/controller";
import { WEBSOCKET } from "./constants/app";
import { useWebSocket } from "./hooks/useWebSocket";
import { useGamepadDetection } from "./hooks/useGamepadDetection";
import { useTauriWindow } from "./hooks/useTauriWindow";
import { useAppMode } from "./hooks/useAppMode";
import { compareControllerStatus } from "./utils/compareControllerStatus";
import "@fontsource/noto-sans"


/**
 * メインアプリケーションコンポーネント
 * カスタムフックを使用して状態管理を行い、UIコンポーネントを組み合わせる
 */
function App() {
  // 接続設定
  const [ipAddress, setIpAddress] = useState<string>(WEBSOCKET.DEFAULT_IP);
  // プレイヤーサイド (1P: false, 2P: true)
  const [is2P, setIs2P] = useState<boolean>(false);
  
  // カスタムフックによる機能の組み合わせ
  const { isServerMode, closeWindow } = useTauriWindow();
  const { isReceiveMode, setReceiveMode, resetMode } = useAppMode();
  
  // WebSocket接続管理
  const { ws, state: _, error: wsError, connect: connectWebSocket, disconnect: disconnectWebSocket, send: sendData, receivedData } = useWebSocket({
    ipAddress,
  });
  
  // ゲームパッド自動検出
  const { selectedGamepadIndex, error: gamepadError, reset: resetGamepad } = useGamepadDetection({
    enabled: true,
    onDetected: () => {
      if (!ws) connectWebSocket();
    },
  });
  
  // コントローラー状態の取得
  const { controllerStatus, resetCount } = useController(selectedGamepadIndex);

  // 表示するステータスを決定（受信モード時は受信データ、それ以外はローカルデータ）
  const status = isReceiveMode ? receivedData : controllerStatus;

  // コントローラーデータを送信（データが変更された時のみ）
  const prevControllerStatusRef = useRef<ControllerStatus | null>(null);
  
  useEffect(() => {
    if (ws && controllerStatus && !isReceiveMode) {
      // 前回の状態と比較して変更があった場合のみ送信
      const hasChanged = !compareControllerStatus(
        prevControllerStatusRef.current,
        controllerStatus
      );
      
      if (hasChanged) {
        sendData(controllerStatus);
        prevControllerStatusRef.current = controllerStatus;
      }
    }
  }, [ws, controllerStatus, isReceiveMode, sendData]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  const close = useCallback(() => {
    closeWindow();
    disconnectWebSocket();
  }, [closeWindow, disconnectWebSocket]);

  const handleReloadClick = useCallback(() => {
    resetCount();
    resetGamepad();
    disconnectWebSocket();
    resetMode();
  }, [resetCount, resetGamepad, disconnectWebSocket, resetMode]);
  
  const handleReceiveModeClick = useCallback(() => {
    connectWebSocket();
    setReceiveMode();
  }, [connectWebSocket, setReceiveMode]);

  return (
    <div style={{ fontFamily: "Noto Sans JP" }}>
      <AppHeader
        isServerMode={isServerMode}
        onReload={handleReloadClick}
        onClose={close}
      />
      <div className="container">
        {wsError && (
          <ErrorMessage
            message={wsError.message}
            showRetry={true}
            onRetry={connectWebSocket}
          />
        )}
        {!controllerStatus && !isReceiveMode && (
          <>
            <GamepadSelector error={gamepadError} />
            <ConnectionSettings
              ipAddress={ipAddress}
              onIpAddressChange={setIpAddress}
              onReceiveModeClick={handleReceiveModeClick}
            />
          </>
        )}
        {status && <ControllerDisplay status={status} is2P={is2P} onPlayerSideChange={setIs2P} />}
      </div>
    </div>
  );
}

export default App;
