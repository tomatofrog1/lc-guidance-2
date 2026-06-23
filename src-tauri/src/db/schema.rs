use rusqlite::Connection;

use super::DbResult;

pub fn initialize_schema(connection: &Connection) -> DbResult<()> {
    connection.execute_batch(
        r#"
CREATE TABLE IF NOT EXISTS cases (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  middle_initial TEXT NOT NULL DEFAULT '',
  level      TEXT NOT NULL,
  section    TEXT NOT NULL,
  date       TEXT NOT NULL,
  date_filed TEXT NOT NULL DEFAULT '',
  adviser    TEXT NOT NULL,
  "case"     TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sanction   TEXT NOT NULL,
  progress   TEXT NOT NULL DEFAULT 'Pending',
  proofs     TEXT NOT NULL DEFAULT '[]',
  students   TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS app_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS otp_tokens (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  code_hash  TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0
);
"#,
    )?;

    let mut stmt = connection.prepare("PRAGMA table_info(cases)")?;
    let mut rows = stmt.query([])?;
    let mut has_date_filed = false;
    let mut has_middle_initial = false;
    let mut has_description = false;
    let mut has_proofs = false;
    let mut has_students = false;
    while let Some(row) = rows.next()? {
        let name: String = row.get(1)?;
        if name == "date_filed" {
            has_date_filed = true;
        }
        if name == "middle_initial" {
            has_middle_initial = true;
        }
        if name == "description" {
            has_description = true;
        }
        if name == "proofs" {
            has_proofs = true;
        }
        if name == "students" {
            has_students = true;
        }
    }

    if !has_date_filed {
        connection.execute_batch(
            r#"
ALTER TABLE cases ADD COLUMN date_filed TEXT NOT NULL DEFAULT '';
UPDATE cases SET date_filed = date WHERE date_filed = '';
"#,
        )?;
    }

    if !has_students {
        connection.execute_batch(
            r#"
ALTER TABLE cases ADD COLUMN students TEXT NOT NULL DEFAULT '[]';
UPDATE cases SET students = json_array(json_object(
  'firstName', first_name,
  'lastName', last_name,
  'middleInitial', middle_initial,
  'level', level,
  'section', section,
  'adviser', adviser
)) WHERE students = '[]';
"#,
        )?;
    }

    if !has_middle_initial {
        connection.execute_batch(
            r#"
ALTER TABLE cases ADD COLUMN middle_initial TEXT NOT NULL DEFAULT '';
"#,
        )?;
    }

    if !has_description {
        connection.execute_batch(
            r#"
ALTER TABLE cases ADD COLUMN description TEXT NOT NULL DEFAULT '';
"#,
        )?;
    }

    if !has_proofs {
        connection.execute_batch(
            r#"
ALTER TABLE cases ADD COLUMN proofs TEXT NOT NULL DEFAULT '[]';
"#,
        )?;
    }

    let legacy_proof_table_count: i64 = connection.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'case_proofs'",
        [],
        |row| row.get(0),
    )?;

    if legacy_proof_table_count > 0 {
        connection.execute_batch(
            r#"
UPDATE cases
SET proofs = COALESCE((
  SELECT json_group_array(json_object(
    'name', name,
    'data', data,
    'created_at', created_at
  ))
  FROM case_proofs
  WHERE case_proofs.case_id = cases.id
), '[]')
WHERE EXISTS (
  SELECT 1 FROM case_proofs WHERE case_proofs.case_id = cases.id
);

DROP TABLE case_proofs;
"#,
        )?;
    }

    Ok(())
}
