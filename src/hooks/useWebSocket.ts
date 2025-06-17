/**
 * WebSocket接続を管理するカスタムフック
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { WebSocketState, WebSocketError, WEBSOCKET_DEFAULTS } from '../types/websocket';
import { ControllerStatus } from '../types/controller';
import { APP } from '../constants/app';

interface UseWebSocketProps {
  /** 接続先IPアドレス */
  ipAddress?: string;
  /** 自動再接続を有効にするか */
  autoReconnect?: boolean;
  /** 再接続の遅延時間（ミリ秒） */
  reconnectDelay?: number;
}

interface UseWebSocketReturn {
  /** WebSocket接続 */
  ws: WebSocket | null;
  /** 接続状態 */
  state: WebSocketState;
  /** エラー情報 */
  error: WebSocketError | null;
  /** 受信したデータ */
  receivedData: ControllerStatus | null;
  /** WebSocketに接続 */
  connect: () => void;
  /** WebSocketを切断 */
  disconnect: () => void;
  /** データを送信 */
  send: (data: ControllerStatus) => void;
}

/**
 * WebSocket接続を管理するカスタムフック
 * 
 * @example
 * ```tsx
 * const { ws, state, connect, disconnect, send, receivedData } = useWebSocket({
 *   ipAddress: '192.168.1.100',
 *   autoReconnect: true,
 * });
 * ```
 */
export function useWebSocket({
  ipAddress = WEBSOCKET_DEFAULTS.ipAddress,
  autoReconnect = false,
  reconnectDelay = 1000,
}: UseWebSocketProps = {}): UseWebSocketReturn {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [state, setState] = useState<WebSocketState>(WebSocketState.DISCONNECTED);
  const [error, setError] = useState<WebSocketError | null>(null);
  const [receivedData, setReceivedData] = useState<ControllerStatus | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      if (APP.DEBUG) console.log('WebSocket already connected');
      return;
    }

    setState(WebSocketState.CONNECTING);
    setError(null);

    const webSocket = new WebSocket(
      `ws://${ipAddress}:${WEBSOCKET_DEFAULTS.port}${WEBSOCKET_DEFAULTS.path}`
    );

    webSocket.onopen = () => {
      if (APP.DEBUG) console.log('WebSocket connected');
      setState(WebSocketState.CONNECTED);
      setError(null);
    };

    webSocket.onmessage = async (event) => {
      try {
        const text = event.data instanceof Blob ? await event.data.text() : event.data;
        const data = JSON.parse(text) as ControllerStatus;
        setReceivedData(data);
      } catch (err) {
        const error: WebSocketError = {
          message: 'Failed to parse WebSocket message',
          timestamp: Date.now(),
        };
        if (APP.DEBUG) console.error('WebSocket message parse error:', err);
        setError(error);
      }
    };

    webSocket.onerror = (event) => {
      const error: WebSocketError = {
        message: `接続エラー: ${ipAddress}:${WEBSOCKET_DEFAULTS.port}への接続に失敗しました`,
        code: 'CONNECTION_ERROR',
        timestamp: Date.now(),
      };
      if (APP.DEBUG) console.error('WebSocket error:', event);
      setState(WebSocketState.ERROR);
      setError(error);
    };

    webSocket.onclose = (event) => {
      if (APP.DEBUG) console.log('WebSocket closed:', event.code, event.reason);
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
    }
  }, [ws]);

  const send = useCallback((data: ControllerStatus) => {
    if (ws?.readyState === WebSocket.OPEN) {
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
    send,
  };
}