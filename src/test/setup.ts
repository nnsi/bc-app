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