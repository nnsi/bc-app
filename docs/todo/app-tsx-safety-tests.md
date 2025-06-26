# App.tsx リファクタリング前の安全性確保テスト計画

## 概要

App.tsxの大規模リファクタリングを安全に実施するため、現在の動作を保証するテストスイートを事前に構築します。これにより、リファクタリング中に既存機能が壊れていないことを継続的に確認できます。

## テスト戦略

### 原則
1. **Golden Path Testing** - 正常系の主要シナリオを網羅
2. **Regression Testing** - 現在の動作を厳密に記録・検証
3. **Integration Testing** - コンポーネント間の連携を確認
4. **Snapshot Testing** - UIの見た目の変更を検出

## 必要なテストケース

### 1. 初期化とモード切り替えテスト

#### 1.1 アプリケーション初期化
```typescript
describe('App initialization', () => {
  it('初期状態でSPモードで起動する', () => {
    const { container } = render(<App />);
    expect(screen.getByText('SP')).toBeInTheDocument();
    expect(screen.queryByText('DP')).not.toBeInTheDocument();
  });

  it('localStorageからプレイヤーサイドを復元する', () => {
    localStorage.setItem('playerSide', '2P');
    render(<App />);
    // 2P設定が適用されていることを確認
  });

  it('localStorageから透過状態を復元する', () => {
    localStorage.setItem('isTransparent', 'false');
    render(<App />);
    expect(document.body).toHaveClass('non-transparent');
  });
});
```

#### 1.2 モード切り替え
```typescript
describe('Mode switching', () => {
  it('SPモードからDPモードへの切り替え', async () => {
    const { user } = setup();
    
    // DPモードボタンをクリック
    await user.click(screen.getByText('DP'));
    
    // DPモード特有のUIが表示される
    expect(screen.getByText('1P側コントローラーのボタンを押してください')).toBeInTheDocument();
    
    // WebSocket接続が切断される
    expect(mockWebSocket.close).toHaveBeenCalled();
  });

  it('DPモードからSPモードへの切り替え', async () => {
    // DPモードで開始
    mockSettings.playMode.mode = 'DP';
    const { user } = setup();
    
    // SPモードボタンをクリック
    await user.click(screen.getByText('SP'));
    
    // SPモード特有のUIが表示される
    expect(screen.getByText('コントローラーのボタンを押してください')).toBeInTheDocument();
    
    // DPモードの割り当てがリセットされる
    expect(mockResetDPGamepadMapping).toHaveBeenCalled();
  });
});
```

### 2. ゲームパッド検出と割り当てテスト

#### 2.1 SPモードのゲームパッド検出
```typescript
describe('SP mode gamepad detection', () => {
  it('ゲームパッドボタン押下で自動検出される', async () => {
    const { rerender } = render(<App />);
    
    // ゲームパッドのボタンを押下シミュレート
    mockGamepadAPI.simulateButtonPress(0, 5);
    
    act(() => {
      vi.advanceTimersByTime(100); // 検出間隔
    });
    
    // コントローラー画面が表示される
    expect(screen.getByTestId('iidx-controller')).toBeInTheDocument();
    
    // WebSocket接続が開始される
    expect(mockWebSocket.connect).toHaveBeenCalled();
  });
});
```

#### 2.2 DPモードの自動割り当て
```typescript
describe('DP mode auto assignment', () => {
  it('DPモードで自動割り当てが開始される', async () => {
    const { user } = setup();
    
    // DPモードに切り替え
    await user.click(screen.getByText('DP'));
    
    // 自動割り当てメッセージが表示される
    expect(screen.getByText('1P側コントローラーのボタンを押してください')).toBeInTheDocument();
    
    // 1P側ボタン押下
    mockGamepadAPI.simulateButtonPress(0, 5);
    act(() => vi.advanceTimersByTime(100));
    
    // 2P側メッセージに切り替わる
    expect(screen.getByText('2P側コントローラーのボタンを押してください')).toBeInTheDocument();
    
    // 2P側ボタン押下
    mockGamepadAPI.simulateButtonPress(1, 5);
    act(() => vi.advanceTimersByTime(100));
    
    // DPコントローラー画面が表示される
    expect(screen.getByTestId('iidx-controller-dp')).toBeInTheDocument();
  });
});
```

### 3. WebSocket通信テスト

