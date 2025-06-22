import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./tailwind.css";
import "./styles.css";
import { invoke } from "@tauri-apps/api/core";
import { STORAGE_KEYS } from './types/settings';
import { UI } from './constants/app';

document.addEventListener(
  "contextmenu",
  (e) => {
    e.preventDefault();
    return false;
  },
  { capture: true }
);

// アプリケーション起動時に設定を読み込み、DPモードの場合はウィンドウサイズを調整
(async () => {
  try {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.playMode && settings.playMode.mode === 'DP') {
        // DPモードの場合、ウィンドウサイズを820x250に設定
        await invoke('resize_window', { 
          width: UI.WINDOW_DP.WIDTH, 
          height: UI.WINDOW_DP.HEIGHT 
        });
      }
    }
  } catch (error) {
    console.error('Failed to load initial settings:', error);
  }
})();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
