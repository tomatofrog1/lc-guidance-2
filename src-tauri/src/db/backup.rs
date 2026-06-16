use std::path::Path;

use super::DbResult;

#[cfg(not(debug_assertions))]
pub fn run_backup(db_path: &Path) -> DbResult<()> {
    use chrono::Local;
    use std::{fs, io};

    if !db_path.exists() {
        return Ok(());
    }

    let db_dir = db_path.parent().ok_or_else(|| {
        io::Error::new(
            io::ErrorKind::Other,
            "database path does not have a parent directory",
        )
    })?;

    let today = Local::now().format("%Y-%m-%d");
    let backup_path = db_dir.join(format!("guidance_backup_{today}.db"));

    if backup_path.exists() {
        return Ok(());
    }

    fs::copy(db_path, backup_path)?;

    Ok(())
}

#[cfg(debug_assertions)]
pub fn run_backup(_db_path: &Path) -> DbResult<()> {
    Ok(())
}
