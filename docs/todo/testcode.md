# フロントエンドテスト戦略

## 概要

このドキュメントは、IIDXコントローラー入力トラッカーアプリケーションのフロントエンドテスト戦略を定義します。実機のUSBコントローラーやWebSocket通信といった外部依存を持つアプリケーションを、モックを活用してテスト可能にする方法を説明します。

## 現状分析

### 外部依存関係
1. **Tauriプラグイン** - `tauri-plugin-gamepad-api`でゲームパッドにアクセス
2. **WebSocket API** - サーバー/クライアント間の通信
3. **Gamepad API** - ブラウザのGamepad APIを使用
4. **タイマー** - `setInterval`による5ms間隔のポーリング

### テスト対象となる主要コンポーネント

#### フック
- `useDPController` - ゲームパッドの状態管理
- `useWebSocketDP` - WebSocket接続管理
- `useGamepadDetection` - ゲームパッド検出
- `useMultiGamepadDetection` - 複数ゲームパッド検出
- `useGamepadAssignment` - ゲームパッド割り当て

#### コンポーネント
- `IIDXController` / `IIDXControllerDP` - コントローラー表示
- `BeatStatus` / `BeatStatusDP` - 統計情報表示
- `GamepadSelector` / `DPGamepadSelector` - ゲームパッド選択UI

## テスト戦略

### 1. テスト環境のセットアップ

```bash
# 必要なパッケージのインストール
npm install -D vitest @vitest/ui happy-dom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @vitejs/plugin-react
```

#### Vitest設定ファイル
```typescript
// vitest.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

#### テストセットアップファイル
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup()
})

// グローバルモック
Object.defineProperty(window, '__TAURI_INTERNALS__', {
  value: {},
  writable: true,
})
```

### 2. モックの実装

#### Tauriプラグインのモック
```typescript
// __mocks__/tauri-plugin-gamepad-api.ts
import { vi } from 'vitest';

export const getGamepads = vi.fn(() => [
  {
    id: "Xbox Controller",
    index: 0,
    connected: true,
    buttons: [
      { pressed: false, touched: false, value: 0 },
      // ... 他のボタン
    ],
    axes: [0, 0, 0, 0],
  }
]);
```

#### WebSocketのモック
```typescript
// __mocks__/websocket.ts
import { vi } from 'vitest';

export class MockWebSocket {
  readyState = WebSocket.OPEN;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  send = vi.fn();
  close = vi.fn();

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }
}
```

#### Tauri APIのモック
```typescript
// __mocks__/@tauri-apps/api.ts
export const mockTauriAPI = {
  window: {
    __TAURI_INTERNALS__: true,
  }
};

// テストセットアップで設定
beforeEach(() => {
  global.window.__TAURI_INTERNALS__ = {};
});
```

### 3. テストケースの実装例

#### useDPControllerのテスト
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDPController } from '../hooks/useDPController';
import * as gamepadAPI from 'tauri-plugin-gamepad-api';

vi.mock('tauri-plugin-gamepad-api');

describe('useDPController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(gamepadAPI.getGamepads).mockReturnValue([
      createMockGamepad(0),
      createMockGamepad(1),
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('SPモードでコントローラー状態を取得できる', () => {
    const { result } = renderHook(() => 
      useDPController({
        playMode: 'SP',
        spGamepadIndex: 0,
        dp1PGamepadIndex: null,
        dp2PGamepadIndex: null,
      })
    );

    act(() => {
      vi.advanceTimersByTime(5); // ポーリング間隔
    });

    expect(result.current.spControllerStatus).toBeDefined();
    expect(result.current.dpControllerStatus).toBeUndefined();
  });

  it('ボタン押下を検出できる', () => {
    const mockGamepad = createMockGamepad(0);
    vi.mocked(gamepadAPI.getGamepads).mockReturnValue([mockGamepad]);

    const { result } = renderHook(() => 
      useDPController({
        playMode: 'SP',
        spGamepadIndex: 0,
        dp1PGamepadIndex: null,
        dp2PGamepadIndex: null,
      })
    );

    // ボタンを押下
    act(() => {
      mockGamepad.buttons[5].pressed = true;
      vi.advanceTimersByTime(5);
    });

    expect(result.current.spControllerStatus?.keys[0].isPressed).toBe(true);
    expect(result.current.spControllerStatus?.keys[0].strokeCount).toBe(1);
  });
});
```

#### WebSocket接続のテスト
```typescript
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocketDP } from '../hooks/useWebSocketDP';
import { MockWebSocket } from '../__mocks__/websocket';

