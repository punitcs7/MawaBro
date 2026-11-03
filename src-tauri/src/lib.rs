use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PttPayload {
    pub active: bool,
    pub key: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PttStatusResponse {
    pub active: bool,
    pub configured_key: String,
    pub hook_running: bool,
}

pub struct PttState {
    pub configured_key: RwLock<String>,
    pub is_active: AtomicBool,
    pub hook_running: AtomicBool,
}

impl PttState {
    pub fn new(default_key: &str) -> Self {
        Self {
            configured_key: RwLock::new(default_key.to_string()),
            is_active: AtomicBool::new(false),
            hook_running: AtomicBool::new(false),
        }
    }
}

fn normalize_key(key: &rdev::Key) -> String {
    match key {
        rdev::Key::CapsLock => "CapsLock".to_string(),
        rdev::Key::ShiftLeft => "ShiftLeft".to_string(),
        rdev::Key::ShiftRight => "ShiftRight".to_string(),
        rdev::Key::ControlLeft => "ControlLeft".to_string(),
        rdev::Key::ControlRight => "ControlRight".to_string(),
        rdev::Key::Alt => "AltLeft".to_string(),
        rdev::Key::AltGr => "AltRight".to_string(),
        rdev::Key::Space => "Space".to_string(),
        rdev::Key::Tab => "Tab".to_string(),
        rdev::Key::KeyA => "KeyA".to_string(),
        rdev::Key::KeyB => "KeyB".to_string(),
        rdev::Key::KeyC => "KeyC".to_string(),
        rdev::Key::KeyD => "KeyD".to_string(),
        rdev::Key::KeyE => "KeyE".to_string(),
        rdev::Key::KeyF => "KeyF".to_string(),
        rdev::Key::KeyG => "KeyG".to_string(),
        rdev::Key::KeyH => "KeyH".to_string(),
        rdev::Key::KeyI => "KeyI".to_string(),
        rdev::Key::KeyJ => "KeyJ".to_string(),
        rdev::Key::KeyK => "KeyK".to_string(),
        rdev::Key::KeyL => "KeyL".to_string(),
        rdev::Key::KeyM => "KeyM".to_string(),
        rdev::Key::KeyN => "KeyN".to_string(),
        rdev::Key::KeyO => "KeyO".to_string(),
        rdev::Key::KeyP => "KeyP".to_string(),
        rdev::Key::KeyQ => "KeyQ".to_string(),
        rdev::Key::KeyR => "KeyR".to_string(),
        rdev::Key::KeyS => "KeyS".to_string(),
        rdev::Key::KeyT => "KeyT".to_string(),
        rdev::Key::KeyU => "KeyU".to_string(),
        rdev::Key::KeyV => "KeyV".to_string(),
        rdev::Key::KeyW => "KeyW".to_string(),
        rdev::Key::KeyX => "KeyX".to_string(),
        rdev::Key::KeyY => "KeyY".to_string(),
        rdev::Key::KeyZ => "KeyZ".to_string(),
        rdev::Key::F1 => "F1".to_string(),
        rdev::Key::F2 => "F2".to_string(),
        rdev::Key::F3 => "F3".to_string(),
        rdev::Key::F4 => "F4".to_string(),
        rdev::Key::F5 => "F5".to_string(),
        rdev::Key::F6 => "F6".to_string(),
        rdev::Key::F7 => "F7".to_string(),
        rdev::Key::F8 => "F8".to_string(),
        rdev::Key::F9 => "F9".to_string(),
        rdev::Key::F10 => "F10".to_string(),
        rdev::Key::F11 => "F11".to_string(),
        rdev::Key::F12 => "F12".to_string(),
        rdev::Key::Num0 => "Digit0".to_string(),
        rdev::Key::Num1 => "Digit1".to_string(),
        rdev::Key::Num2 => "Digit2".to_string(),
        rdev::Key::Num3 => "Digit3".to_string(),
        rdev::Key::Num4 => "Digit4".to_string(),
        rdev::Key::Num5 => "Digit5".to_string(),
        rdev::Key::Num6 => "Digit6".to_string(),
        rdev::Key::Num7 => "Digit7".to_string(),
        rdev::Key::Num8 => "Digit8".to_string(),
        rdev::Key::Num9 => "Digit9".to_string(),
        other => format!("{:?}", other),
    }
}

fn normalize_button(button: &rdev::Button) -> String {
    match button {
        rdev::Button::Left => "MouseLeft".to_string(),
        rdev::Button::Right => "MouseRight".to_string(),
        rdev::Button::Middle => "MouseMiddle".to_string(),
        rdev::Button::Unknown(1) => "Mouse4".to_string(),
        rdev::Button::Unknown(2) => "Mouse5".to_string(),
        rdev::Button::Unknown(code) => format!("MouseBtn{}", code),
    }
}

pub fn start_global_ptt_hook(app_handle: AppHandle, state: Arc<PttState>) {
    std::thread::spawn(move || {
        state.hook_running.store(true, Ordering::SeqCst);
        println!("[MawaBro PTT] Global low-level input hook thread initialized");

        let state_clone = Arc::clone(&state);
        let app_handle_clone = app_handle.clone();

        let callback = move |event: rdev::Event| {
            let (is_press, key_name) = match event.event_type {
                rdev::EventType::KeyPress(key) => (Some(true), normalize_key(&key)),
                rdev::EventType::KeyRelease(key) => (Some(false), normalize_key(&key)),
                rdev::EventType::ButtonPress(btn) => (Some(true), normalize_button(&btn)),
                rdev::EventType::ButtonRelease(btn) => (Some(false), normalize_button(&btn)),
                _ => (None, String::new()),
            };

            if let Some(press) = is_press {
                let target = state_clone.configured_key.read().clone();
                if key_name.eq_ignore_ascii_case(&target) {
                    let prev = state_clone.is_active.swap(press, Ordering::SeqCst);
                    if prev != press {
                        let payload = PttPayload {
                            active: press,
                            key: key_name.clone(),
                        };
                        println!("[MawaBro PTT Hook] {} -> Active: {}", key_name, press);
                        let _ = app_handle_clone.emit("ptt-active", &payload);
                    }
                }
            }
        };

        if let Err(error) = rdev::listen(callback) {
            eprintln!("[MawaBro PTT Hook] Error running global hook: {:?}", error);
            state.hook_running.store(false, Ordering::SeqCst);
        }
    });
}

pub mod commands {
    use std::sync::Arc;
    use std::sync::atomic::Ordering;
    use livekit_api::access_token::{AccessToken, VideoGrants};
    use super::{PttState, PttStatusResponse};

    #[tauri::command]
    pub fn set_ptt_key(state: tauri::State<'_, Arc<PttState>>, key: String) -> Result<(), String> {
        let mut configured = state.configured_key.write();
        *configured = key;
        Ok(())
    }

    #[tauri::command]
    pub fn get_ptt_status(state: tauri::State<'_, Arc<PttState>>) -> PttStatusResponse {
        PttStatusResponse {
            active: state.is_active.load(Ordering::SeqCst),
            configured_key: state.configured_key.read().clone(),
            hook_running: state.hook_running.load(Ordering::SeqCst),
        }
    }

    #[tauri::command]
    pub fn generate_room_token(
        room_name: String,
        participant_identity: Option<String>,
        participant_name: Option<String>,
    ) -> Result<String, String> {
        let key = std::env::var("LIVEKIT_API_KEY")
            .unwrap_or_else(|_| "APIGWo8aKmTzdbe".to_string());
        let secret = std::env::var("LIVEKIT_API_SECRET")
            .unwrap_or_else(|_| "tqwEsye14TpvwBrvK7GgneYvirKgghMKcKMsZ6K1HQI".to_string());

        let name = participant_name.unwrap_or_else(|| "User".to_string());
        let identity = participant_identity.unwrap_or_else(|| {
            let ts = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_millis())
                .unwrap_or(0);
            format!("{}_{}", name, ts)
        });

        let token = AccessToken::with_api_key(&key, &secret)
            .with_identity(&identity)
            .with_name(&name)
            .with_grants(VideoGrants {
                room_join: true,
                room: room_name,
                can_publish: Some(true),
                can_subscribe: Some(true),
                can_publish_data: Some(true),
                ..Default::default()
            })
            .to_jwt()
            .map_err(|e| e.to_string())?;

        Ok(token)
    }

    #[tauri::command]
    pub fn set_overlay_visible(app: tauri::AppHandle, visible: bool) -> Result<(), String> {
        use tauri::Manager;
        if let Some(overlay_win) = app.get_webview_window("overlay") {
            if visible {
                overlay_win.show().map_err(|e| e.to_string())?;
            } else {
                overlay_win.hide().map_err(|e| e.to_string())?;
            }
            Ok(())
        } else {
            Err("Overlay window not found".to_string())
        }
    }

    #[tauri::command]
    pub fn set_overlay_clickthrough(app: tauri::AppHandle, ignore: bool) -> Result<(), String> {
        use tauri::Manager;
        if let Some(overlay_win) = app.get_webview_window("overlay") {
            overlay_win.set_ignore_cursor_events(ignore).map_err(|e| e.to_string())?;
            Ok(())
        } else {
            Err("Overlay window not found".to_string())
        }
    }

    #[tauri::command]
    pub fn emit_overlay_speakers(app: tauri::AppHandle, speakers: serde_json::Value) -> Result<(), String> {
        use tauri::Emitter;
        app.emit("overlay-speakers", &speakers).map_err(|e| e.to_string())?;
        Ok(())
    }
}

