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
  progress   TEXT NOT NULL DEFAULT 'Pending'
);
"#,
    )?;

    let mut stmt = connection.prepare("PRAGMA table_info(cases)")?;
    let mut rows = stmt.query([])?;
    let mut has_date_filed = false;
    let mut has_middle_initial = false;
    let mut has_description = false;
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
    }

    if !has_date_filed {
        connection.execute_batch(
            r#"
ALTER TABLE cases ADD COLUMN date_filed TEXT NOT NULL DEFAULT '';
UPDATE cases SET date_filed = date WHERE date_filed = '';
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

    Ok(())
}
