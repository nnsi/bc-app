/**
 * エラーメッセージコンポーネント
 */

import React from 'react';

interface ErrorMessageProps {
  /** エラーメッセージ */
  message: string;
  /** 再試行ボタンを表示するか */
  showRetry?: boolean;
  /** 再試行ボタンクリック時のハンドラ */
  onRetry?: () => void;
}

/**
 * エラーメッセージ表示
 * エラー内容と再試行ボタンを表示
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  showRetry = false,
  onRetry,
}) => {
  return (
    <div style={{
      padding: '10px',
      backgroundColor: '#ffebee',
      border: '1px solid #f44336',
      borderRadius: '4px',
      color: '#d32f2f',
      marginBottom: '10px',
    }}>
      <p style={{ margin: '0 0 10px 0' }}>{message}</p>
      {showRetry && onRetry && (
        <button 
          onClick={onRetry}
          style={{
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          再試行
        </button>
      )}
    </div>
  );
};