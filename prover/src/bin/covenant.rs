//! Calcula la raíz Merkle del set de miembros del Covenant, para configurar el
//! ASP con `set_membership`. Los secretos deben coincidir con
//! `frontend/src/config.ts` (`config.covenant.secretsCsv`).
//!
//! Uso:
//!   cargo run --bin covenant --release            # secretos 1..=8 (default)
//!   cargo run --bin covenant --release -- 1,2,3   # secretos explícitos

use ark_bn254::Fr;
use idio_prover::hex;
use idio_prover::membership::build_tree;
use idio_prover::fr_be;

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let secrets: Vec<Fr> = if args.is_empty() {
        (1..=8u64).map(Fr::from).collect()
    } else {
        args[0]
            .split(',')
            .filter(|s| !s.trim().is_empty())
            .map(|s| Fr::from(s.trim().parse::<u64>().expect("secreto u64 inválido")))
            .collect()
    };
    let tree = build_tree(&secrets);
    println!("MEMBERSHIP_ROOT={}", hex(&fr_be(&tree.root())));
}