pub fn run() {
    let ptt_state = Arc::new(PttState::new("CapsLock"));
    let ptt_state_clone = Arc::clone(&ptt_state);

    let app = tauri::Builder::default()
        .manage(ptt_state)
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(move |app| {
            let app_handle = app.handle().clone();
            start_global_ptt_hook(app_handle.clone(), ptt_state_clone);

            // Configure overlay window click-through so in-game clicks pass directly through
            if let Some(overlay_win) = app.get_webview_window("overlay") {
                let _ = overlay_win.set_ignore_cursor_events(true);
            }

            // Build Windows System Tray
            let show_item = MenuItem::with_id(app, "show", "Show MawaBro HQ", true, None::<&str>)?;
            let mute_item = MenuItem::with_id(app, "toggle_mute", "Mute / Unmute", true, None::<&str>)?;
            let deafen_item = MenuItem::with_id(app, "toggle_deafen", "Deafen / Undeafen", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let tray_menu = Menu::with_items(app, &[&show_item, &mute_item, &deafen_item, &quit_item])?;

            let mut tray_builder = TrayIconBuilder::new()
                .menu(&tray_menu)
                .tooltip("MawaBro HQ")
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(win) = app.get_webview_window("main") {
                                let _ = win.show();
                                let _ = win.unminimize();
                                let _ = win.set_focus();
                            }
                        }
                        "toggle_mute" => {
                            let _ = app.emit("tray-toggle-mute", ());
                        }
                        "toggle_deafen" => {
                            let _ = app.emit("tray-toggle-deafen", ());
                        }
                        "quit" => {
                            std::process::exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.unminimize();
                            let _ = win.set_focus();
                        }
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }

            let _tray = tray_builder.build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::set_ptt_key,
            commands::get_ptt_status,
            commands::generate_room_token,
            commands::set_overlay_visible,
            commands::set_overlay_clickthrough,
            commands::emit_overlay_speakers
        ])
        .build(tauri::generate_context!())
        .expect("error while running MawaBro application");

    app.run(|app_handle, event| match event {
        tauri::RunEvent::ExitRequested { .. } => {
            std::process::exit(0);
        }
        tauri::RunEvent::WindowEvent {
            label,
            event: tauri::WindowEvent::CloseRequested { api, .. },
            ..
        } => {
            if label == "main" {
                api.prevent_close();
                if let Some(win) = app_handle.get_webview_window(&label) {
                    let _ = win.hide();
                }
            }
        }
        _ => {}
    });
}
