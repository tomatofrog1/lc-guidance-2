use calamine::{open_workbook_auto, Reader, DataType};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::env;
use tauri::State;
use rust_xlsxwriter::{Workbook, Format};

use crate::db::DbState;
use super::{db_error, CaseRecord};

const DB_IMPORT_HEADERS: [&str; 15] = [
    "id",
    "first_name",
    "last_name",
    "middle_initial",
    "level",
    "section",
    "date",
    "date_filed",
    "adviser",
    "case",
    "description",
    "sanction",
    "progress",
    "proofs",
    "students",
];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportRow {
    pub id: String,
    pub first_name: String,
    pub last_name: String,
    pub middle_initial: String,
    pub level: String,
    pub section: String,
    pub date: String,
    pub date_filed: String,
    pub adviser: String,
    pub case: String,
    pub description: String,
    pub sanction: String,
    pub progress: String,
    pub proofs: String,
    pub students: String,
    pub is_duplicate: bool,
    pub existing_case: Option<CaseRecord>,
    pub has_errors: bool,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParseFileResult {
    pub rows: Vec<ImportRow>,
    pub valid_count: usize,
    pub duplicate_count: usize,
    pub error_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportRowInput {
    pub id: String,
    pub first_name: String,
    pub last_name: String,
    pub middle_initial: String,
    pub level: String,
    pub section: String,
    pub date: String,
    pub date_filed: String,
    pub adviser: String,
    pub case: String,
    pub description: String,
    pub sanction: String,
    pub progress: String,
    pub proofs: String,
    pub students: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchImportResult {
    pub success: bool,
    pub inserted_count: usize,
    pub failed_count: usize,
    pub errors: Vec<String>,
}

fn cell_to_db_string(cell: Option<&calamine::Data>) -> String {
    cell.map(|cell| cell.to_string().trim().to_string()).unwrap_or_default()
}

fn cell_to_date_string(cell: Option<&calamine::Data>) -> String {
    match cell {
        Some(cell) => {
            if let Some(dt) = cell.as_date() {
                dt.format("%Y-%m-%d").to_string()
            } else {
                cell.to_string().trim().to_string()
            }
        }
        None => String::new(),
    }
}

fn normalize_id(raw_id: &str) -> Option<String> {
    let trimmed = raw_id.trim();
    if trimmed.is_empty() {
        return None;
    }

    if let Ok(id) = trimmed.parse::<i64>() {
        return Some(id.to_string());
    }

    if let Ok(id) = trimmed.parse::<f64>() {
        if id.is_finite() && id.fract() == 0.0 && id >= 0.0 {
            return Some((id as i64).to_string());
        }
    }

    None
}

fn validate_json_text(value: &str, field_name: &str, errors: &mut Vec<String>) {
    if value.trim().is_empty() {
        return;
    }

    if serde_json::from_str::<serde_json::Value>(value).is_err() {
        errors.push(format!("{field_name} must be valid JSON"));
    }
}

fn find_duplicate_by_id(connection: &rusqlite::Connection, id: i64) -> Result<Option<CaseRecord>, String> {
    use rusqlite::OptionalExtension;
    connection.query_row(
        "SELECT * FROM cases WHERE id = ?1 LIMIT 1",
        params![id],
        super::map_case
    ).optional().map_err(db_error)
}

fn apply_database_import_validation(connection: &rusqlite::Connection, import_row: &mut ImportRow) {
    match normalize_id(&import_row.id) {
        Some(id) => import_row.id = id,
        None => import_row.errors.push("id is required and must be a whole number".to_string()),
    }

    validate_json_text(&import_row.proofs, "proofs", &mut import_row.errors);
    validate_json_text(&import_row.students, "students", &mut import_row.errors);

    import_row.has_errors = !import_row.errors.is_empty();

    if !import_row.has_errors {
        if let Ok(id) = import_row.id.parse::<i64>() {
            if let Ok(Some(existing)) = find_duplicate_by_id(connection, id) {
                import_row.is_duplicate = true;
                import_row.existing_case = Some(existing);
            }
        }
    }
}

#[tauri::command]
pub fn parse_import_file(state: State<'_, DbState>, file_path: String) -> Result<ParseFileResult, String> {
    let connection = state.connection.lock().map_err(db_error)?;

    let mut workbook = open_workbook_auto(&file_path).map_err(|e| format!("Failed to open workbook: {}", e))?;
    
    let sheet_name = workbook.sheet_names().first().ok_or("No sheets found in workbook")?.to_string();
    let range = workbook.worksheet_range(&sheet_name).map_err(|e| format!("Error reading sheet: {:?}", e))?;

    let mut rows_iter = range.rows();
    let header_row = rows_iter.next().ok_or("File is empty or missing headers")?;

    let actual_headers: Vec<String> = header_row
        .iter()
        .map(|cell| cell.to_string().trim().to_string())
        .collect();
    let expected_headers = DB_IMPORT_HEADERS.join(", ");

    if actual_headers.len() != DB_IMPORT_HEADERS.len()
        || actual_headers.iter().zip(DB_IMPORT_HEADERS.iter()).any(|(actual, expected)| actual != expected)
    {
        return Err(format!(
            "Invalid import format. Expected exact database export headers in this order: {expected_headers}"
        ));
    }

    let mut result_rows = Vec::new();
    let mut valid_count = 0;
    let mut duplicate_count = 0;
    let mut error_count = 0;

    for row in rows_iter {
        let has_any_value = row
            .iter()
            .any(|cell| !cell.to_string().trim().is_empty());
        if !has_any_value {
            continue;
        }

        let mut import_row = ImportRow {
            id: cell_to_db_string(row.get(0)),
            first_name: cell_to_db_string(row.get(1)),
            last_name: cell_to_db_string(row.get(2)),
            middle_initial: cell_to_db_string(row.get(3)),
            level: cell_to_db_string(row.get(4)),
            section: cell_to_db_string(row.get(5)),
            date: cell_to_date_string(row.get(6)),
            date_filed: cell_to_date_string(row.get(7)),
            adviser: cell_to_db_string(row.get(8)),
            case: cell_to_db_string(row.get(9)),
            description: cell_to_db_string(row.get(10)),
            sanction: cell_to_db_string(row.get(11)),
            progress: cell_to_db_string(row.get(12)),
            proofs: cell_to_db_string(row.get(13)),
            students: cell_to_db_string(row.get(14)),
            is_duplicate: false,
            existing_case: None,
            has_errors: false,
            errors: Vec::new(),
        };

        apply_database_import_validation(&connection, &mut import_row);

        if import_row.has_errors {
            error_count += 1;
        } else if import_row.is_duplicate {
            duplicate_count += 1;
        } else {
            valid_count += 1;
        }

        result_rows.push(import_row);
    }

    Ok(ParseFileResult {
        rows: result_rows,
        valid_count,
        duplicate_count,
        error_count,
    })
}

#[tauri::command]
pub fn batch_import_cases(state: State<'_, DbState>, rows: Vec<ImportRowInput>) -> Result<BatchImportResult, String> {
    let mut connection = state.connection.lock().map_err(db_error)?;
    
    let tx = connection.transaction().map_err(db_error)?;

    let mut inserted_count = 0;
    let mut failed_count = 0;
    let mut errors = Vec::new();

    {
        let mut stmt = tx.prepare(
            r#"
            INSERT INTO cases (
                id, first_name, last_name, middle_initial, level, section, date, date_filed,
                adviser, "case", description, sanction, progress, proofs, students
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
            "#
        ).map_err(db_error)?;

        for (i, row) in rows.iter().enumerate() {
            let Some(id) = normalize_id(&row.id) else {
                failed_count += 1;
                errors.push(format!("Row {}: id is required and must be a whole number", i + 1));
                continue;
            };

            let res = stmt.execute(params![
                id,
                row.first_name,
                row.last_name,
                row.middle_initial,
                row.level,
                row.section,
                row.date,
                row.date_filed,
                row.adviser,
                row.case,
                row.description,
                row.sanction,
                row.progress,
                row.proofs,
                row.students
            ]);

            match res {
                Ok(_) => inserted_count += 1,
                Err(e) => {
                    failed_count += 1;
                    errors.push(format!("Row {}: DB Error - {}", i + 1, e));
                }
            }
        }
    }

    if failed_count > 0 {
        tx.rollback().map_err(db_error)?;
        return Ok(BatchImportResult {
            success: false,
            inserted_count: 0,
            failed_count,
            errors,
        });
    }

    tx.commit().map_err(db_error)?;

    Ok(BatchImportResult {
        success: true,
        inserted_count,
        failed_count: 0,
        errors: Vec::new(),
    })
}

#[tauri::command]
pub fn generate_import_template() -> Result<String, String> {
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();
    worksheet.set_name("Template").map_err(|e| e.to_string())?;

    let header_format = Format::new()
        .set_bold()
        .set_font_color("#FFFFFF")
        .set_background_color("#002F87");

    let column_widths = [10.0, 18.0, 18.0, 18.0, 16.0, 16.0, 16.0, 22.0, 22.0, 28.0, 42.0, 28.0, 18.0, 48.0, 64.0];

    for (col, header) in DB_IMPORT_HEADERS.iter().enumerate() {
        worksheet.write_string_with_format(0, col as u16, *header, &header_format).map_err(|e| e.to_string())?;
        worksheet.set_column_width(col as u16, column_widths[col]).map_err(|e| e.to_string())?;
    }

    let temp_dir = env::temp_dir();
    let file_path = temp_dir.join("guidance_import_template.xlsx");
    
    workbook.save(&file_path).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn validate_import_row(state: State<'_, DbState>, row: ImportRowInput) -> Result<ImportRow, String> {
    let connection = state.connection.lock().map_err(db_error)?;

    let mut import_row = ImportRow {
        id: row.id.trim().to_string(),
        first_name: row.first_name.trim().to_string(),
        last_name: row.last_name.trim().to_string(),
        middle_initial: row.middle_initial.trim().to_string(),
        level: row.level.trim().to_string(),
        section: row.section.trim().to_string(),
        date: row.date.trim().to_string(),
        date_filed: row.date_filed.trim().to_string(),
        adviser: row.adviser.trim().to_string(),
        case: row.case.trim().to_string(),
        description: row.description.trim().to_string(),
        sanction: row.sanction.trim().to_string(),
        progress: row.progress.trim().to_string(),
        proofs: row.proofs.trim().to_string(),
        students: row.students.trim().to_string(),
        is_duplicate: false,
        existing_case: None,
        has_errors: false,
        errors: Vec::new(),
    };

    apply_database_import_validation(&connection, &mut import_row);

    Ok(import_row)
}

