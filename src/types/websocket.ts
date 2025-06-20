/**
 * WebSocket関連の型定義
 */

import { ControllerStatus, DPControllerStatus, PlayMode } from './controller';

/**
 * シングルプレイ時のWebSocketメッセージ
 */
export interface SPWebSocketMessage extends ControllerStatus {
  mode: 'SP';
}

/**
 * WebSocketメッセージの型
 * SPモードとDPモードの両方に対応
 */
export type WebSocketMessage = 
  | ControllerStatus // 後方互換性のため
  | SPWebSocketMessage
  | DPControllerStatus;

/**
 * WebSocket接続状態
 */
export enum WebSocketState {
  /** 未接続 */
  DISCONNECTED = 'disconnected',
  /** 接続中 */
  CONNECTING = 'connecting',
  /** 接続済み */
  CONNECTED = 'connected',
  /** エラー */
  ERROR = 'error',
}

/**
 * WebSocket設定
 */
export interface WebSocketConfig {
  /** 接続先IPアドレス */
  ipAddress: string;
  /** ポート番号 */
  port: number;
  /** エンドポイントパス */
  path: string;
}

/**
 * WebSocketのデフォルト設定
 */
export const WEBSOCKET_DEFAULTS: WebSocketConfig = {
  ipAddress: '127.0.0.1',
  port: 2356,
  path: '/ws',
} as const;

/**
 * WebSocketエラーの型
 */
export interface WebSocketError {
  /** エラーメッセージ */
  message: string;
  /** エラーコード（あれば） */
  code?: string | number;
  /** エラー発生時刻 */
  timestamp: number;
}