beforeAll(() => {
  global.WebSocket = MockWebSocket as any;
});

describe('useWebSocketDP', () => {
  it('WebSocket接続を確立できる', async () => {
    const { result } = renderHook(() => 
      useWebSocketDP({ ipAddress: '127.0.0.1' })
    );

    act(() => {
      result.current.connect();
    });

    expect(result.current.state).toBe(WebSocketState.CONNECTED);
  });

  it('受信データを正しくパースできる', async () => {
    const { result } = renderHook(() => useWebSocketDP());
    const mockWs = result.current.ws as MockWebSocket;

    const testData = {
      mode: 'SP',
      keys: [],
      scratch: { state: 0 },
      record: { releaseTimes: [] }
    };

    act(() => {
      mockWs.simulateMessage(testData);
    });

    expect(result.current.receivedData).toEqual(testData);
  });
});
```

#### コンポーネントのテスト
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IIDXController } from '../components/IIDXController';

describe('IIDXController', () => {
  const mockControllerStatus = {
    keys: Array(7).fill({ isPressed: false, strokeCount: 0 }),
    scratch: { state: 0, count: 0 },
    record: { releaseTimes: [], pressedTimes: [] }
  };

  it('7つのキーが表示される', () => {
    render(
      <IIDXController 
        mode="client"
        controllerStatus={mockControllerStatus}
      />
    );

    const keys = screen.getAllByTestId(/key-\d/);
    expect(keys).toHaveLength(7);
  });

  it('押下されたキーがハイライトされる', () => {
    const statusWithPressedKey = {
      ...mockControllerStatus,
      keys: mockControllerStatus.keys.map((key, i) => 
        i === 0 ? { ...key, isPressed: true } : key
      )
    };

    render(
      <IIDXController 
        mode="client"
        controllerStatus={statusWithPressedKey}
      />
    );

    const firstKey = screen.getByTestId('key-0');
    expect(firstKey).toHaveClass('pressed');
  });
});
```

### 4. E2Eテストの考慮事項

実機テストが必要な場合のアプローチ：

1. **テスト用モードの実装**
   - アプリケーションに`--test-mode`フラグを追加
   - テストモードでは仮想ゲームパッドを使用

2. **記録再生機能**
   - 実機の入力を記録してJSONファイルに保存
   - テスト時に記録を再生してシミュレート

3. **Cypress/Playwrightの活用**
   - WebSocket通信のインターセプト
   - カスタムコマンドでゲームパッド入力をシミュレート

### 5. CI/CD統合

```yaml
# .github/workflows/test.yml
name: Frontend Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

### 6. 段階的な実装計画

1. **Phase 1: 基本的なユニットテスト**
   - ユーティリティ関数のテスト
   - 純粋な計算ロジックのテスト

2. **Phase 2: フックのテスト**
   - モックを使用したフックのテスト
   - 状態管理のテスト

3. **Phase 3: コンポーネントのテスト**
   - 表示ロジックのテスト
   - ユーザーインタラクションのテスト

4. **Phase 4: 統合テスト**
   - コンポーネント間の連携テスト
   - WebSocket通信のテスト

5. **Phase 5: E2Eテスト**
   - 実際の使用シナリオのテスト
   - パフォーマンステスト

### 7. テストのベストプラクティス

1. **AAA (Arrange-Act-Assert) パターンの使用**
2. **テストデータビルダーの作成**
3. **カスタムレンダラーの実装**（Context Providerなど）
4. **テストの独立性の確保**
5. **意味のあるテスト名の使用**

### 8. パフォーマンステストの考慮

```typescript
// 5ms間隔のポーリングのパフォーマンステスト
it('5ms間隔でのポーリングがパフォーマンスに影響しない', () => {
  const startTime = performance.now();
  
  const { result } = renderHook(() => useDPController(defaultProps));
  
  // 1秒間実行
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  
  const endTime = performance.now();
  const executionTime = endTime - startTime;
  
  // 実行時間が妥当な範囲内であることを確認
  expect(executionTime).toBeLessThan(100); // 100ms以下
});
```

## まとめ

このテスト戦略により、外部依存を持つアプリケーションでも高いテストカバレッジを達成できます。重要なのは、各層で適切なモックを用意し、段階的にテストを実装していくことです。