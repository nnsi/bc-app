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
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="接続先"
        value={ipAddress}
        onChange={(e) => onIpAddressChange(e.target.value)}
        className="block p-1 bg-[#444] text-white border border-[#666] rounded-md focus:outline-none focus:border-[#4a9eff] focus:ring-1 focus:ring-[#4a9eff] transition-all duration-200 w-[140px] text-[14px]"
      />
      <button 
        onClick={onReceiveModeClick}
        className="block p-1 bg-[#4a9eff] text-white rounded-md hover:bg-[#3a8eef] active:scale-95 transition-all duration-200 font-medium text-[14px] shadow-sm hover:shadow-md"
      >
        受信モード
      </button>
    </div>
  );
};

export const ConnectionSettings = memo(ConnectionSettingsComponent);