//! Circuito de prueba de reservas (proof of reserves).
//!
//! El emisor (Banco Central) demuestra que respalda la subasta:
//!   1. La suma de sus posiciones individuales de bonos iguala el `total`
//!      declarado, sin revelar la composición de la cartera.
//!   2. El `total` cubre el monto subastado `auction_amount`.
//!   3. El compromiso público corresponde al total respaldado.
//!
//! Entradas:
//!   - `bonds`           (privada) — montos individuales de bonos (cartera).
//!   - `total`           (privada) — total declarado de reservas.
//!   - `salt`            (privada) — cegado del compromiso.
//!   - `auction_amount`  (pública) — monto que se quiere subastar.
//!   - `commitment`      (pública) — compromiso publicado on-chain.

use std::hash::poseidon2::Poseidon2;

global N: u32 = 16; // tamaño máximo de la cartera

fn main(
    bonds: [Field; N],
    total: Field,
    salt: Field,
    auction_amount: pub Field,
    commitment: pub Field,
) {
    // 1. La suma de las posiciones iguala el total declarado.
    let mut sum: Field = 0;
    for i in 0..N {
        sum += bonds[i];
    }
    assert(sum == total);

    // 2. El total cubre el monto subastado.
    let total_u: u64 = total as u64;
    let amount_u: u64 = auction_amount as u64;
    assert(total_u >= amount_u);

    // 3. El compromiso coincide con el total respaldado.
    let computed = Poseidon2::hash([total, salt], 2);
    assert(computed == commitment);
}

#[test]
fn test_valid_reserves() {
    let mut bonds = [0; N];
    bonds[0] = 300_000_000;
    bonds[1] = 200_000_000;
    let total = 500_000_000;
    let salt = 999;
    let commitment = std::hash::poseidon2::Poseidon2::hash([total, salt], 2);
    main(bonds, total, salt, 500_000_000, commitment);
}

#[test(should_fail)]
fn test_sum_mismatch_fails() {
    let mut bonds = [0; N];
    bonds[0] = 100_000_000;
    let total = 500_000_000; // no coincide con la suma (100M)
    let salt = 999;
    let commitment = std::hash::poseidon2::Poseidon2::hash([total, salt], 2);
    main(bonds, total, salt, 500_000_000, commitment);
}
