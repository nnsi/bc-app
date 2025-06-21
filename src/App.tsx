import { useEffect, useState, useRef, useCallback } from "react";
import useController from "./hooks/useController";
import { AppHeader } from "./components/AppHeader";
import { GamepadSelector } from "./components/GamepadSelector";
import { ConnectionSettings } from "./components/ConnectionSettings";
import { ControllerDisplay } from "./components/ControllerDisplay";
import { ErrorMessage } from "./components/ErrorMessage";
import type { ControllerStatus, DPControllerStatus } from "./types/controller";
import { WEBSOCKET } from "./constants/app";
import { useWebSocket } from "./hooks/useWebSocket";
import { useGamepadDetection } from "./hooks/useGamepadDetection";
import { useTauriWindow } from "./hooks/useTauriWindow";
import { useAppMode } from "./hooks/useAppMode";
import { compareControllerStatus } from "./utils/compareControllerStatus";
import { useSettings } from "./hooks/useSettings";
import { useDPController } from "./hooks/useDPController";
import { useMultiGamepadDetection } from "./hooks/useMultiGamepadDetection";
import { useWindowResize } from "./hooks/useWindowResize";
import { useWebSocketDP } from "./hooks/useWebSocketDP";
import { useGamepadAssignment } from "./hooks/useGamepadAssignment";
import { PlayModeSettings } from "./components/PlayModeSettings";
import { IIDXControllerDP } from "./components/IIDXControllerDP";
import { BeatStatusDP } from "./components/BeatStatusDP";
import "@fontsource/noto-sans"


/**
 * メインアプリケーションコンポーネント
 * カスタムフックを使用して状態管理を行い、UIコンポーネントを組み合わせる
 */
