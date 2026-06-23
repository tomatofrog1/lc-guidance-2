use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand::{thread_rng, Rng};
use rand_core::OsRng;

pub fn validate_pin(pin: &str) -> Result<(), String> {
    if pin.len() == 6 && pin.chars().all(|c| c.is_ascii_digit()) {
        Ok(())
    } else {
        Err("PIN must be exactly 6 digits".to_string())
    }
}

pub fn hash_secret(secret: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(secret.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|_| "Failed to secure credentials".to_string())
}

pub fn verify_secret(secret: &str, hash: &str) -> Result<bool, String> {
    let parsed_hash = PasswordHash::new(hash).map_err(|_| "Stored credential is invalid".to_string())?;
    Ok(Argon2::default()
        .verify_password(secret.as_bytes(), &parsed_hash)
        .is_ok())
}

pub fn generate_otp() -> String {
    let value: u32 = thread_rng().gen_range(0..1_000_000);
    format!("{value:06}")
}
