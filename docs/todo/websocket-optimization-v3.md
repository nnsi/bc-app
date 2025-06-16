# WebSocket通信最適化計画 v3 - 受信側の継続的更新を考慮

## 課題の再認識

受信側でのメトリクス表示の同期には2つの要素があります：

1. **イベントの正確な記録**: キー押下/離しのタイミング（これは現在の計画でOK）
2. **時間窓の継続的な更新**: 「過去1秒間」の窓が常に移動する（これが課題）

## 問題点

```typescript
// 例: 現在時刻 1000ms
// 過去1秒間のイベント: [100ms, 300ms, 500ms, 700ms, 900ms] = 5回/秒

// 5ms後（現在時刻 1005ms）
// 過去1秒間のイベント: [100ms, 300ms, 500ms, 700ms, 900ms] = 5回/秒
// → 100msのイベントがまもなく1秒の窓から外れる

// 105ms後（現在時刻 1105ms）  
// 過去1秒間のイベント: [300ms, 500ms, 700ms, 900ms] = 4回/秒
// → 表示が5から4に変わるべきタイミング
```

受信側でこの「窓の移動」を正確に再現するには、送信側と同じ頻度で再計算が必要です。

## 解決案

### 案A: 受信側でも5ms間隔で再計算（非推奨）

```typescript
// 受信側
setInterval(() => {
  const metrics = calculateMetrics(); // 過去1秒のイベントを再計算
  updateUI(metrics);
}, 5);
```

**問題点**:
- 受信側でも高頻度の処理が必要
- 複数の受信クライアントで負荷が増大
- ブラウザでの5ms精度は保証されない

### 案B: メトリクスの事前計算と配信（推奨）

```typescript
interface OptimizedMessage {
  type: 'update';
  timestamp: number;
  
  // イベント情報（変化時のみ）
  events?: {
    keyChanges?: KeyChange[];
    scratchChange?: ScratchChange;
  };
  
  // 計算済みメトリクス（常に含む）
  metrics: {
    beatDensity: number;      // 現在の秒間打鍵数
    releaseAverage: number;   // 平均リリース時間
    activeKeys: number;       // 現在押されているキー数
  };
  
  // メトリクスの次回更新予定
  nextMetricChange?: {
    timestamp: number;        // いつ変わるか
    beatDensity?: number;     // 何に変わるか
  };
}
```

**送信側のロジック**:

```typescript
class SmartSender {
  private eventHistory: TimeRecord[] = [];
  private lastSentMetrics: Metrics;
  private lastSentEvents: Set<string> = new Set();
  
  onPoll(status: ControllerStatus) {
    const now = Date.now();
    const message: OptimizedMessage = {
      type: 'update',
      timestamp: now,
      metrics: this.calculateCurrentMetrics(now)
    };
    
    // 1. イベントの検出（変化があれば含める）
    const events = this.detectEvents(status);
    if (events.length > 0) {
      message.events = events;
    }
    
    // 2. メトリクスが変化したか確認
    const metricsChanged = this.hasMetricsChanged(message.metrics);
    
    // 3. 次にメトリクスが変わるタイミングを予測
    const nextChange = this.predictNextMetricChange(now);
    if (nextChange) {
      message.nextMetricChange = nextChange;
    }
    
    // 4. 送信判断
    if (message.events || metricsChanged || this.shouldSendHeartbeat(now)) {
      this.send(message);
      this.lastSentMetrics = message.metrics;
      this.lastSentTime = now;
    }
  }
  
  private predictNextMetricChange(now: number): NextChange | null {
    // 1秒前のイベントを探す
    const oneSecondAgo = now - 1000;
    const oldestEvent = this.eventHistory.find(e => e.time > oneSecondAgo);
    
    if (oldestEvent) {
      // このイベントが窓から外れる時刻
      const dropTime = oldestEvent.time + 1000;
      const newDensity = this.eventHistory
        .filter(e => e.time > dropTime - 1000).length;
      
      return {
        timestamp: dropTime,
        beatDensity: newDensity
      };
    }
    return null;
  }
}
```

**受信側のロジック**:

```typescript
class SmartReceiver {
  private currentMetrics: Metrics;
  private nextChange: NextChange | null;
  private updateTimer: number | null;
  
  onMessage(message: OptimizedMessage) {
    // 1. メトリクスを即座に更新
    this.currentMetrics = message.metrics;
    this.updateUI(this.currentMetrics);
    
    // 2. 次の変更予定を記録
    if (message.nextMetricChange) {
      this.scheduleNextUpdate(message.nextMetricChange);
    }
    
    // 3. イベント処理（アニメーションなど）
    if (message.events) {
      this.handleEvents(message.events);
    }
  }
  
  private scheduleNextUpdate(nextChange: NextChange) {
    // 既存のタイマーをクリア
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    
    // 次の更新をスケジュール
    const delay = nextChange.timestamp - Date.now();
    if (delay > 0) {
      this.updateTimer = setTimeout(() => {
        this.currentMetrics.beatDensity = nextChange.beatDensity;
        this.updateUI(this.currentMetrics);
      }, delay);
    }
  }
}
```

### 案C: 段階的な更新頻度

```typescript
interface UpdateFrequency {
  active: {
    eventInterval: 5;      // イベントは即座に
    metricsInterval: 20;   // メトリクスは20ms毎
  };
  idle: {
    eventInterval: 50;     // アイドル時は50ms
    metricsInterval: 100;  // メトリクスは100ms毎
  };
}
```

## 推奨実装

### 1. 基本方針
- **イベント**: 状態変化時に即座に送信（リアルタイム性維持）
- **メトリクス**: 20-50ms間隔で送信（人間の知覚限界を考慮）
- **予測情報**: 次の変化タイミングを含める

### 2. 送信データ構造

```typescript
// コンパクトなバイナリ形式も検討
const enum MessageType {
  EVENT = 1,
  METRICS = 2,
  COMBINED = 3
}

interface CompactMessage {
  t: MessageType;           // type (1 byte)
  ts: number;              // timestamp (4 bytes)
  
  // Optional fields
  e?: {                    // events
    k?: number[];          // key changes (bitmask)
    s?: number;            // scratch state
  };
  
  m?: {                    // metrics
    b: number;             // beat density
    r: number;             // release average
    a: number;             // active keys (bitmask)
  };
  
  n?: {                    // next change
    t: number;             // timestamp
    b?: number;            // beat density
  };
}
```

### 3. 実装優先順位

**Phase 1: 基本的な分離**（必須）
- [ ] イベントとメトリクスの送信を分離
- [ ] メトリクスは計算済みの値を送信
- [ ] 受信側はメトリクスをそのまま表示

**Phase 2: 送信頻度の最適化**（推奨）
- [ ] メトリクスの送信間隔を20-50msに
- [ ] 変化がない場合は送信をスキップ
- [ ] ハートビート機能（1秒毎）

**Phase 3: 予測的更新**（オプション）
- [ ] 次の変化タイミングの予測
- [ ] 受信側でのスケジュール更新
- [ ] より滑らかな表示

## まとめ

受信側での5ms毎の再計算を避けるため：

1. **送信側でメトリクスを計算**して送信
2. **受信側は計算済みの値を表示**するだけ
3. **更新頻度は20-50ms**で十分（人間には違いが分からない）
4. **次の変化を予測**して送信することで、より正確な同期が可能

これにより、受信側の負荷を大幅に削減しながら、視覚的にはリアルタイムな同期を実現できます。