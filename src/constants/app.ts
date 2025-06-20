/**
 * アプリケーション全体で使用する定数
 */

/**
 * WebSocket関連の定数
 */
export const WEBSOCKET = {
  /** デフォルトのIPアドレス */
  DEFAULT_IP: '127.0.0.1',
  /** WebSocketサーバーのポート番号 */
  PORT: 2356,
  /** WebSocketのエンドポイントパス */
  PATH: '/ws',
} as const;

/**
 * ゲームパッド自動検出の定数
 */
export const GAMEPAD_DETECTION = {
  /** 自動検出の間隔（ミリ秒） */
  INTERVAL: 100,
} as const;

/**
 * アプリケーションモード
 */
export enum AppMode {
  /** クライアントモード（ローカルのゲームパッドを使用） */
  CLIENT = 'client',
  /** サーバーモード（WebSocket経由でデータを配信） */
  SERVER = 'server',
}

/**
 * UI関連の定数
 */
export const UI = {
  /** ウィンドウサイズ */
  WINDOW: {
    WIDTH: 410,
    HEIGHT: 250,
  },
  /** ヘッダーの高さ（ピクセル） */
  HEADER_HEIGHT: 30,
} as const;

/**
 * その他のアプリケーション定数
 */
export const APP = {
  /** アプリケーション名 */
  NAME: 'IIDX Input Monitor',
  /** デバッグモード（開発環境でのみtrue） */
  DEBUG: import.meta.env.DEV,
} as const;