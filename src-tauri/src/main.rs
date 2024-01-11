// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// https://qiita.com/takavfx/items/9bf518a5bc3cc7c19509
use tauri::Manager;
use window_shadows::set_shadow;

fn main() {
    tauri::Builder::default()
            .setup(|app| {
                    // "main" ウィンドウの取得
                    let main_window = app.get_window("main").unwrap();
    
                    // ウィンドウに window-shadows の装飾を適用
                    // Windows, macOS で有効
                    #[cfg(any(windows, target_os = "macos"))]
                    set_shadow(main_window, true).unwrap();
        
                    Ok(())
                })
        .plugin(tauri_plugin_gamepad::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
