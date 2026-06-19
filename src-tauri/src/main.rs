// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use lc_guidance_lib::{commands, db};
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let db_path = db::get_db_path(app.handle())?;

            #[cfg(not(debug_assertions))]
            db::backup::run_backup(&db_path)?;

            let connection = db::open_db(&db_path)?;
            db::schema::initialize_schema(&connection)?;
            app.manage(db::DbState::new(connection));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_cases,
            commands::add_case,
            commands::update_case,
            commands::delete_case,
            commands::get_case,
            commands::copy_generated_proof,
            commands::get_backups,
            commands::create_backup,
            commands::restore_backup
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
