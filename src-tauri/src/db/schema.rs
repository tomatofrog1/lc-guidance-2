use rusqlite::Connection;

use super::DbResult;

pub fn initialize_schema(connection: &Connection) -> DbResult<()> {
    connection.execute_batch(
        r#"
CREATE TABLE IF NOT EXISTS cases (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  level      TEXT NOT NULL,
  section    TEXT NOT NULL,
  date       TEXT NOT NULL,
  adviser    TEXT NOT NULL,
  "case"     TEXT NOT NULL,
  sanction   TEXT NOT NULL,
  progress   TEXT NOT NULL DEFAULT 'Pending'
);
"#,
    )?;

    Ok(())
}
