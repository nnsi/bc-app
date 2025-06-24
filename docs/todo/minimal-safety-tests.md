# App.tsx リファクタリング前の最小限の安全性テスト

## 方針

UIテストは実装と密結合になるため、リファクタリング前は**ビジネスロジックの動作保証**に焦点を当てる。

## 優先度の高いテスト

### 1. 状態遷移のテスト（実装に依存しない）

```typescript
describe('App state transitions', () => {
  it('SPモード → DPモード切り替え時の状態変化', () => {
    const stateLogger = createStateLogger();
    
    // 初期状態
    expect(stateLogger.currentState).toEqual({
      mode: 'SP',
      gamepadAssignments: { sp: null, dp1p: null, dp2p: null },
      wsConnected: false
    });
    
    // DPモードに切り替え
    triggerModeChange('DP');
    
    // 期待される状態変化
    expect(stateLogger.transitions).toContain({
      from: { mode: 'SP' },
      to: { mode: 'DP' },
      sideEffects: ['resetGamepad', 'resetDPMapping', 'startAutoAssignment']
    });
  });
});
```

### 2. WebSocket通信プロトコルのテスト

```typescript
describe('WebSocket protocol', () => {
  it('SPモードのメッセージフォーマット', () => {
    const ws = new MockWebSocket();
    const message = captureWebSocketMessage(ws);
    
    // SPモードでデータ送信
    sendControllerData({
      mode: 'SP',
      keys: [true, false, false, false, false, false, false],
      scratch: 0
    });
    
    // プロトコルの検証（UIに依存しない）
    expect(JSON.parse(message)).toMatchObject({
      keys: expect.arrayContaining([
        { isPressed: true, strokeCount: expect.any(Number) }
      ]),
      scratch: { state: 0, count: expect.any(Number) },
      record: expect.any(Object)
    });
  });
});
```

### 3. 重要な副作用のテスト

```typescript
describe('Side effects', () => {
  it('localStorage への保存', () => {
    const storage = new MockLocalStorage();
    
    // プレイヤーサイド変更
    changePlayerSide('2P');
    expect(storage.getItem('playerSide')).toBe('2P');
    
    // 透過状態変更
    setTransparency(false);
    expect(storage.getItem('isTransparent')).toBe('false');
  });
  
  it('ゲームパッドポーリングの開始/停止', () => {
    const polling = new PollingMonitor();
    
    // SPモードでゲームパッド検出
    detectGamepad(0);
    expect(polling.intervals).toContain({ id: expect.any(Number), interval: 5 });
    
    // モード切り替えで停止
    changeMode('DP');
    expect(polling.clearedIntervals).toContain(expect.any(Number));
  });
});
```

### 4. 統合シナリオテスト（E2Eライク、でも実装非依存）

```typescript
describe('User scenarios', () => {
  it('シナリオ: SPモードでプレイ開始', async () => {
    const app = new AppSimulator();
    
    // 1. アプリ起動
    await app.start();
    expect(app.state.mode).toBe('SP');
    
    // 2. コントローラー接続
    await app.connectGamepad(0);
    expect(app.state.selectedGamepad).toBe(0);
    
    // 3. WebSocket接続確認
    expect(app.wsConnection.isConnected).toBe(true);
    
    // 4. ボタン入力
    await app.pressButton(0, 5);
    expect(app.wsConnection.lastMessage).toMatchObject({
      keys: expect.arrayContaining([
        expect.objectContaining({ isPressed: true })
      ])
    });
  });
});
```

## 実装の詳細に依存しないテストの書き方

### 1. Custom Testing DSL の作成

```typescript
// test/dsl/app-dsl.ts
export class AppTestDSL {
  async startInSPMode() {
    // 実装の詳細を隠蔽
  }
  
  async switchToDPMode() {
    // モード切り替えの実装詳細を隠蔽
  }
  
  async assignGamepads(p1: number, p2: number) {
    // DPモードの割り当て詳細を隠蔽
  }
  
  getState() {
    // 現在の論理的な状態を返す
  }
}
```

### 2. ビジネスルールのテスト

```typescript
describe('Business rules', () => {
  it('DPモードでは2つのゲームパッドが必要', () => {
    const rules = new BusinessRules();
    
    expect(rules.canStartDPMode({ gamepads: [0] })).toBe(false);
    expect(rules.canStartDPMode({ gamepads: [0, 1] })).toBe(true);
  });
  
  it('受信モードではローカルゲームパッドを無視', () => {
    const rules = new BusinessRules();
    
    const state = {
      mode: 'receive',
      localGamepad: 0,
      receivedData: mockData
    };
    
    expect(rules.getDisplayData(state)).toBe(mockData);
    expect(rules.shouldPollGamepad(state)).toBe(false);
  });
});
```

## リファクタリング後も残るテスト vs 書き直すテスト

### 残るテスト ✅
- WebSocketプロトコルのテスト
- ビジネスルールのテスト  
- 状態遷移のテスト
- 副作用（localStorage、タイマー）のテスト

### 書き直しが必要なテスト ❌
- DOM構造に依存したテスト
- コンポーネントの内部実装に依存したテスト
- スナップショットテスト（UI変更時）

## 推奨アプローチ

1. **Phase 1**: ビジネスロジックの抽出とテスト
   - 現在のApp.tsxからピュアな関数として抽出できる部分を先にテスト

2. **Phase 2**: 統合テストの最小限実装
   - 主要なユーザーシナリオのみをカバー
   - 実装詳細には依存しない

3. **Phase 3**: リファクタリング実施
   - ビジネスロジックのテストが通ることを確認しながら進める

4. **Phase 4**: UI層のテスト追加
   - リファクタリング後の新しい構造に合わせてUIテストを書く

## まとめ

完璧なE2Eテストを先に書くよりも、**変更に強いテスト**を優先的に書く方が、リファクタリングの成功率が高まります。UIの詳細なテストは、リファクタリング後の安定した構造に対して書く方が効率的です。