#### 3.1 データ送信テスト
```typescript
describe('WebSocket data transmission', () => {
  it('SPモードでコントローラーデータを送信する', async () => {
    setup();
    
    // ゲームパッド検出
    mockGamepadAPI.simulateButtonPress(0, 5);
    act(() => vi.advanceTimersByTime(100));
    
    // ボタン状態を変更
    mockGamepadAPI.simulateButtonPress(0, 1);
    act(() => vi.advanceTimersByTime(5)); // ポーリング間隔
    
    // 送信データを検証
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      expect.stringContaining('"keys"')
    );
    
    const sentData = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
    expect(sentData.keys[1].isPressed).toBe(true);
  });

  it('DPモードで両プレイヤーのデータを送信する', async () => {
    // DPモードセットアップ
    await setupDPMode();
    
    // 1Pボタン押下
    mockGamepadAPI.simulateButtonPress(0, 5);
    // 2Pボタン押下
    mockGamepadAPI.simulateButtonPress(1, 1);
    
    act(() => vi.advanceTimersByTime(5));
    
    const sentData = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
    expect(sentData.mode).toBe('DP');
    expect(sentData.player1.keys[0].isPressed).toBe(true);
    expect(sentData.player2.keys[1].isPressed).toBe(true);
  });
});
```

#### 3.2 受信モードテスト
```typescript
describe('Receive mode', () => {
  it('受信モードに切り替えて外部データを表示する', async () => {
    const { user } = setup();
    
    // 受信モードボタンをクリック
    await user.click(screen.getByText('受信モード'));
    
    // 待機メッセージが表示される
    expect(screen.getByText('受信モードで待機中...')).toBeInTheDocument();
    
    // SPモードデータを受信
    const spData = {
      keys: Array(7).fill({ isPressed: false, strokeCount: 0 }),
      scratch: { state: 0, count: 0 },
      record: { releaseTimes: [], pressedTimes: [] }
    };
    
    mockWebSocket.simulateMessage(spData);
    
    // コントローラーが表示される
    expect(screen.getByTestId('iidx-controller')).toBeInTheDocument();
  });

  it('受信モードでDPデータを正しく表示する', async () => {
    const { user } = setup();
    await user.click(screen.getByText('受信モード'));
    
    // DPモードデータを受信
    const dpData = {
      mode: 'DP',
      player1: createMockControllerStatus(),
      player2: createMockControllerStatus()
    };
    
    mockWebSocket.simulateMessage(dpData);
    
    // DPコントローラーが表示される
    expect(screen.getByTestId('iidx-controller-dp')).toBeInTheDocument();
  });
});
```

### 4. UIインタラクションテスト

#### 4.1 プレイヤーサイド切り替え
```typescript
describe('Player side switching', () => {
  it('1P/2P切り替えが正しく動作する', async () => {
    await setupSPMode();
    const { user } = setup();
    
    // 初期状態は1P
    expect(screen.getByText('1P')).toHaveAttribute('aria-pressed', 'true');
    
    // 2Pをクリック
    await user.click(screen.getByText('2P'));
    
    // 2Pがアクティブになる
    expect(screen.getByText('2P')).toHaveAttribute('aria-pressed', 'true');
    
    // localStorageに保存される
    expect(localStorage.getItem('playerSide')).toBe('2P');
  });
});
```

#### 4.2 透過モード切り替え
```typescript
describe('Transparency toggle', () => {
  it('透過モードの切り替えが動作する', async () => {
    const { user } = setup();
    
    // 透過ボタンをクリック
    const transparencyButton = screen.getByLabelText('Toggle transparency');
    await user.click(transparencyButton);
    
    // bodyクラスが更新される
    expect(document.body).toHaveClass('non-transparent');
    
    // localStorageに保存される
    expect(localStorage.getItem('isTransparent')).toBe('false');
  });
});
```

### 5. エラーハンドリングテスト

```typescript
describe('Error handling', () => {
  it('WebSocket接続エラーを表示する', async () => {
    setup();
    
    // WebSocket接続エラーをシミュレート
    mockWebSocket.simulateError(new Error('Connection failed'));
    
    // エラーメッセージが表示される
    expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
    
    // リトライボタンが表示される
    expect(screen.getByText('再接続')).toBeInTheDocument();
  });

  it('ゲームパッド検出エラーを表示する', async () => {
    // ゲームパッドAPIエラーをシミュレート
    mockGamepadAPI.simulateError(new Error('Gamepad not supported'));
    
    render(<App />);
    
    // エラーメッセージが表示される
    expect(screen.getByText(/Gamepad not supported/)).toBeInTheDocument();
  });
});
```

### 6. 状態の一貫性テスト

