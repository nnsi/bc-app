# v0.0.7 Release Notes

## 新機能

### 設定ウィンドウの追加
- 別ウィンドウで開くコントローラー設定画面を追加
- スクラッチ保持時間、ポーリング間隔、ロングノート閾値、各種記録数をGUIから変更可能
- メインウィンドウからギアアイコンで設定画面を開ける
- Tauriイベント経由でメインウィンドウとリアルタイム連携

### 統計計算の改善
- `calculateStats` ユーティリティを新規追加し、統計計算ロジックを分離
- BeatStatus / BeatStatusDP の表示を改善
- 統計計算のユニットテストを追加

## リファクタリング

### App.tsx の大規模分割
- `SPMode` / `DPMode` コンポーネントを新規作成し、モード別ロジックを分離
- `AppContent` コンポーネントを削除し、App.tsx内で直接レンダリング
- `reloadKey` による強制remountパターンを導入し、リロード処理を簡素化

### フックの整理
- `useController` フックを統合・刷新（SP/DP共通化）
- `useGamepadPlugin` フックを新規追加
- 以下の不要なフックを削除:
  - `useDPController`
  - `useDPAssignmentRef`
  - `useModeChange`
  - `useLocalStorage`
  - `useMultiGamepadDetection`
  - `compareControllerStatus`

### その他
- `useGamepadDetection` / `useGamepadAssignment` / `useGamepadInfo` を簡素化
- `appBusinessLogic` のビジネスロジックを各コンポーネントへ移動
- テストコードを整理（不要なテストの削除、calculateStats テストの追加）