function App() {
  // 接続設定
  const [ipAddress, setIpAddress] = useState<string>(WEBSOCKET.DEFAULT_IP);
  // プレイヤーサイド (1P: false, 2P: true) - localStorageから初期値を取得
  const [is2P, setIs2P] = useState<boolean>(() => {
    const saved = localStorage.getItem('playerSide');
    return saved === '2P';
  });
  // 設定画面表示フラグ
  const [showSettings, setShowSettings] = useState(false);
  
  // カスタムフックによる機能の組み合わせ
  const { isServerMode, closeWindow } = useTauriWindow();
  const { isReceiveMode, setReceiveMode, resetMode } = useAppMode();
  
  // 設定管理
  const { settings, setPlayMode, setDPGamepadMapping } = useSettings();
  
  // ウィンドウリサイズ
  useWindowResize({ playMode: settings.playMode.mode });
  
  // 複数ゲームパッド検出
  const { gamepads, isGamepadAvailable } = useMultiGamepadDetection({
    enabled: true,
    maxGamepads: 2,
  });
  
  // DPモード用ゲームパッド割り当て
  const { 
    assigningPlayer, 
    startAssign1P, 
    startAssign2P, 
    cancelAssignment,
    error: assignmentError 
  } = useGamepadAssignment({
    onAssign1P: (index) => {
      console.log('[App] onAssign1P called with index:', index);
      console.log('[App] Current 2P index:', settings.playMode.dp2PGamepadIndex);
      // 1P側を割り当て（2P側は現在の値を維持）
      setDPGamepadMapping(index, settings.playMode.dp2PGamepadIndex);
    },
    onAssign2P: (index) => {
      console.log('[App] onAssign2P called with index:', index);
      console.log('[App] Current 1P index:', settings.playMode.dp1PGamepadIndex);
      // 2P側を割り当て（1P側は現在の値を維持）
      setDPGamepadMapping(settings.playMode.dp1PGamepadIndex, index);
    },
  });
  
  // WebSocket接続管理（DP対応）
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
  
  // ゲームパッド自動検出（SPモード用）
  const { selectedGamepadIndex, error: gamepadError, reset: resetGamepad } = useGamepadDetection({
    enabled: settings.playMode.mode === 'SP' && !showSettings && !assigningPlayer,
    onDetected: (index) => {
      // SPモードの場合
      if (!ws) connectWebSocket();
    },
  });
  
  // DP対応コントローラー状態の取得
  const { spControllerStatus, dpControllerStatus, resetCount } = useDPController({
    playMode: settings.playMode.mode,
    spGamepadIndex: selectedGamepadIndex,
    dp1PGamepadIndex: settings.playMode.dp1PGamepadIndex,
    dp2PGamepadIndex: settings.playMode.dp2PGamepadIndex,
  });
  
  // SPモード用の旧互換性
  const controllerStatus = spControllerStatus;

  // 表示するステータスを決定
  const displayStatus = (() => {
    if (isReceiveMode && receivedData) {
      // 受信モード
      if ('mode' in receivedData && receivedData.mode === 'DP') {
        return receivedData as DPControllerStatus;
      }
      return receivedData as ControllerStatus;
    }
    // ローカルモード
    return settings.playMode.mode === 'SP' ? spControllerStatus : dpControllerStatus;
  })();

  // プレイヤーサイドの変更をlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('playerSide', is2P ? '2P' : '1P');
  }, [is2P]);

  // プレイモード変更時にSPモードに切り替わったらゲームパッドをリセット
  useEffect(() => {
    if (settings.playMode.mode === 'SP') {
      // DPモードからSPモードに切り替わった時にゲームパッドの自動検出をリセット
      resetGamepad();
    }
  }, [settings.playMode.mode, resetGamepad]);

  // コントローラーデータを送信（データが変更された時のみ）
  const prevControllerStatusRef = useRef<ControllerStatus | null>(null);
  const prevDPControllerStatusRef = useRef<DPControllerStatus | null>(null);
  
  useEffect(() => {
    if (ws && !isReceiveMode) {
      if (settings.playMode.mode === 'SP' && spControllerStatus) {
        // SPモード
        const hasChanged = !compareControllerStatus(
          prevControllerStatusRef.current,
          spControllerStatus
        );
        
        if (hasChanged) {
          sendSP(spControllerStatus);
          prevControllerStatusRef.current = spControllerStatus;
        }
      } else if (settings.playMode.mode === 'DP' && dpControllerStatus) {
        // DPモード - 簡易的な比較（timestampで判定）
        const hasChanged = !prevDPControllerStatusRef.current || 
          prevDPControllerStatusRef.current.timestamp !== dpControllerStatus.timestamp;
        
        if (hasChanged) {
          sendDP(dpControllerStatus);
          prevDPControllerStatusRef.current = dpControllerStatus;
        }
      }
    }
  }, [ws, spControllerStatus, dpControllerStatus, isReceiveMode, sendSP, sendDP, settings.playMode.mode]);

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
    setShowSettings(false);
  }, [resetCount, resetGamepad, disconnectWebSocket, resetMode]);
  
  const handleReceiveModeClick = useCallback(() => {
    connectWebSocket();
    setReceiveMode();
  }, [connectWebSocket, setReceiveMode]);
  
  const handleSettingsClick = useCallback(() => {
    setShowSettings(!showSettings);
  }, [showSettings]);
  
  const handleStartAssignment = useCallback((player: '1P' | '2P') => {
    if (player === '1P') {
      startAssign1P();
    } else {
      startAssign2P();
    }
  }, [startAssign1P, startAssign2P]);

  return (
    <div style={{ fontFamily: "Noto Sans JP" }}>
      <AppHeader
        isServerMode={isServerMode}
        onReload={handleReloadClick}
        onClose={close}
        onSettings={handleSettingsClick}
        showSettings={showSettings}
      />
      <div className="container">
        {wsError && (
          <ErrorMessage
            message={wsError.message}
            showRetry={true}
            onRetry={connectWebSocket}
          />
        )}
        
        {/* 設定画面 */}
        {showSettings && (
          <>
            <PlayModeSettings
              currentMode={settings.playMode.mode}
              onModeChange={setPlayMode}
              dpAssignments={{
                player1: settings.playMode.dp1PGamepadIndex !== null ? {
                  index: settings.playMode.dp1PGamepadIndex,
                  id: gamepads.find(g => g.index === settings.playMode.dp1PGamepadIndex)?.id || 'Unknown',
                } : null,
                player2: settings.playMode.dp2PGamepadIndex !== null ? {
                  index: settings.playMode.dp2PGamepadIndex,
                  id: gamepads.find(g => g.index === settings.playMode.dp2PGamepadIndex)?.id || 'Unknown',
                } : null,
              }}
              onStartAssignment={handleStartAssignment}
              assigningPlayer={assigningPlayer}
              availableGamepads={gamepads.map(g => ({ index: g.index, id: g.id }))}
            />
            {assignmentError && (
              <div style={{ 
                color: '#ff6b6b', 
                textAlign: 'center', 
                marginTop: '10px',
                fontSize: '12px'
              }}>
                {assignmentError}
              </div>
            )}
          </>
        )}
        
        {/* コントローラー未選択時の画面（SPモードのみ） */}
        {settings.playMode.mode === 'SP' && !spControllerStatus && !isReceiveMode && !showSettings && (
          <>
            <GamepadSelector error={gamepadError} />
            <ConnectionSettings
              ipAddress={ipAddress}
              onIpAddressChange={setIpAddress}
              onReceiveModeClick={handleReceiveModeClick}
            />
          </>
        )}
        
        {/* コントローラー表示 */}
        {displayStatus && (
          <>
            {/* SPモードまたは旧ControllerStatus形式 */}
            {(!('mode' in displayStatus)) && (
              <ControllerDisplay 
                status={displayStatus as ControllerStatus} 
                is2P={is2P} 
                onPlayerSideChange={setIs2P} 
              />
            )}
            
            {/* DPモード */}
            {displayStatus && 'mode' in displayStatus && displayStatus.mode === 'DP' && (
              <>
                <IIDXControllerDP
                  player1Status={displayStatus.player1}
                  player2Status={displayStatus.player2}
                  mode="DP"
                  currentPlayerSide="1P"
                />
                <div style={{ marginTop: '20px' }}>
                  <BeatStatusDP
                    player1Status={displayStatus.player1}
                    player2Status={displayStatus.player2}
                    mode="DP"
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
