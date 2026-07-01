//! Genera pruebas Groth16 en JSON para pasar a la CLI de Stellar.
//! Uso:
//!   proof reserves <amount> <pct> <total> <liquid>
//!   proof eligibility <min> <capacity> <bid>

use idio_prover::{proof_to_hex, prove_eligibility, prove_reserves, setup_eligibility, setup_reserves};

fn json(a: &str, b: &str, c: &str) -> String {
    format!("{{\"a\":\"{}\",\"b\":\"{}\",\"c\":\"{}\"}}", a, b, c)
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let seed = 12345u64;
    match args.get(1).map(|s| s.as_str()) {
        Some("reserves") => {
            let amount: u64 = args[2].parse().unwrap();
            let pct: u64 = args[3].parse().unwrap();
            let total: u64 = args[4].parse().unwrap();
            let liquid: u64 = args[5].parse().unwrap();
            let (pk, _) = setup_reserves();
            let (a, b, c) = proof_to_hex(&prove_reserves(&pk, amount, pct, total, liquid, seed));
            println!("{}", json(&a, &b, &c));
        }
        Some("eligibility") => {
            let min: u64 = args[2].parse().unwrap();
            let capacity: u64 = args[3].parse().unwrap();
            let bid: u64 = args[4].parse().unwrap();
            let salt_hex = args.get(5).map(|s| s.as_str()).unwrap_or("0707070707070707070707070707070707070707070707070707070707070707");
            let mut salt = [7u8; 32];
            let sh = salt_hex.strip_prefix("0x").unwrap_or(salt_hex);
            for i in 0..32 {
                salt[i] = u8::from_str_radix(&sh[i * 2..i * 2 + 2], 16).unwrap();
            }
            let (pk, _) = setup_eligibility();
            let (a, b, c) = proof_to_hex(&prove_eligibility(&pk, min, capacity, bid, salt, seed));
            println!("{}", json(&a, &b, &c));
        }
        _ => eprintln!("uso: proof reserves|eligibility <args>"),
    }
}
