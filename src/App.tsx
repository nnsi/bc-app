import { useState, useCallback, useEffect } from "react";
import { AppHeader } from "./components/AppHeader";
import { AppContent } from "./components/AppContent";
import { WEBSOCKET } from "./constants/app";
import { useGamepadDetection } from "./hooks/useGamepadDetection";
import { useTauriWindow } from "./hooks/useTauriWindow";
import { useAppMode } from "./hooks/useAppMode";
import { useSettings } from "./hooks/useSettings";
import { useDPController } from "./hooks/useDPController";
import { useWindowResize } from "./hooks/useWindowResize";
import { useWebSocketDP } from "./hooks/useWebSocketDP";
import { useGamepadAssignment } from "./hooks/useGamepadAssignment";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useGamepadInfo } from "./hooks/useGamepadInfo";
import { useWebSocketData } from "./hooks/useWebSocketData";
import { useModeChange } from "./hooks/useModeChange";
import { useDPAssignmentRef } from "./hooks/useDPAssignmentRef";
import { 
  determineDisplayStatus, 
  shouldStartAutoAssignment,
  shouldConnectWebSocketForDP,
  stringToPlayerSide,
  stringToTransparency,
  buildDPAssignments
} from "./utils/appBusinessLogic";


/**
 * メインアプリケーションコンポーネント
 * カスタムフックを使用して状態管理を行い、UIコンポーネントを組み合わせる
 */
function App() {
  // 接続設定
  const [ipAddress, setIpAddress] = useState<string>(WEBSOCKET.DEFAULT_IP);
  // プレイヤーサイド (1P: false, 2P: true) - localStorageから初期値を取得
  const [is2P, setIs2P] = useState<boolean>(() => 
    stringToPlayerSide(localStorage.getItem('playerSide'))
  );
  // 透過状態 - localStorageから初期値を取得
  const [isTransparent, setIsTransparent] = useState<boolean>(() => 
    stringToTransparency(localStorage.getItem('isTransparent'))
  );
  
  // カスタムフックによる機能の組み合わせ
  const { isServerMode, closeWindow } = useTauriWindow();
  const { isReceiveMode, setReceiveMode, resetMode } = useAppMode();
  
  // 設定管理
  const { settings, setPlayMode, setDPGamepadMapping, resetDPGamepadMapping } = useSettings();
  
  // DPモードの割り当て状態を追跡するためのref
  const dpAssignmentRef = useDPAssignmentRef({
    dp1PGamepadIndex: settings.playMode.dp1PGamepadIndex,
    dp2PGamepadIndex: settings.playMode.dp2PGamepadIndex,
  });
  
  // ウィンドウリサイズ
  useWindowResize({ playMode: settings.playMode.mode });
  
  // ゲームパッド情報を取得（DPモードの割り当て画面用）
  const gamepads = useGamepadInfo();
  
  
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
    if (shouldStartAutoAssignment(
      settings.playMode.mode, 
      isReceiveMode, 
      isAutoAssigning,
      settings.playMode.dp1PGamepadIndex, 
      settings.playMode.dp2PGamepadIndex
    )) {
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

  // DPモードで両方のゲームパッドが割り当てられたらWebSocket接続
  useEffect(() => {
    if (shouldConnectWebSocketForDP(
      settings.playMode.mode,
      isReceiveMode,
      settings.playMode.dp1PGamepadIndex,
      settings.playMode.dp2PGamepadIndex,
      !!ws
    )) {
      console.log('[App] DP mode gamepads assigned, connecting WebSocket');
      connectWebSocket();
    }
  }, [settings.playMode.mode, isReceiveMode, settings.playMode.dp1PGamepadIndex, settings.playMode.dp2PGamepadIndex, ws, connectWebSocket]);
  
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

  
  

  // 表示するステータスを決定
  const displayStatus = determineDisplayStatus(
    isReceiveMode,
    receivedData,
    settings.playMode.mode,
    spControllerStatus ?? null,
    dpControllerStatus ?? null
  );
  
  // localStorage管理
  useLocalStorage(is2P, isTransparent);

  // プレイモード変更時の処理
  useModeChange({
    playMode: settings.playMode.mode,
    isAutoAssigning,
    cancelAssignment,
    resetCount,
    resetGamepad,
    resetDPGamepadMapping,
    startAutoAssignment,
  });

  // コントローラーデータを送信（データが変更された時のみ）
  useWebSocketData({
    ws,
    isReceiveMode,
    playMode: settings.playMode.mode,
    spControllerStatus: spControllerStatus ?? null,
    dpControllerStatus: dpControllerStatus ?? null,
    sendSP,
    sendDP,
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

  const handleReloadClick = useCallback(() => {
    resetCount();
    resetGamepad();
    disconnectWebSocket();
    resetMode();
    if (settings.playMode.mode === 'DP') {
      resetDPGamepadMapping();
      startAutoAssignment();
    }
  }, [resetCount, resetGamepad, disconnectWebSocket, resetMode, settings.playMode.mode, resetDPGamepadMapping, startAutoAssignment]);
  
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
        onModeChange={setPlayMode}
        isTransparent={isTransparent}
        onTransparencyChange={setIsTransparent}
      />
      <AppContent
        wsError={wsError}
        connectWebSocket={connectWebSocket}
        isReceiveMode={isReceiveMode}
        displayStatus={displayStatus}
        playMode={settings.playMode.mode}
        spControllerStatus={spControllerStatus ?? null}
        dpControllerStatus={dpControllerStatus ?? null}
        gamepadError={gamepadError}
        ipAddress={ipAddress}
        onIpAddressChange={setIpAddress}
        onReceiveModeClick={handleReceiveModeClick}
        dp1PGamepadIndex={settings.playMode.dp1PGamepadIndex}
        dp2PGamepadIndex={settings.playMode.dp2PGamepadIndex}
        assignmentError={assignmentError}
        assignments={buildDPAssignments(
          settings.playMode.dp1PGamepadIndex,
          settings.playMode.dp2PGamepadIndex,
          gamepads
        )}
        isAutoAssigning={isAutoAssigning}
        is2P={is2P}
        onPlayerSideChange={setIs2P}
      />
    </div>
  );
}

export default App;