```typescript
describe('State consistency', () => {
  it('リロード時に状態が正しくリセットされる', async () => {
    const { user } = setup();
    await setupSPMode();
    
    // リロードボタンをクリック
    await user.click(screen.getByLabelText('Reload'));
    
    // 各種リセット関数が呼ばれる
    expect(mockResetCount).toHaveBeenCalled();
    expect(mockResetGamepad).toHaveBeenCalled();
    expect(mockDisconnectWebSocket).toHaveBeenCalled();
    expect(mockResetMode).toHaveBeenCalled();
  });

  it('モード切り替え時にデータ送信が停止する', async () => {
    await setupSPMode();
    
    // データ送信を確認
    mockGamepadAPI.simulateButtonPress(0, 1);
    act(() => vi.advanceTimersByTime(5));
    const initialCallCount = mockWebSocket.send.mock.calls.length;
    
    // DPモードに切り替え
    const { user } = setup();
    await user.click(screen.getByText('DP'));
    
    // データ送信が停止する
    mockGamepadAPI.simulateButtonPress(0, 1);
    act(() => vi.advanceTimersByTime(5));
    expect(mockWebSocket.send).toHaveBeenCalledTimes(initialCallCount);
  });
});
```

## スナップショットテスト

```typescript
describe('UI Snapshots', () => {
  it('SPモード初期画面', () => {
    const { container } = render(<App />);
    expect(container).toMatchSnapshot('sp-mode-initial');
  });

  it('DPモード初期画面', async () => {
    const { container, user } = setup();
    await user.click(screen.getByText('DP'));
    expect(container).toMatchSnapshot('dp-mode-initial');
  });

  it('SPモードプレイ画面', async () => {
    const { container } = await setupSPMode();
    expect(container).toMatchSnapshot('sp-mode-playing');
  });

  it('DPモードプレイ画面', async () => {
    const { container } = await setupDPMode();
    expect(container).toMatchSnapshot('dp-mode-playing');
  });

  it('受信モード待機画面', async () => {
    const { container, user } = setup();
    await user.click(screen.getByText('受信モード'));
    expect(container).toMatchSnapshot('receive-mode-waiting');
  });
});
```

## テストヘルパー関数

```typescript
// test/helpers/setup.ts
export const setup = () => {
  const user = userEvent.setup();
  const utils = render(
    <TestProviders>
      <App />
    </TestProviders>
  );
  return { user, ...utils };
};

export const setupSPMode = async () => {
  const result = setup();
  
  // SPモードでゲームパッド検出
  mockGamepadAPI.simulateButtonPress(0, 5);
  act(() => vi.advanceTimersByTime(100));
  
  await waitFor(() => {
    expect(screen.getByTestId('iidx-controller')).toBeInTheDocument();
  });
  
  return result;
};

export const setupDPMode = async () => {
  const { user, ...utils } = setup();
  
  // DPモードに切り替え
  await user.click(screen.getByText('DP'));
  
  // 1P割り当て
  mockGamepadAPI.simulateButtonPress(0, 5);
  act(() => vi.advanceTimersByTime(100));
  
  // 2P割り当て
  mockGamepadAPI.simulateButtonPress(1, 5);
  act(() => vi.advanceTimersByTime(100));
  
  await waitFor(() => {
    expect(screen.getByTestId('iidx-controller-dp')).toBeInTheDocument();
  });
  
  return { user, ...utils };
};

export const createMockControllerStatus = (): ControllerStatus => ({
  keys: Array(7).fill({ isPressed: false, strokeCount: 0 }),
  scratch: { state: 0, count: 0 },
  record: { releaseTimes: [], pressedTimes: [] }
});
```

## 実装優先順位

### Phase 0: テスト環境構築（リファクタリング前に必須）
1. テストセットアップとモックの準備
2. テストヘルパー関数の実装
3. CI環境でのテスト実行確認

### Phase 1: クリティカルパステスト（最優先）
1. 初期化テスト
2. モード切り替えテスト
3. 基本的なUIスナップショット

### Phase 2: 機能テスト（高優先）
1. ゲームパッド検出テスト
2. WebSocket送信テスト
3. 受信モードテスト

### Phase 3: UIインタラクションテスト（中優先）
1. プレイヤーサイド切り替え
2. 透過モード切り替え
3. リロード機能

### Phase 4: エラーと状態管理テスト（低優先）
1. エラーハンドリング
2. 状態の一貫性
3. 詳細なスナップショット

## 成功基準

1. **カバレッジ目標**: App.tsx関連コードの80%以上
2. **実行時間**: 全テストが30秒以内に完了
3. **安定性**: フレーキーなテストがない
4. **保守性**: テストコードが理解しやすく修正しやすい

## 注意事項

1. **タイマーのモック**: `vi.useFakeTimers()`を使用してポーリングを制御
2. **非同期処理**: `waitFor`や`act`を適切に使用
3. **クリーンアップ**: 各テスト後に状態を確実にリセット
4. **実装詳細への依存を避ける**: ユーザー視点でのテストを心がける

これらのテストが整備されれば、App.tsxのリファクタリングを安心して進められます。