// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub use mawabro_lib::commands::generate_room_token;

fn main() {
    mawabro_lib::run();
}
