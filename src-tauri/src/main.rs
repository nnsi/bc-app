// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use futures_util::{SinkExt, StreamExt};
use std::net::{TcpListener};
use std::sync::Arc;
use tokio::sync::{broadcast, Mutex};
use warp::ws::{Message, WebSocket};
use warp::Filter;
use tauri::Manager;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize)]
struct WindowPosition {
    x: i32,
    y: i32,
}

fn get_config_path() -> PathBuf {
    let mut path = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("iidx-input-monitor");
    fs::create_dir_all(&path).ok();
    path.push("window-position.json");
    path
}

fn save_window_position(position: &WindowPosition) -> Result<(), Box<dyn std::error::Error>> {
    let path = get_config_path();
    let json = serde_json::to_string_pretty(position)?;
    fs::write(path, json)?;
    Ok(())
}

fn load_window_position() -> Option<WindowPosition> {
    let path = get_config_path();
    if path.exists() {
        if let Ok(json) = fs::read_to_string(path) {
            serde_json::from_str(&json).ok()
        } else {
            None
        }
    } else {
        None
    }
}

// Check if a port is already in use
fn is_port_in_use(port: u16) -> bool {
    match TcpListener::bind(("127.0.0.1", port)) {
        Ok(listener) => {
            // Port is available, drop the listener
            drop(listener);
            false
        }
        Err(_) => true,
    }
}

#[tauri::command]
fn check_websocket_status(state: tauri::State<bool>) -> bool {
    *state.inner()
}

#[tauri::command]
fn get_local_ip() -> Result<String, String> {
    // Get local network interfaces
    let socket = std::net::UdpSocket::bind("0.0.0.0:0").map_err(|e| e.to_string())?;
    socket.connect("8.8.8.8:80").map_err(|e| e.to_string())?;
    let local_ip = socket.local_addr().map_err(|e| e.to_string())?;
    Ok(local_ip.ip().to_string())
}

#[tauri::command]
async fn resize_window(
    window: tauri::WebviewWindow,
    width: u32,
    height: u32,
) -> Result<(), String> {
    use tauri::{LogicalSize, Size};
    
    // ウィンドウのサイズを変更
    let new_size = Size::Logical(LogicalSize { width: width as f64, height: height as f64 });
    window.set_size(new_size).map_err(|e| e.to_string())?;
    
    Ok(())
}

fn main() {
    let port = 2356;
    let mut is_websocket_running = false;
    if is_port_in_use(port) {
        println!("Port {} is already in use. WebSocket server will not be started.", port);
    } else {
        is_websocket_running = true;
        // Start the Tokio runtime in a new thread
        std::thread::spawn(|| {
            let rt = tokio::runtime::Runtime::new().expect("Failed to create Tokio runtime");
            rt.block_on(async {
                // Create a broadcast channel for WebSocket communication
                let (tx, _rx) = broadcast::channel(100);

                // Warp WebSocket filter
                let websocket = warp::path("ws")
                    .and(warp::ws())
                    .and(with_broadcast_tx(tx.clone()))
                    .map(|ws: warp::ws::Ws, tx| {
                        ws.on_upgrade(move |socket| handle_connection(socket, tx))
                    });

                // Start the WebSocket server
                warp::serve(websocket)
                    .run(([127, 0, 0, 1], 2356))
                    .await;
            });
        });
    }

    // Tauri application setup
    tauri::Builder::default()
        .setup(move |app| {
            // "main" ウィンドウの取得
            let main_window = app.get_webview_window("main").unwrap();

            // 保存されたウィンドウ位置を復元
            if let Some(position) = load_window_position() {
                use tauri::{LogicalPosition, Position};
                
                // 現在のモニター情報を取得してウィンドウが画面内にあるか確認
                let mut valid_position = true;
                if let Ok(monitors) = main_window.available_monitors() {
                    valid_position = false;
                    for monitor in monitors {
                        let monitor_pos = monitor.position();
                        let monitor_size = monitor.size();
                        let monitor_left = monitor_pos.x;
                        let monitor_top = monitor_pos.y;
                        let monitor_right = monitor_left + monitor_size.width as i32;
                        let monitor_bottom = monitor_top + monitor_size.height as i32;
                        
                        // ウィンドウの一部でもモニター内にあればOK
                        if position.x < monitor_right && 
                           position.x + 410 > monitor_left &&
                           position.y < monitor_bottom &&
                           position.y + 250 > monitor_top {
                            valid_position = true;
                            break;
                        }
                    }
                }
                
                // 有効な位置の場合のみ復元
                if valid_position {
                    let logical_position = Position::Logical(LogicalPosition {
                        x: position.x as f64,
                        y: position.y as f64,
                    });
                    main_window.set_position(logical_position).ok();
                } else {
                    // 無効な位置の場合は中央に配置
                    main_window.center().ok();
                }
            } else {
                // 初回起動時は中央に配置
                main_window.center().ok();
            }
            
            // ウィンドウを表示
            main_window.show().ok();

            // ウィンドウが閉じられる前に位置を保存
            let window_clone = main_window.clone();
            main_window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { .. } = event {
                    if let Ok(position) = window_clone.outer_position() {
                        let window_position = WindowPosition {
                            x: position.x,
                            y: position.y,
                        };
                        save_window_position(&window_position).ok();
                    }
                }
            });

            let app_handle = app.handle();
            app_handle.manage(is_websocket_running);

            Ok(())
        })
        .plugin(tauri_plugin_gamepad::init())
        .invoke_handler(tauri::generate_handler![check_websocket_status, get_local_ip, resize_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn with_broadcast_tx(
    tx: broadcast::Sender<String>,
) -> impl Filter<Extract = (broadcast::Sender<String>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || tx.clone())
}

async fn handle_connection(ws: WebSocket, tx: broadcast::Sender<String>) {
    let (mut user_ws_tx, mut user_ws_rx) = ws.split();
    let rx = Arc::new(Mutex::new(tx.subscribe()));

    // Task to receive messages from the client
    let rx_clone = Arc::clone(&rx);
    tokio::spawn(async move {
        while let Some(result) = user_ws_rx.next().await {
            if let Ok(msg) = result {
                if msg.is_text() {
                    if let Ok(text) = msg.to_str() {
                        tx.send(text.to_string()).unwrap_or(0);
                    }
                }
            }
        }
    });

    // Task to send messages to the client
    tokio::spawn(async move {
        let mut rx_lock = rx_clone.lock().await;
        while let Ok(msg) = rx_lock.recv().await {
            user_ws_tx.send(Message::text(msg)).await.unwrap_or(());
        }
    });
}