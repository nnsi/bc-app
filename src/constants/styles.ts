/**
 * スタイル関連の定数
 */

import { CSSProperties } from 'react';

/**
 * ヘッダーのスタイル
 */
export const HEADER_STYLES: CSSProperties = {
  borderBottom: '1px solid white',
  padding: '5px 5px 0 5px',
  fontSize: '10px',
  lineHeight: 1,
  cursor: 'default',
  display: 'flex',
  alignItems: 'center',
} as const;




/**
 * テキストのスタイル
 */
export const TEXT_STYLES = {
  /** 中央寄せテキスト */
  CENTER: {
    textAlign: 'center' as const,
    marginBottom: '10px',
  } as CSSProperties,
} as const;