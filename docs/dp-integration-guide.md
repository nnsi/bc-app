# DP (Double Play) モード対応コントローラー統合ガイド

## 概要

`IIDXControllerDP.tsx`は、beatmania IIDXのシングルプレイ(SP)とダブルプレイ(DP)の両方に対応したコントローラー表示コンポーネントです。

## 主な特徴

1. **モード切り替え対応**
   - SPモード: 単一のコントローラーを表示（1P側または2P側）
   - DPモード: 2つのコントローラーを横並びで表示

2. **視覚的フィードバック**
   - 未接続のコントローラーはグレーアウト表示
   - プレイヤーラベル（1P/2P）の表示
   - キー押下時のエフェクト
   - リリーススピード表示

3. **レイアウト対応**
   - 1P側: スクラッチが左側
   - 2P側: スクラッチが右側

## 使用方法

### 基本的な使い方

```tsx
import { IIDXControllerDP } from './components/IIDXControllerDP';
import { ControllerStatus } from './types/controller';

// SPモードの場合
<IIDXControllerDP
  player1Status={controllerStatus}  // 1P側のコントローラー状態
  player2Status={null}               // 2P側は未使用
  mode="SP"
  currentPlayerSide="1P"             // 現在選択しているプレイヤーサイド
/>

// DPモードの場合
<IIDXControllerDP
  player1Status={player1Status}      // 1P側のコントローラー状態
  player2Status={player2Status}      // 2P側のコントローラー状態
  mode="DP"
/>
```

### プロパティ

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| player1Status | ControllerStatus \| null | 1P側のコントローラー状態。nullの場合はグレーアウト表示 |
| player2Status | ControllerStatus \| null | 2P側のコントローラー状態。nullの場合はグレーアウト表示 |
| mode | 'SP' \| 'DP' | プレイモード |
| currentPlayerSide | '1P' \| '2P' | SPモード時に表示するプレイヤーサイド（省略時は'1P'） |

## 既存コンポーネントからの移行

現在の`IIDXController`から`IIDXControllerDP`への移行は以下の手順で行います：

### 1. ControllerDisplayコンポーネントの更新

```tsx
// 変更前
import { IIDXController } from './IIDXController';

<IIDXController status={status} is2P={is2P} />

// 変更後
import { IIDXControllerDP } from './IIDXControllerDP';

<IIDXControllerDP
  player1Status={is2P ? null : status}
  player2Status={is2P ? status : null}
  mode="SP"
  currentPlayerSide={is2P ? '2P' : '1P'}
/>
```

### 2. DPモード対応時の実装

```tsx
// App.tsxでの状態管理例
const [playMode, setPlayMode] = useState<'SP' | 'DP'>('SP');
const [player1GamepadIndex, setPlayer1GamepadIndex] = useState<number | null>(null);
const [player2GamepadIndex, setPlayer2GamepadIndex] = useState<number | null>(null);

// 各コントローラーの状態を取得
const { controllerStatus: player1Status } = useController(player1GamepadIndex);
const { controllerStatus: player2Status } = useController(player2GamepadIndex);

// レンダリング
<IIDXControllerDP
  player1Status={player1Status}
  player2Status={player2Status}
  mode={playMode}
  currentPlayerSide={is2P ? '2P' : '1P'}
/>
```

## スタイリングのカスタマイズ

コンポーネントはstyled-componentsを使用しているため、必要に応じてスタイルを拡張できます：

```tsx
import styled from 'styled-components';
import { IIDXControllerDP } from './IIDXControllerDP';

const CustomizedController = styled(IIDXControllerDP)`
  // カスタムスタイル
  .player-label {
    color: #00ff00;
    font-size: 20px;
  }
  
  // DPモード時のギャップ調整
  gap: ${props => props.mode === 'DP' ? '60px' : '0'};
`;
```

## 実装時の考慮事項

1. **ウィンドウサイズ**
   - SPモード: 410x250px（現行サイズ）
   - DPモード: 820x250px（横幅2倍）
   - モード切り替え時にTauri APIでウィンドウサイズを変更する必要があります

2. **パフォーマンス**
   - DPモードでは2つのコントローラーを同時にポーリングするため、パフォーマンスへの影響を考慮
   - 必要に応じてポーリング間隔の調整を検討

3. **WebSocket通信**
   - DPモード時は両方のコントローラーデータを送信
   - 受信側でもDPモードのデータを適切に処理する必要があります

## 今後の拡張案

1. **アニメーション**
   - モード切り替え時のトランジション
   - コントローラー接続/切断時のアニメーション

2. **設定保存**
   - プレイモードの設定をlocalStorageに保存
   - コントローラー割り当ての記憶

3. **キーボードショートカット**
   - モード切り替えのショートカット
   - プレイヤーサイド切り替えのショートカット