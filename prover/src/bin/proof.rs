//! Genera pruebas Groth16 en JSON para pasar a la CLI de Stellar.
//! Uso:
//!   proof reserves <amount> <total>
//!   proof eligibility <min> <bid> <balance>

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
            let total: u64 = args[3].parse().unwrap();
            let (pk, _) = setup_reserves();
            let (a, b, c) = proof_to_hex(&prove_reserves(&pk, amount, total, seed));
            println!("{}", json(&a, &b, &c));
        }
        Some("eligibility") => {
            let min: u64 = args[2].parse().unwrap();
            let bid: u64 = args[3].parse().unwrap();
            let balance: u64 = args[4].parse().unwrap();
            let (pk, _) = setup_eligibility();
            let (a, b, c) = proof_to_hex(&prove_eligibility(&pk, min, bid, balance, seed));
            println!("{}", json(&a, &b, &c));
        }
        _ => eprintln!("uso: proof reserves|eligibility <args>"),
    }
}
