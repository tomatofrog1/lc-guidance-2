use calamine::{open_workbook_auto, Reader, DataType};
use chrono::NaiveDate;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use tauri::State;
use rust_xlsxwriter::{Workbook, Format};
use serde_json::json;

use crate::db::DbState;
use super::{db_error, CaseRecord};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportRow {
    pub first_name: String,
    pub last_name: String,
    pub level: String,
    pub section: String,
    pub date: String,
    pub adviser: String,
    pub case: String,
    pub sanction: String,
    pub progress: String,
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
    pub first_name: String,
    pub last_name: String,
    pub level: String,
    pub section: String,
    pub date: String,
    pub adviser: String,
    pub case: String,
    pub sanction: String,
    pub progress: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchImportResult {
    pub success: bool,
    pub inserted_count: usize,
    pub failed_count: usize,
    pub errors: Vec<String>,
}

fn parse_date(date_str: &str) -> Option<String> {
    let formats = ["%Y-%m-%d", "%m/%d/%Y", "%m-%d-%Y", "%B %d, %Y"];
    for format in formats.iter() {
        if let Ok(date) = NaiveDate::parse_from_str(date_str, format) {
            return Some(date.format("%Y-%m-%d").to_string());
        }
    }
    None
}

fn map_progress(progress: &str) -> String {
    let p = progress.to_lowercase();
    if p.contains("ongoing") {
        "Ongoing".to_string()
    } else if p.contains("resolved") {
        "Resolved".to_string()
    } else {
        "Ongoing".to_string()
    }
}

fn find_duplicate(connection: &rusqlite::Connection, first_name: &str, last_name: &str, date: &str, case: &str) -> Result<Option<CaseRecord>, String> {
    use rusqlite::OptionalExtension;
    connection.query_row(
        "SELECT * FROM cases WHERE first_name = ?1 AND last_name = ?2 AND date = ?3 AND \"case\" = ?4 LIMIT 1",
        params![first_name, last_name, date, case],
        super::map_case
    ).optional().map_err(db_error)
}

#[tauri::command]
pub fn parse_import_file(state: State<'_, DbState>, file_path: String) -> Result<ParseFileResult, String> {
    let connection = state.connection.lock().map_err(db_error)?;

    let mut workbook = open_workbook_auto(&file_path).map_err(|e| format!("Failed to open workbook: {}", e))?;
    
    let sheet_name = workbook.sheet_names().first().ok_or("No sheets found in workbook")?.to_string();
    let range = workbook.worksheet_range(&sheet_name).map_err(|e| format!("Error reading sheet: {:?}", e))?;

    let mut rows_iter = range.rows();
    let header_row = rows_iter.next().ok_or("File is empty or missing headers")?;

    let expected_headers = ["first name", "last name", "level", "section", "date", "adviser", "case", "sanction", "progress"];
    let mut header_map: HashMap<String, usize> = HashMap::new();

    for (i, cell) in header_row.iter().enumerate() {
        let h = cell.to_string().to_lowercase().replace("_", " ").trim().to_string();
        header_map.insert(h, i);
    }

    let mut missing_headers = Vec::new();
    for req in expected_headers.iter() {
        if !header_map.contains_key(*req) {
            missing_headers.push(*req);
        }
    }

    if !missing_headers.is_empty() {
        return Err(format!("Missing required columns: {}", missing_headers.join(", ")));
    }

    let mut result_rows = Vec::new();
    let mut valid_count = 0;
    let mut duplicate_count = 0;
    let mut error_count = 0;

    for row in rows_iter {
        let mut import_row = ImportRow {
            first_name: row.get(*header_map.get("first name").unwrap()).map(|c| c.to_string().trim().to_string()).unwrap_or_default(),
            last_name: row.get(*header_map.get("last name").unwrap()).map(|c| c.to_string().trim().to_string()).unwrap_or_default(),
            level: row.get(*header_map.get("level").unwrap()).map(|c| c.to_string().trim().to_string()).unwrap_or_default(),
            section: row.get(*header_map.get("section").unwrap()).map(|c| c.to_string().trim().to_string()).unwrap_or_default(),
            date: "".to_string(),
            adviser: row.get(*header_map.get("adviser").unwrap()).map(|c| c.to_string().trim().to_string()).unwrap_or_default(),
            case: row.get(*header_map.get("case").unwrap()).map(|c| c.to_string().trim().to_string()).unwrap_or_default(),
            sanction: row.get(*header_map.get("sanction").unwrap()).map(|c| c.to_string().trim().to_string()).unwrap_or_default(),
            progress: row.get(*header_map.get("progress").unwrap()).map(|c| c.to_string().trim().to_string()).unwrap_or_default(),
            is_duplicate: false,
            existing_case: None,
            has_errors: false,
            errors: Vec::new(),
        };

        if import_row.first_name.is_empty() && import_row.last_name.is_empty() && import_row.case.is_empty() {
            continue;
        }

        let raw_date = row.get(*header_map.get("date").unwrap());
        if let Some(cell) = raw_date {
            if let Some(dt) = cell.as_date() {
                import_row.date = dt.format("%Y-%m-%d").to_string();
            } else {
                let d_str = cell.to_string().trim().to_string();
                if !d_str.is_empty() {
                    if let Some(parsed) = parse_date(&d_str) {
                        import_row.date = parsed;
                    } else {
                        import_row.date = d_str;
                        import_row.errors.push("Invalid date format. Expected YYYY-MM-DD or MM/DD/YYYY".to_string());
                    }
                }
            }
        }

        import_row.progress = map_progress(&import_row.progress);

        if import_row.first_name.is_empty() { import_row.errors.push("First name is required".to_string()); }
        if import_row.last_name.is_empty() { import_row.errors.push("Last name is required".to_string()); }
        if import_row.level.is_empty() { import_row.errors.push("Level is required".to_string()); }
        if import_row.section.is_empty() { import_row.errors.push("Section is required".to_string()); }
        if import_row.case.is_empty() { import_row.errors.push("Case is required".to_string()); }
        if import_row.date.is_empty() { import_row.errors.push("Date is required".to_string()); }

        import_row.has_errors = !import_row.errors.is_empty();

        if !import_row.has_errors {
            if let Ok(Some(existing)) = find_duplicate(&connection, &import_row.first_name, &import_row.last_name, &import_row.date, &import_row.case) {
                import_row.is_duplicate = true;
                import_row.existing_case = Some(existing);
            }
        }

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

    let now = chrono::Local::now().format("%m/%d/%Y").to_string();

    {
        let mut stmt = tx.prepare(
            r#"
            INSERT INTO cases (
                students, date, date_filed, "case", description, sanction, progress, proofs,
                first_name, last_name, middle_initial, level, section, adviser
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
            "#
        ).map_err(db_error)?;

        for (i, row) in rows.iter().enumerate() {
            if row.first_name.is_empty() || row.last_name.is_empty() || row.date.is_empty() || row.case.is_empty() {
                failed_count += 1;
                errors.push(format!("Row {}: Missing required fields", i + 1));
                continue;
            }

            let progress = map_progress(&row.progress);

            // Construct the students JSON array with camelCase properties expected by the frontend
            let students_val = json!([
                {
                    "firstName": row.first_name,
                    "lastName": row.last_name,
                    "middleInitial": "",
                    "level": row.level,
                    "section": row.section,
                    "adviser": row.adviser
                }
            ]);
            let students_json = serde_json::to_string(&students_val).unwrap_or_else(|_| "[]".to_string());

            let res = stmt.execute(params![
                students_json,
                row.date,
                now,
                row.case,
                "",
                row.sanction,
                progress,
                "[]",
                row.first_name,
                row.last_name,
                "",
                row.level,
                row.section,
                row.adviser
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

    let headers = ["First Name", "Last Name", "Level", "Section", "Date", "Adviser", "Case", "Sanction", "Progress"];
    
    for (col, header) in headers.iter().enumerate() {
        worksheet.write_string_with_format(0, col as u16, *header, &header_format).map_err(|e| e.to_string())?;
        worksheet.set_column_width(col as u16, 15.0).map_err(|e| e.to_string())?;
    }

    let sample_data = [
        ["Juan", "Dela Cruz", "Grade 7", "St. Peter", "2024-01-15", "Mr. Smith", "Bullying", "Suspension", "Ongoing"],
        ["Maria", "Clara", "Grade 8", "St. Paul", "2024-02-20", "Ms. Jane", "Cutting Classes", "Warning", "Resolved"],
    ];

    for (row_idx, row_data) in sample_data.iter().enumerate() {
        for (col_idx, val) in row_data.iter().enumerate() {
            worksheet.write_string((row_idx + 1) as u32, col_idx as u16, *val).map_err(|e| e.to_string())?;
        }
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
        first_name: row.first_name.trim().to_string(),
        last_name: row.last_name.trim().to_string(),
        level: row.level.trim().to_string(),
        section: row.section.trim().to_string(),
        date: "".to_string(),
        adviser: row.adviser.trim().to_string(),
        case: row.case.trim().to_string(),
        sanction: row.sanction.trim().to_string(),
        progress: row.progress.trim().to_string(),
        is_duplicate: false,
        existing_case: None,
        has_errors: false,
        errors: Vec::new(),
    };

    if !row.date.trim().is_empty() {
        if let Some(parsed) = parse_date(row.date.trim()) {
            import_row.date = parsed;
        } else {
            import_row.date = row.date.trim().to_string();
            import_row.errors.push("Invalid date format. Expected YYYY-MM-DD or MM/DD/YYYY".to_string());
        }
    }

    import_row.progress = map_progress(&import_row.progress);

    if import_row.first_name.is_empty() { import_row.errors.push("First name is required".to_string()); }
    if import_row.last_name.is_empty() { import_row.errors.push("Last name is required".to_string()); }
    if import_row.level.is_empty() { import_row.errors.push("Level is required".to_string()); }
    if import_row.section.is_empty() { import_row.errors.push("Section is required".to_string()); }
    if import_row.case.is_empty() { import_row.errors.push("Case is required".to_string()); }
    if import_row.date.is_empty() { import_row.errors.push("Date is required".to_string()); }

    import_row.has_errors = !import_row.errors.is_empty();

    if !import_row.has_errors {
        if let Ok(Some(existing)) = find_duplicate(&connection, &import_row.first_name, &import_row.last_name, &import_row.date, &import_row.case) {
            import_row.is_duplicate = true;
            import_row.existing_case = Some(existing);
        }
    }

    Ok(import_row)
}

