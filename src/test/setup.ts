import '@testing-library/jest-dom';

// グローバルモック
Object.defineProperty(window, '__TAURI_INTERNALS__', {
  value: {},
  writable: true,
});