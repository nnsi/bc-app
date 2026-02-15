# IIDX Input Monitor

beatmania IIDX コントローラーの入力をリアルタイムで可視化するデスクトップアプリケーションです。

## 主な機能

- **リアルタイム入力表示** - 5ms間隔のポーリングによる高精度な入力追跡
- **SP / DP モード対応** - シングルプレイ・ダブルプレイの両方に対応
- **パフォーマンス統計** - リリース速度、回転距離、ストローク数などのメトリクスをリアルタイム表示
- **WebSocket ブロードキャスト** - 複数クライアントへのリアルタイムデータ共有
- **受信モード** - 別インスタンスからWebSocket経由でデータを受信して表示
- **透過ウィンドウ** - フレームレス・透過デザインでオーバーレイとして使用可能
- **状態の永続化** - ウィンドウ位置やゲームパッド設定をセッション間で保持

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド | React 18 + TypeScript + Vite |
| デスクトップ | Tauri 2 (Rust) |
| スタイリング | Tailwind CSS |
| リアルタイム通信 | WebSocket (Warp) |
| ゲームパッド | tauri-plugin-gamepad |

## セットアップ

### 必要なもの

- [Node.js](https://nodejs.org/)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)

### インストール

```bash
npm install
```

### 開発

```bash
npm run tauri dev
```

### ビルド

```bash
npm run tauri build
```

## アーキテクチャ

```
Gamepad (5ms polling)
  → useController Hook (状態キャプチャ)
    → React Components (表示)
      → WebSocket Server :2356 (ブロードキャスト)
        → 受信モードクライアント (リモート表示)
```

### ディレクトリ構成

```
src/
├── components/    # UIコンポーネント (IIDXController, BeatStatus, etc.)
├── hooks/         # カスタムフック (useController, useWebSocketDP, etc.)
├── types/         # TypeScript型定義
├── contexts/      # アプリ設定コンテキスト
├── constants/     # 定数・設定値
└── utils/         # ビジネスロジック・ユーティリティ

src-tauri/
└── src/main.rs    # WebSocketサーバー + Tauriセットアップ
```

### コントローラーマッピング

| 物理ボタン | 5 | 1 | 2 | 4 | 7 | 8 | 9 |
|-----------|---|---|---|---|---|---|---|
| IIDX鍵盤  | 1 | 2 | 3 | 4 | 5 | 6 | 7 |

## テスト

```bash
npm run test
npm run test:ui        # Vitest UI
npm run test:coverage  # カバレッジレポート
```
