import { useState, useCallback, useEffect } from "react";
import { AppHeader } from "./components/AppHeader";
import { SPMode } from "./components/SPMode";
import { DPMode } from "./components/DPMode";
import { ErrorMessage } from "./components/ErrorMessage";
import { ControllerDisplay } from "./components/ControllerDisplay";
import { IIDXControllerDP } from "./components/IIDXControllerDP";
import { BeatStatusDP } from "./components/BeatStatusDP";
import { WEBSOCKET } from "./constants/app";
import { useTauriWindow } from "./hooks/useTauriWindow";
import { useAppMode } from "./hooks/useAppMode";
import { useSettings } from "./hooks/useSettings";
import { useWindowResize } from "./hooks/useWindowResize";
import { useWebSocketDP } from "./hooks/useWebSocketDP";
import { useAppSettings } from "./contexts/AppSettingsContext";
import type { PlayMode, ControllerStatus, DPControllerStatus } from "./types/controller";


/**
 * メインアプリケーションコンポーネント
 * モード切替、WebSocket接続、受信モード表示を管理し、
 * 実際のコントローラーロジックはSPMode/DPModeに委譲する
 */
function App() {
  // 接続設定
  const [ipAddress, setIpAddress] = useState<string>(WEBSOCKET.DEFAULT_IP);
  // リロード時にモードコンポーネントを強制remount
  const [reloadKey, setReloadKey] = useState(0);
  // Context経由でアプリ設定を取得
  const { isTransparent, setIsTransparent } = useAppSettings();

  // カスタムフックによる機能の組み合わせ
  const { isServerMode, closeWindow } = useTauriWindow();
  const { isReceiveMode, setReceiveMode, resetMode } = useAppMode();

  // 設定管理
  const { settings, setPlayMode, setDPGamepadMapping, resetDPGamepadMapping } = useSettings();

  // ウィンドウリサイズ
  useWindowResize({ playMode: settings.playMode.mode });

  // WebSocket接続管理（SP/DP/受信モード共通）
  const {
    ws,
    state: _,
    error: wsError,
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    sendSP,
    sendDP,
    receivedData
  } = useWebSocketDP({
    ipAddress,
  });

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

  // リロード: remountで各モードの内部状態をリセット
  const handleReloadClick = useCallback(() => {
    setReloadKey(k => k + 1);
    disconnectWebSocket();
    resetMode();
    if (settings.playMode.mode === 'DP') {
      resetDPGamepadMapping();
    }
  }, [disconnectWebSocket, resetMode, settings.playMode.mode, resetDPGamepadMapping]);

  // モード切替: 旧モードをunmountし新モードをmount
  const handleModeChange = useCallback((mode: PlayMode) => {
    if (mode !== settings.playMode.mode) {
      disconnectWebSocket();
      resetMode();
      if (mode === 'DP') {
        resetDPGamepadMapping();
      }
    }
    setPlayMode(mode);
  }, [settings.playMode.mode, disconnectWebSocket, resetMode, setPlayMode, resetDPGamepadMapping]);

  const handleReceiveModeClick = useCallback(() => {
    connectWebSocket();
    setReceiveMode();
  }, [connectWebSocket, setReceiveMode]);

  return (
    <div className={`min-h-screen text-white overflow-hidden select-none text-sm ${isTransparent ? 'bg-transparent' : 'bg-neutral-700'}`}>
      <AppHeader
        isServerMode={isServerMode}
        onReload={handleReloadClick}
        onClose={close}
        currentMode={settings.playMode.mode}
        onModeChange={handleModeChange}
        isTransparent={isTransparent}
        onTransparencyChange={setIsTransparent}
      />
      <div className="p-[5px] mt-4">
        {wsError && (
          <ErrorMessage
            message={wsError.message}
            showRetry={true}
            onRetry={connectWebSocket}
          />
        )}

        {/* 受信モード */}
        {isReceiveMode && !receivedData && (
          <div className="text-center p-5 text-[#4a9eff] text-[16px]">
            受信モードで待機中...
          </div>
        )}
        {isReceiveMode && receivedData && (
          <>
            {('mode' in receivedData && receivedData.mode === 'DP') ? (
              <>
                <IIDXControllerDP
                  player1Status={(receivedData as DPControllerStatus).player1}
                  player2Status={(receivedData as DPControllerStatus).player2}
                  mode="DP"
                  currentPlayerSide="1P"
                />
                <div className="mt-5">
                  <BeatStatusDP
                    player1Status={(receivedData as DPControllerStatus).player1}
                    player2Status={(receivedData as DPControllerStatus).player2}
                    mode="DP"
                  />
                </div>
              </>
            ) : (
              <ControllerDisplay status={receivedData as ControllerStatus} />
            )}
          </>
        )}

        {/* SPモード */}
        {!isReceiveMode && settings.playMode.mode === 'SP' && (
          <SPMode
            key={reloadKey}
            ws={ws}
            sendSP={sendSP}
            connectWebSocket={connectWebSocket}
            ipAddress={ipAddress}
            onIpAddressChange={setIpAddress}
            onReceiveModeClick={handleReceiveModeClick}
          />
        )}

        {/* DPモード */}
        {!isReceiveMode && settings.playMode.mode === 'DP' && (
          <DPMode
            key={reloadKey}
            ws={ws}
            sendDP={sendDP}
            connectWebSocket={connectWebSocket}
            dp1PGamepadIndex={settings.playMode.dp1PGamepadIndex}
            dp2PGamepadIndex={settings.playMode.dp2PGamepadIndex}
            onGamepadMapping={setDPGamepadMapping}
            ipAddress={ipAddress}
            onIpAddressChange={setIpAddress}
            onReceiveModeClick={handleReceiveModeClick}
          />
        )}
      </div>
    </div>
  );
}

export default App;
