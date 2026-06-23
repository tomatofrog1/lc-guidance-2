use rusqlite::{params, OptionalExtension, Row};
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::db::DbState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaseRecord {
    pub id: i64,
    pub students: String,
    pub date: String,
    pub date_filed: String,
    #[serde(rename = "case")]
    pub r#case: String,
    pub description: String,
    pub sanction: String,
    pub progress: String,
    pub proofs: String,
}

fn map_case(row: &Row<'_>) -> rusqlite::Result<CaseRecord> {
    Ok(CaseRecord {
        id: row.get("id")?,
        students: row.get("students")?,
        date: row.get("date")?,
        date_filed: row.get("date_filed")?,
        r#case: row.get("case")?,
        description: row.get("description")?,
        sanction: row.get("sanction")?,
        progress: row.get("progress")?,
        proofs: row.get("proofs")?,
    })
}

fn db_error(error: impl std::fmt::Display) -> String {
    error.to_string()
}

#[tauri::command]
pub fn get_cases(state: State<'_, DbState>) -> Result<Vec<CaseRecord>, String> {
    let connection = state.connection.lock().map_err(db_error)?;
    let mut statement = connection
        .prepare(
            r#"
SELECT id, students, date, date_filed, "case", description, sanction, progress, proofs
FROM cases
ORDER BY id DESC
"#,
        )
        .map_err(db_error)?;

    let cases = statement
        .query_map([], map_case)
        .map_err(db_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(db_error)?;

    Ok(cases)
}

#[tauri::command]
pub fn add_case(
    state: State<'_, DbState>,
    students: String,
    date: String,
    date_filed: String,
    r#case: String,
    description: String,
    sanction: String,
    progress: String,
    proofs: String,
) -> Result<i64, String> {
    let connection = state.connection.lock().map_err(db_error)?;

    connection
        .execute(
            r#"
INSERT INTO cases (
  students, date, date_filed, "case", description, sanction, progress, proofs, first_name, last_name, middle_initial, level, section, adviser
) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, '', '', '', '', '', '')
"#,
            params![
                students, date, date_filed, r#case, description,
                sanction, progress, proofs
            ],
        )
        .map_err(db_error)?;

    Ok(connection.last_insert_rowid())
}

#[tauri::command]
pub fn update_case(
    state: State<'_, DbState>,
    id: i64,
    students: String,
    date: String,
    date_filed: String,
    r#case: String,
    description: String,
    sanction: String,
    progress: String,
    proofs: String,
) -> Result<(), String> {
    let connection = state.connection.lock().map_err(db_error)?;

    let rows_updated = connection
        .execute(
            r#"
UPDATE cases
SET students = ?1,
    date = ?2,
    date_filed = ?3,
    "case" = ?4,
    description = ?5,
    sanction = ?6,
    progress = ?7,
    proofs = ?8
WHERE id = ?9
"#,
            params![
                students, date, date_filed, r#case, description,
                sanction, progress, proofs, id
            ],
        )
        .map_err(db_error)?;

    if rows_updated == 0 {
        return Err(format!("Case with id {id} was not found"));
    }

    Ok(())
}

#[tauri::command]
pub fn delete_case(state: State<'_, DbState>, id: i64) -> Result<(), String> {
    let connection = state.connection.lock().map_err(db_error)?;
    let rows_deleted = connection
        .execute("DELETE FROM cases WHERE id = ?1", params![id])
        .map_err(db_error)?;

    if rows_deleted == 0 {
        return Err(format!("Case with id {id} was not found"));
    }

    Ok(())
}

#[tauri::command]
pub fn get_case(state: State<'_, DbState>, id: i64) -> Result<CaseRecord, String> {
    let connection = state.connection.lock().map_err(db_error)?;
    let case = connection
        .query_row(
            r#"
SELECT id, students, date, date_filed, "case", description, sanction, progress, proofs
FROM cases
WHERE id = ?1
"#,
            params![id],
            map_case,
        )
        .optional()
        .map_err(db_error)?;

    case.ok_or_else(|| format!("Case with id {id} was not found"))
}

