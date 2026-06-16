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
SELECT id, first_name, last_name, level, section, date, adviser, "case", sanction, progress
FROM cases
ORDER BY date DESC
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
  first_name, last_name, level, section, date, adviser, "case", sanction, progress
) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
"#,
            params![
                first_name, last_name, level, section, date, adviser, r#case, sanction, progress
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
    adviser = ?6,
    "case" = ?7,
    sanction = ?8,
    progress = ?9
WHERE id = ?10
"#,
            params![
                first_name, last_name, level, section, date, adviser, r#case, sanction, progress,
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
SELECT id, first_name, last_name, level, section, date, adviser, "case", sanction, progress
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
