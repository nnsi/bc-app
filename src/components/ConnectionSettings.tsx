/**
 * 接続設定コンポーネント
 */

import React, { memo } from 'react';

interface ConnectionSettingsProps {
  /** IPアドレス */
  ipAddress: string;
  /** IPアドレス変更時のハンドラ */
  onIpAddressChange: (value: string) => void;
  /** 受信モードボタンクリック時のハンドラ */
  onReceiveModeClick: () => void;
}

/**
 * 接続設定UI
 * IPアドレス入力と受信モード切替を提供
 */
const ConnectionSettingsComponent: React.FC<ConnectionSettingsProps> = ({
  ipAddress,
  onIpAddressChange,
  onReceiveModeClick,
}) => {
  return (
    <p>
      <input
        type="text"
        placeholder="接続先"
        value={ipAddress}
        onChange={(e) => onIpAddressChange(e.target.value)}
      />
      <button onClick={onReceiveModeClick}>
        受信モード
      </button>
    </p>
  );
};

export const ConnectionSettings = memo(ConnectionSettingsComponent);