#[tauri::command]
pub fn copy_generated_proof(src_path: String, dest_filename: String) -> Result<String, String> {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let dest_path = std::path::Path::new(manifest_dir)
        .parent()
        .unwrap()
        .join("src")
        .join("assets")
        .join(&dest_filename);

    if let Some(parent) = dest_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    std::fs::copy(&src_path, &dest_path)
        .map_err(|e| format!("Failed to copy file from {} to {:?}: {}", src_path, dest_path, e))?;

    Ok(format!("Successfully copied to {:?}", dest_path))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupRecord {
    pub date_time: String,
    pub backup_type: String,
    pub file_size: String,
    pub filename: String,
}

#[tauri::command]
pub fn get_backups(app: tauri::AppHandle) -> Result<Vec<BackupRecord>, String> {
    use tauri::Manager;
    use std::fs;

    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let backup_dir = app_data_dir.join("backups");

    let mut backups = Vec::new();
    if let Ok(entries) = fs::read_dir(backup_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                if let Some(filename) = path.file_name().and_then(|f| f.to_str()) {
                    if filename.starts_with("backup_") {
                        let backup_type = if filename.starts_with("backup_manual_") {
                            "Manual".to_string()
                        } else {
                            "Automatic".to_string()
                        };

                        let time_part = filename.split('_').skip(2).collect::<Vec<_>>().join("_");
                        let date_time = if time_part.len() >= 19 {
                            let mut dt = String::new();
                            if let Some((date_str, time_str)) = time_part.split_once('_') {
                                dt = format!("{} {}", date_str, time_str.replace('-', ":"));
                                dt.truncate(16);
                            }
                            if dt.is_empty() { time_part.clone() } else { dt }
                        } else {
                            time_part
                        };

                        let mut size = 0;
                        if let Ok(db_meta) = fs::metadata(path.join("snapshot.db")) {
                            size += db_meta.len();
                        }
                        if let Ok(csv_meta) = fs::metadata(path.join("snapshot.csv")) {
                            size += csv_meta.len();
                        }

                        let file_size = if size >= 1_073_741_824 {
                            format!("{:.1} GB", size as f64 / 1_073_741_824.0)
                        } else if size >= 1_048_576 {
                            format!("{:.1} MB", size as f64 / 1_048_576.0)
                        } else {
                            format!("{:.1} KB", size as f64 / 1024.0)
                        };

                        backups.push(BackupRecord {
                            date_time,
                            backup_type,
                            file_size,
                            filename: filename.to_string(),
                        });
                    }
                }
            }
        }
    }

    backups.sort_by(|a, b| b.filename.cmp(&a.filename));
    Ok(backups)
}

#[tauri::command]
pub fn create_backup(
    app: tauri::AppHandle,
    state: State<'_, DbState>,
    is_manual: Option<bool>,
) -> Result<(), String> {
    use tauri::Manager;
    use std::fs;

    let db_path = crate::db::get_db_path(&app).map_err(|e| e.to_string())?;
    if !db_path.exists() {
        return Err("Database file does not exist".to_string());
    }

    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let backup_dir = app_data_dir.join("backups");
    fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;

    let now = chrono::Local::now().format("%Y-%m-%d_%H-%M-%S");
    let is_manual = is_manual.unwrap_or(true);
    let prefix = if is_manual { "backup_manual" } else { "backup_auto" };
    let folder_name = format!("{}_{}", prefix, now);
    let current_backup_dir = backup_dir.join(&folder_name);
    fs::create_dir_all(&current_backup_dir).map_err(|e| e.to_string())?;

    fs::copy(&db_path, current_backup_dir.join("snapshot.db")).map_err(|e| e.to_string())?;

    let connection = state.connection.lock().map_err(db_error)?;
    crate::db::backup::export_csv(&connection, &current_backup_dir.join("snapshot.csv"))?;

    Ok(())
}

#[tauri::command]
pub fn restore_backup(
    app: tauri::AppHandle,
    state: State<'_, DbState>,
    filename: String,
) -> Result<(), String> {
    use tauri::Manager;
    use std::fs;

    let db_path = crate::db::get_db_path(&app).map_err(|e| e.to_string())?;
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let backup_dir = app_data_dir.join("backups");
    let backup_file = backup_dir.join(&filename).join("snapshot.db");

    if !backup_file.exists() {
        return Err(format!("Backup file snapshot.db does not exist in folder {}", filename));
    }

    let mut connection_guard = state.connection.lock().map_err(|_| "Failed to lock database state")?;
    
    // Temporarily replace with in-memory connection to drop file handles
    let temp_conn = rusqlite::Connection::open_in_memory().map_err(|e| e.to_string())?;
    *connection_guard = temp_conn;

    // Perform copy
    fs::copy(&backup_file, &db_path).map_err(|e| e.to_string())?;

    // Reopen original connection
    let new_conn = crate::db::open_db(&db_path).map_err(|e| e.to_string())?;
    *connection_guard = new_conn;

    Ok(())
}

#[tauri::command]
pub fn save_file(
    app: tauri::AppHandle,
    base64_data: String,
    filename: String,
) -> Result<String, String> {
    use tauri::Manager;
    use std::fs;
    use base64::{Engine as _, engine::general_purpose};
    use tauri_plugin_opener::OpenerExt;

    let download_dir = app.path().download_dir().map_err(|e| e.to_string())?;
    let file_path = download_dir.join(&filename);

    let bytes = general_purpose::STANDARD.decode(base64_data).map_err(|e| e.to_string())?;
    fs::write(&file_path, bytes).map_err(|e| e.to_string())?;

    let path_str = file_path.to_string_lossy().to_string();
    let _ = app.opener().open_path(&path_str, None::<&str>);

    Ok(path_str)
}

#[tauri::command]
pub fn save_pdf(
    app: tauri::AppHandle,
    base64_data: String,
    filename: String,
) -> Result<String, String> {
    save_file(app, base64_data, filename)
}

