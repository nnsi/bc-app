# App.tsx リファクタリング計画 (2025年版)

## 現状分析

### ファイル概要
- **行数**: 400行
- **責務**: メインアプリケーションコンポーネント
- **問題点**: 多数の責務が混在し、可読性・保守性が低下

### 主な問題点

#### 1. 状態管理の複雑さ
- 10個以上のuseStateが混在
- localStorage管理ロジックが分散
- ref管理が複雑（dpAssignmentRef、prevControllerStatusRef等）

#### 2. useEffectの多用（11個）
- ゲームパッド検出（69-86行）
- DPモード自動割り当て（112-117行）
- WebSocket接続（134-142行）
- localStorage管理（185-198行）
- プレイモード変更処理（201-230行）
- コントローラーデータ送信（236-256行）
- その他多数

#### 3. 条件分岐の複雑さ
```
- isReceiveMode ? A : B
- settings.playMode.mode === 'SP' ? X : Y
- dpControllerStatus && settings.playMode.dp1PGamepadIndex !== null && ...
```

#### 4. 責務の混在
- UI表示ロジック
- ゲームパッド管理
- WebSocket通信制御
- モード切り替え処理
- localStorage管理
- エラーハンドリング

## リファクタリング方針

### 1. レイヤー分離
```
App.tsx (UIレイヤー)
  ↓
Container Components (ロジックレイヤー)
  ↓
Custom Hooks (ビジネスロジック)
  ↓
Services (外部連携)
```

### 2. 状態管理の統合
- 関連する状態をまとめて管理
- Context APIまたはカスタムフックでの状態管理

### 3. 責務の分離
- 各機能を独立したモジュールに分離
- 単一責任の原則の適用

## 実装計画

### Phase 1: 状態管理の整理

#### 1.1 LocalStorage管理の統合
**新規作成**: `hooks/useLocalStorage.ts`
```typescript
// プレイヤーサイド、透過状態などのlocalStorage管理を統合
export const useLocalStorage = () => {
  const [playerSide, setPlayerSide] = useLocalStorageState('playerSide', '1P');
  const [isTransparent, setIsTransparent] = useLocalStorageState('isTransparent', true);
  return { playerSide, setPlayerSide, isTransparent, setIsTransparent };
};
```

#### 1.2 ゲームパッド状態管理の統合
**新規作成**: `hooks/useGamepadState.ts`
```typescript
// ゲームパッド関連の状態とロジックを統合
export const useGamepadState = () => {
  // gamepads、selectedGamepadIndex、dpAssignmentRefなどを統合管理
};
```

### Phase 2: ロジックの分離

#### 2.1 モード切り替えロジックの分離
**新規作成**: `hooks/useModeSwitch.ts`
```typescript
// SPモード/DPモード切り替え時の複雑なロジックを分離
export const useModeSwitch = () => {
  // 201-230行のロジックを移動
};
```

#### 2.2 WebSocket通信ロジックの強化
**更新**: `hooks/useWebSocketDP.ts`
- コントローラーデータ送信ロジック（236-256行）を移動
- 接続管理ロジック（134-142行）を移動

#### 2.3 自動接続・検出ロジックの統合
**新規作成**: `hooks/useAutoConnection.ts`
```typescript
// DPモード自動割り当て、SPモード自動検出を統合
export const useAutoConnection = () => {
  // 自動接続・検出に関するロジックを統合
};
```

### Phase 3: UIコンポーネントの分離

#### 3.1 コンテナコンポーネントの作成
**新規作成**: `containers/GamepadSetupContainer.tsx`
```typescript
// ゲームパッド設定関連のUIロジックを管理
// GamepadSelector、DPGamepadSelector、ConnectionSettingsを統合
```

**新規作成**: `containers/ControllerContainer.tsx`
```typescript
// コントローラー表示関連のUIロジックを管理
// SPモード/DPモードの表示切り替えロジックを含む
```

#### 3.2 表示ロジックの簡素化
**新規作成**: `components/AppContent.tsx`
```typescript
// 条件分岐を整理し、表示ロジックを簡素化
interface AppContentProps {
  mode: 'setup' | 'playing' | 'waiting';
  playMode: 'SP' | 'DP';
  // その他必要なprops
}
```

### Phase 4: App.tsxの簡素化

#### 目標構造
```typescript
function App() {
  // 統合されたカスタムフックの使用
  const { playerSide, isTransparent, ... } = useAppState();
  const { mode, displayContent } = useAppContent();
  
  return (
    <AppProvider>
      <AppLayout isTransparent={isTransparent}>
        <AppHeader {...headerProps} />
        <AppContent mode={mode} content={displayContent} />
      </AppLayout>
    </AppProvider>
  );
}
```

目標行数: **100行以下**

## 実装優先順位

### 高優先度
1. **useLocalStorage.ts** - localStorage管理の統合
2. **useModeSwitch.ts** - モード切り替えロジックの分離
3. **useGamepadState.ts** - ゲームパッド状態管理の統合

### 中優先度
4. **GamepadSetupContainer.tsx** - セットアップUIの統合
5. **ControllerContainer.tsx** - コントローラー表示の統合
6. **useAutoConnection.ts** - 自動接続ロジックの統合

### 低優先度
7. **AppContent.tsx** - 表示ロジックの簡素化
8. **App.tsxの最終整理** - 全体の統合

## 期待される効果

### 定量的効果
- App.tsxの行数: 400行 → 100行以下（75%削減）
- useEffectの数: 11個 → 3個以下
- 条件分岐の深さ: 最大4段 → 最大2段

### 定性的効果
- 各機能の独立性向上
- テスタビリティの向上
- 新機能追加時の影響範囲の限定
- コードの可読性向上
- デバッグの容易化

## 注意事項

1. **既存機能の維持**
   - すべての既存機能を維持すること
   - WebSocket通信の互換性を保つこと

2. **段階的な実装**
   - 各Phaseごとに動作確認を実施
   - 問題があれば即座にロールバック

3. **パフォーマンス**
   - 不要な再レンダリングを防ぐ
   - React.memo、useCallbackの適切な使用

4. **型安全性**
   - TypeScriptの型定義を厳密に維持
   - any型の使用を避ける

## チェックリスト

### Phase 1完了条件
- [ ] localStorage管理が統合されている
- [ ] ゲームパッド状態管理が統合されている
- [ ] 既存機能がすべて動作する

### Phase 2完了条件
- [ ] モード切り替えロジックが分離されている
- [ ] WebSocket通信ロジックが統合されている
- [ ] 自動接続ロジックが統合されている

### Phase 3完了条件
- [ ] UIコンテナコンポーネントが作成されている
- [ ] 表示ロジックが簡素化されている
- [ ] 条件分岐が整理されている

### Phase 4完了条件
- [ ] App.tsxが100行以下になっている
- [ ] すべての機能が正常に動作する
- [ ] コードレビューが完了している

## 次のステップ

1. この計画のレビューと承認
2. Phase 1の実装開始
3. 各Phaseごとの動作確認とフィードバック
4. 必要に応じて計画の調整

---

作成日: 2025-06-23
最終更新: 2025-06-23