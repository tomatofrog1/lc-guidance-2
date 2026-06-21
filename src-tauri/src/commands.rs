use rusqlite::{params, OptionalExtension, Row};
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::db::DbState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaseRecord {
    pub id: i64,
    pub first_name: String,
    pub last_name: String,
    pub level: String,
    pub section: String,
    pub date: String,
    pub date_filed: String,
    pub adviser: String,
    #[serde(rename = "case")]
    pub r#case: String,
    pub sanction: String,
    pub progress: String,
}

fn map_case(row: &Row<'_>) -> rusqlite::Result<CaseRecord> {
    Ok(CaseRecord {
        id: row.get("id")?,
        first_name: row.get("first_name")?,
        last_name: row.get("last_name")?,
        level: row.get("level")?,
        section: row.get("section")?,
        date: row.get("date")?,
        date_filed: row.get("date_filed")?,
        adviser: row.get("adviser")?,
        r#case: row.get("case")?,
        sanction: row.get("sanction")?,
        progress: row.get("progress")?,
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
SELECT id, first_name, last_name, level, section, date, date_filed, adviser, "case", sanction, progress
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
    first_name: String,
    last_name: String,
    level: String,
    section: String,
    date: String,
    date_filed: String,
    adviser: String,
    r#case: String,
    sanction: String,
    progress: String,
) -> Result<i64, String> {
    let connection = state.connection.lock().map_err(db_error)?;

    connection
        .execute(
            r#"
INSERT INTO cases (
  first_name, last_name, level, section, date, date_filed, adviser, "case", sanction, progress
) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
"#,
            params![
                first_name, last_name, level, section, date, date_filed, adviser, r#case, sanction, progress
            ],
        )
        .map_err(db_error)?;

    Ok(connection.last_insert_rowid())
}

#[tauri::command]
pub fn update_case(
    state: State<'_, DbState>,
    id: i64,
    first_name: String,
    last_name: String,
    level: String,
    section: String,
    date: String,
    date_filed: String,
    adviser: String,
    r#case: String,
    sanction: String,
    progress: String,
) -> Result<(), String> {
    let connection = state.connection.lock().map_err(db_error)?;

    let rows_updated = connection
        .execute(
            r#"
UPDATE cases
SET first_name = ?1,
    last_name = ?2,
    level = ?3,
    section = ?4,
    date = ?5,
    date_filed = ?6,
    adviser = ?7,
    "case" = ?8,
    sanction = ?9,
    progress = ?10
WHERE id = ?11
"#,
            params![
                first_name, last_name, level, section, date, date_filed, adviser, r#case, sanction, progress,
                id
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
SELECT id, first_name, last_name, level, section, date, date_filed, adviser, "case", sanction, progress
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
    use chrono::{DateTime, Local};
    use std::fs;

    let db_path = crate::db::get_db_path(&app).map_err(|e| e.to_string())?;
    let db_dir = db_path.parent().ok_or("Database directory not found")?;

    let mut backups = Vec::new();
    if let Ok(entries) = fs::read_dir(db_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(filename) = path.file_name().and_then(|f| f.to_str()) {
                    if filename.starts_with("guidance_backup_") && filename.ends_with(".db") {
                        let backup_type = if filename.contains("manual") {
                            "Manual".to_string()
                        } else {
                            "Automatic".to_string()
                        };

                        let date_time = if let Ok(metadata) = entry.metadata() {
                            if let Ok(modified) = metadata.modified() {
                                let dt: DateTime<Local> = modified.into();
                                dt.format("%Y-%m-%d %H:%M").to_string()
                            } else {
                                "Unknown".to_string()
                            }
                        } else {
                            "Unknown".to_string()
                        };

                        let file_size = if let Ok(metadata) = entry.metadata() {
                            let bytes = metadata.len();
                            if bytes >= 1_073_741_824 {
                                format!("{:.1} GB", bytes as f64 / 1_073_741_824.0)
                            } else if bytes >= 1_048_576 {
                                format!("{:.1} MB", bytes as f64 / 1_048_576.0)
                            } else {
                                format!("{:.1} KB", bytes as f64 / 1024.0)
                            }
                        } else {
                            "Unknown".to_string()
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

    backups.sort_by(|a, b| b.date_time.cmp(&a.date_time));
    Ok(backups)
}

#[tauri::command]
pub fn create_backup(app: tauri::AppHandle) -> Result<(), String> {
    use std::fs;

    let db_path = crate::db::get_db_path(&app).map_err(|e| e.to_string())?;
    if !db_path.exists() {
        return Err("Database file does not exist".to_string());
    }

    let db_dir = db_path.parent().ok_or("Database directory not found")?;
    let now = chrono::Local::now().format("%Y-%m-%d_%H-%M-%S");
    let backup_path = db_dir.join(format!("guidance_backup_manual_{now}.db"));

    fs::copy(&db_path, &backup_path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn restore_backup(
    app: tauri::AppHandle,
    state: State<'_, DbState>,
    filename: String,
) -> Result<(), String> {
    use std::fs;

    let db_path = crate::db::get_db_path(&app).map_err(|e| e.to_string())?;
    let db_dir = db_path.parent().ok_or("Database directory not found")?;
    let backup_path = db_dir.join(&filename);

    if !backup_path.exists() {
        return Err(format!("Backup file {} does not exist", filename));
    }

    let mut connection_guard = state.connection.lock().map_err(|_| "Failed to lock database state")?;
    
    // Temporarily replace with in-memory connection to drop file handles
    let temp_conn = rusqlite::Connection::open_in_memory().map_err(|e| e.to_string())?;
    *connection_guard = temp_conn;

    // Perform copy
    fs::copy(&backup_path, &db_path).map_err(|e| e.to_string())?;

    // Reopen original connection
    let new_conn = crate::db::open_db(&db_path).map_err(|e| e.to_string())?;
    *connection_guard = new_conn;

    Ok(())
}

