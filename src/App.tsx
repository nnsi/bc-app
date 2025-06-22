import { useEffect, useState, useRef, useCallback } from "react";
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
import { IIDXControllerDP } from "./components/IIDXControllerDP";
import { BeatStatusDP } from "./components/BeatStatusDP";
import { DPGamepadSelector } from "./components/DPGamepadSelector";
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
  
  // カスタムフックによる機能の組み合わせ
  const { isServerMode, closeWindow } = useTauriWindow();
  const { isReceiveMode, setReceiveMode, resetMode } = useAppMode();
  
  // 設定管理
  const { settings, setPlayMode, setDPGamepadMapping, resetDPGamepadMapping } = useSettings();
  
  // DPモードの割り当て状態を追跡するためのref
  const dpAssignmentRef = useRef<{ player1: number | null; player2: number | null }>({
    player1: settings.playMode.dp1PGamepadIndex,
    player2: settings.playMode.dp2PGamepadIndex,
  });
  
  // 設定が変更されたらrefも更新
  useEffect(() => {
    dpAssignmentRef.current = {
      player1: settings.playMode.dp1PGamepadIndex,
      player2: settings.playMode.dp2PGamepadIndex,
    };
  }, [settings.playMode.dp1PGamepadIndex, settings.playMode.dp2PGamepadIndex]);
  
  // ウィンドウリサイズ
  useWindowResize({ playMode: settings.playMode.mode });
  
  // 複数ゲームパッド検出
  const { gamepads, isGamepadAvailable } = useMultiGamepadDetection({
    enabled: true,
    maxGamepads: 2,
  });
  
  // DPモード用ゲームパッド割り当て
  const { 
    error: assignmentError,
    startAutoAssignment,
    isAutoAssigning,
    cancelAssignment
  } = useGamepadAssignment({
    onAssign1P: (index) => {
      console.log('[App] onAssign1P called with index:', index);
      console.log('[App] Current 2P index from ref:', dpAssignmentRef.current.player2);
      // 1P側を割り当て（2P側は現在の値を維持）
      dpAssignmentRef.current.player1 = index;
      setDPGamepadMapping(index, dpAssignmentRef.current.player2);
    },
    onAssign2P: (index) => {
      console.log('[App] onAssign2P called with index:', index);
      console.log('[App] Current 1P index from ref:', dpAssignmentRef.current.player1);
      // 2P側を割り当て（1P側は現在の値を維持）
      dpAssignmentRef.current.player2 = index;
      setDPGamepadMapping(dpAssignmentRef.current.player1, index);
    },
  });
  
  // DPモードでコントローラーが未割り当ての場合に自動割り当てを開始（受信モードでは無効）
  useEffect(() => {
    if (settings.playMode.mode === 'DP' && !isReceiveMode && !isAutoAssigning &&
        (settings.playMode.dp1PGamepadIndex === null || settings.playMode.dp2PGamepadIndex === null)) {
      startAutoAssignment();
    }
  }, [settings.playMode.mode, isReceiveMode, settings.playMode.dp1PGamepadIndex, settings.playMode.dp2PGamepadIndex, startAutoAssignment, isAutoAssigning]);
  
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
  
  // ゲームパッド自動検出（SPモード用、受信モードでは無効）
  const { selectedGamepadIndex, error: gamepadError, reset: resetGamepad } = useGamepadDetection({
    enabled: settings.playMode.mode === 'SP' && !isReceiveMode,
    onDetected: (index) => {
      // SPモードの場合
      console.log('[App] SP mode gamepad detected:', index);
      console.log('[App] Current DP assignments - 1P:', settings.playMode.dp1PGamepadIndex, '2P:', settings.playMode.dp2PGamepadIndex);
      if (!ws) connectWebSocket();
    },
  });
  
  // DP対応コントローラー状態の取得（受信モードでは無効）
  const { spControllerStatus, dpControllerStatus, resetCount } = useDPController({
    playMode: isReceiveMode ? 'SP' : settings.playMode.mode,
    spGamepadIndex: isReceiveMode ? -1 : selectedGamepadIndex,
    dp1PGamepadIndex: isReceiveMode ? null : settings.playMode.dp1PGamepadIndex,
    dp2PGamepadIndex: isReceiveMode ? null : settings.playMode.dp2PGamepadIndex,
  });
  
  // SPモードのデバッグ情報（モード切り替え時のみ）
  useEffect(() => {
    if (settings.playMode.mode === 'SP') {
      console.log('[App] Switched to SP mode - selectedGamepadIndex:', selectedGamepadIndex);
    }
  }, [settings.playMode.mode]);
  
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

  // プレイモード変更時の処理
  const prevModeRef = useRef(settings.playMode.mode);
  useEffect(() => {
    if (prevModeRef.current !== settings.playMode.mode) {
      console.log('[App] Mode changed from', prevModeRef.current, 'to', settings.playMode.mode);
      
      if (settings.playMode.mode === 'SP') {
        // DPモードからSPモードに切り替わった時
        // DPモードの自動割り当てをキャンセル
        if (isAutoAssigning) {
          cancelAssignment();
        }
        // SPモードのコントローラー状態をリセット
        resetCount();
        // SPモードのゲームパッド自動検出をリセット
        resetGamepad();
      } else {
        // SPモードからDPモードに切り替わった時
        // SPモードのコントローラー状態をクリア
        resetCount();
      }
      
      prevModeRef.current = settings.playMode.mode;
    }
  }, [settings.playMode.mode, resetGamepad, isAutoAssigning, cancelAssignment, resetCount]);

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
    // DPモードの場合はゲームパッド割り当てもリセット
    if (settings.playMode.mode === 'DP') {
      resetDPGamepadMapping();
      // 自動割り当てを再開始
      startAutoAssignment();
    }
  }, [resetCount, resetGamepad, disconnectWebSocket, resetMode, settings.playMode.mode, resetDPGamepadMapping, startAutoAssignment]);
  
  const handleReceiveModeClick = useCallback(() => {
    console.log('[App] Entering receive mode');
    connectWebSocket();
    setReceiveMode();
  }, [connectWebSocket, setReceiveMode]);
  
  return (
    <div style={{ fontFamily: "Noto Sans JP" }}>
      <AppHeader
        isServerMode={isServerMode}
        onReload={handleReloadClick}
        onClose={close}
        currentMode={settings.playMode.mode}
        onModeChange={setPlayMode}
      />
      <div className="container">
        {wsError && (
          <ErrorMessage
            message={wsError.message}
            showRetry={true}
            onRetry={connectWebSocket}
          />
        )}
        
        
        {/* コントローラー未選択時の画面（受信モードでは表示しない） */}
        {!isReceiveMode && !displayStatus && (
          <>
            {/* SPモード */}
            {settings.playMode.mode === 'SP' && !spControllerStatus && (
              <>
                <GamepadSelector error={gamepadError} />
                <ConnectionSettings
                  ipAddress={ipAddress}
                  onIpAddressChange={setIpAddress}
                  onReceiveModeClick={handleReceiveModeClick}
                />
              </>
            )}
            
            {/* DPモード */}
            {settings.playMode.mode === 'DP' && (!dpControllerStatus || 
              settings.playMode.dp1PGamepadIndex === null || 
              settings.playMode.dp2PGamepadIndex === null) && (
              <>
                <DPGamepadSelector 
                  error={assignmentError}
                  assignments={{
                    player1: settings.playMode.dp1PGamepadIndex !== null ? {
                      index: settings.playMode.dp1PGamepadIndex,
                      id: gamepads.find(g => g.index === settings.playMode.dp1PGamepadIndex)?.id || 'Unknown',
                    } : null,
                    player2: settings.playMode.dp2PGamepadIndex !== null ? {
                      index: settings.playMode.dp2PGamepadIndex,
                      id: gamepads.find(g => g.index === settings.playMode.dp2PGamepadIndex)?.id || 'Unknown',
                    } : null,
                  }}
                  isAssigning={isAutoAssigning}
                />
                <ConnectionSettings
                  ipAddress={ipAddress}
                  onIpAddressChange={setIpAddress}
                  onReceiveModeClick={handleReceiveModeClick}
                />
              </>
            )}
          </>
        )}
        
        {/* 受信モードの状態表示 */}
        {isReceiveMode && !displayStatus && (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            color: '#4a9eff',
            fontSize: '16px'
          }}>
            受信モードで待機中...
          </div>
        )}
        
        {/* コントローラー表示 */}
        {displayStatus && (
          <>
            {/* SPモードまたは旧ControllerStatus形式 */}
            {(!('mode' in displayStatus) || (displayStatus.mode === 'SP')) && (
              <>
                <ControllerDisplay 
                  status={displayStatus as ControllerStatus} 
                  is2P={is2P} 
                  onPlayerSideChange={setIs2P} 
                />
              </>
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
