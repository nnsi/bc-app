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
 * ボタンのスタイル
 */
export const BUTTON_STYLES = {
  /** フルサイズボタン */
  FULL_WIDTH: {
    width: '100%',
    marginBottom: '5px',
  } as CSSProperties,
  /** アイコンボタン */
  ICON: {
    marginLeft: 'auto',
    cursor: 'pointer',
  } as CSSProperties,
} as const;

/**
 * 入力フィールドのスタイル
 */
export const INPUT_STYLES: CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  marginBottom: '5px',
} as const;

/**
 * コンテナのスタイル
 */
export const CONTAINER_STYLES: CSSProperties = {
  padding: '10px',
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