/**
 * DP対応WebSocket接続管理フック
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { WebSocketState, WebSocketError, WEBSOCKET_DEFAULTS, WebSocketMessage, SPWebSocketMessage } from '../types/websocket';
import { ControllerStatus, DPControllerStatus } from '../types/controller';
import { APP } from '../constants/app';

interface UseWebSocketDPProps {
  /** 接続先IPアドレス */
  ipAddress?: string;
  /** 自動再接続を有効にするか */
  autoReconnect?: boolean;
  /** 再接続の遅延時間（ミリ秒） */
  reconnectDelay?: number;
}

interface UseWebSocketDPReturn {
  /** WebSocket接続 */
  ws: WebSocket | null;
  /** 接続状態 */
  state: WebSocketState;
  /** エラー情報 */
  error: WebSocketError | null;
  /** 受信したデータ */
  receivedData: WebSocketMessage | null;
  /** WebSocketに接続 */
  connect: () => void;
  /** WebSocketを切断 */
  disconnect: () => void;
  /** SPモードのデータを送信 */
  sendSP: (data: ControllerStatus) => void;
  /** DPモードのデータを送信 */
  sendDP: (data: DPControllerStatus) => void;
}

/**
 * メッセージがモード情報を持っているか確認
 */
function hasMode(data: any): data is { mode: string } {
  return data && typeof data === 'object' && 'mode' in data;
}

/**
 * 受信データの型を判定してパース
 */
function parseWebSocketMessage(data: any): WebSocketMessage {
  if (hasMode(data)) {
    // モード情報がある場合
    if (data.mode === 'DP') {
      return data as DPControllerStatus;
    } else if (data.mode === 'SP') {
      return data as SPWebSocketMessage;
    }
  }
  // モード情報がない場合は従来のControllerStatusとして扱う（後方互換性）
  return data as ControllerStatus;
}

/**
 * DP対応WebSocket接続を管理するカスタムフック
 * 
 * @example
 * ```tsx
 * const { ws, state, connect, disconnect, sendSP, sendDP, receivedData } = useWebSocketDP({
 *   ipAddress: '192.168.1.100',
 *   autoReconnect: true,
 * });
 * ```
 */
export function useWebSocketDP({
  ipAddress = WEBSOCKET_DEFAULTS.ipAddress,
  autoReconnect = false,
  reconnectDelay = 1000,
}: UseWebSocketDPProps = {}): UseWebSocketDPReturn {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [state, setState] = useState<WebSocketState>(WebSocketState.DISCONNECTED);
  const [error, setError] = useState<WebSocketError | null>(null);
  const [receivedData, setReceivedData] = useState<WebSocketMessage | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      if (APP.DEBUG) console.log('WebSocket already connected');
      return;
    }

    const url = `ws://${ipAddress}:${WEBSOCKET_DEFAULTS.port}${WEBSOCKET_DEFAULTS.path}`;
    console.log('[WebSocket] Connecting to:', url);
    setState(WebSocketState.CONNECTING);
    setError(null);

    const webSocket = new WebSocket(url);

    webSocket.onopen = () => {
      console.log('[WebSocket] Connected');
      setState(WebSocketState.CONNECTED);
      setError(null);
    };

    webSocket.onmessage = async (event) => {
      try {
        const text = event.data instanceof Blob ? await event.data.text() : event.data;
        const rawData = JSON.parse(text);
        if (APP.DEBUG) console.log('WebSocket received raw data:', rawData);
        const parsedData = parseWebSocketMessage(rawData);
        if (APP.DEBUG) console.log('WebSocket parsed data:', parsedData);
        setReceivedData(parsedData);
      } catch (err) {
        const error: WebSocketError = {
          name: 'WebSocketError',
          message: 'Failed to parse WebSocket message',
          timestamp: Date.now(),
        };
        if (APP.DEBUG) console.error('WebSocket message parse error:', err);
        setError(error);
      }
    };

    webSocket.onerror = (event) => {
      const error: WebSocketError = {
        name: 'WebSocketError',
        message: `接続エラー: ${ipAddress}:${WEBSOCKET_DEFAULTS.port}への接続に失敗しました`,
        code: 'CONNECTION_ERROR',
        timestamp: Date.now(),
      };
      if (APP.DEBUG) console.error('WebSocket error:', event);
      setState(WebSocketState.ERROR);
      setError(error);
    };

    webSocket.onclose = (event) => {
      console.log('[WebSocket] Closed:', event.code, event.reason);
      setState(WebSocketState.DISCONNECTED);
      setWs(null);

      // 自動再接続
      if (autoReconnect && state !== WebSocketState.ERROR) {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (APP.DEBUG) console.log('Attempting to reconnect...');
          connect();
        }, reconnectDelay);
      }
    };

    setWs(webSocket);
  }, [ipAddress, autoReconnect, reconnectDelay, ws, state]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (ws) {
      ws.close();
      setWs(null);
      setState(WebSocketState.DISCONNECTED);
      setError(null);
      setReceivedData(null); // 受信データをクリア
    }
  }, [ws]);

  const sendSP = useCallback((data: ControllerStatus) => {
    if (ws?.readyState === WebSocket.OPEN) {
      // SPモードのデータとして送信
      const message: SPWebSocketMessage = {
        ...data,
        mode: 'SP',
      };
      ws.send(JSON.stringify(message));
    }
  }, [ws]);

  const sendDP = useCallback((data: DPControllerStatus) => {
    if (ws?.readyState === WebSocket.OPEN) {
      // デバッグ用ログ追加
      if (APP.DEBUG) console.log('[WebSocket] Sending DP data:', data);
      ws.send(JSON.stringify(data));
    }
  }, [ws]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  return {
    ws,
    state,
    error,
    receivedData,
    connect,
    disconnect,
    sendSP,
    sendDP,
  };
}