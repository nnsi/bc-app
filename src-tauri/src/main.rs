// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use futures_util::{SinkExt, StreamExt};
use std::net::TcpListener;
use std::sync::Arc;
use tokio::sync::{broadcast, Mutex};
use warp::ws::{Message, WebSocket};
use warp::Filter;
use tauri::Manager;
use window_shadows::set_shadow;

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
}fn main() {
    let port = 2356;
    if is_port_in_use(port) {
        println!("Port {} is already in use. WebSocket server will not be started.", port);
    } else {
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