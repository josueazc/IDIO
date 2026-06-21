//! Circuito de prueba de reservas (proof of reserves).
//!
//! El emisor (Banco Central) demuestra que respalda la subasta:
//!   1. La suma de sus posiciones individuales iguala el `total` declarado,
//!      sin revelar la composición de la cartera.
//!   2. El `total` cubre el monto subastado `auction_amount`.
//!   3. El compromiso público corresponde al total respaldado.
//!
//! El compromiso usa el mismo esquema que el resto del sistema:
//! `SHA-256( be16(total) || salt )`.

use sha256::sha256_var;

global N: u32 = 16; // tamaño máximo de la cartera

fn be16(x: u64) -> [u8; 16] {
    let mut out: [u8; 16] = [0; 16];
    let mut v: u64 = x;
    for i in 0..8 {
        out[15 - i] = (v & 0xff) as u8;
        v = v >> 8;
    }
    out
}

fn commit(amount: u64, salt: [u8; 32]) -> [u8; 32] {
    let amt = be16(amount);
    let mut preimage: [u8; 48] = [0; 48];
    for i in 0..16 {
        preimage[i] = amt[i];
    }
    for i in 0..32 {
        preimage[16 + i] = salt[i];
    }
    sha256_var(preimage, 48)
}

fn main(
    bonds: [u64; N],
    total: u64,
    salt: [u8; 32],
    auction_amount: pub u64,
    commitment: pub [u8; 32],
) {
    // 1. La suma de las posiciones iguala el total declarado.
    let mut sum: u64 = 0;
    for i in 0..N {
        sum += bonds[i];
    }
    assert(sum == total);

    // 2. El total cubre el monto subastado.
    assert(total >= auction_amount);

    // 3. El compromiso coincide con el total respaldado.
    let computed = commit(total, salt);
    assert(computed == commitment);
}

#[test]
fn test_valid_reserves() {
    let mut bonds: [u64; N] = [0; N];
    bonds[0] = 300_000_000;
    bonds[1] = 200_000_000;
    let total: u64 = 500_000_000;
    let salt: [u8; 32] = [3; 32];
    let commitment = commit(total, salt);
    main(bonds, total, salt, 500_000_000, commitment);
}

#[test(should_fail)]
fn test_sum_mismatch_fails() {
    let mut bonds: [u64; N] = [0; N];
    bonds[0] = 100_000_000;
    let total: u64 = 500_000_000; // no coincide con la suma (100M)
    let salt: [u8; 32] = [3; 32];
    let commitment = commit(total, salt);
    main(bonds, total, salt, 500_000_000, commitment);
}

#[test(should_fail)]
fn test_undercollateralized_fails() {
    let mut bonds: [u64; N] = [0; N];
    bonds[0] = 100_000_000;
    let total: u64 = 100_000_000;
    let salt: [u8; 32] = [3; 32];
    let commitment = commit(total, salt);
    // total (100M) < auction_amount (500M)
    main(bonds, total, salt, 500_000_000, commitment);
}
