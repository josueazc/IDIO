//! Circuito de oferta sellada (sealed bid).
//!
//! Demuestra dos cosas sin revelar el monto de la oferta:
//!   1. El bidder dispone de fondos suficientes y supera el mínimo:
//!      `available_balance >= bid_amount >= min_bid`.
//!   2. El compromiso público `commitment` corresponde a `(bid_amount, salt)`.
//!
//! El compromiso se define EXACTAMENTE como en el contrato Soroban y en el
//! frontend:  `SHA-256( be16(bid_amount) || salt )`, donde `be16` son los
//! 16 bytes big-endian del monto (igual que `i128::to_be_bytes`) y `salt`
//! son 32 bytes. Así las tres capas producen el mismo hash.

use sha256::sha256_var;

/// Monto a 16 bytes big-endian (equivale a `i128::to_be_bytes` para
/// valores no negativos que caben en u64).
fn be16(x: u64) -> [u8; 16] {
    let mut out: [u8; 16] = [0; 16];
    let mut v: u64 = x;
    for i in 0..8 {
        out[15 - i] = (v & 0xff) as u8;
        v = v >> 8;
    }
    out
}

/// Compromiso `SHA-256( be16(amount) || salt )`.
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
    bid_amount: u64,
    available_balance: u64,
    salt: [u8; 32],
    min_bid: pub u64,
    commitment: pub [u8; 32],
) {
    // 1. La oferta cubre el mínimo de la subasta.
    assert(bid_amount >= min_bid);
    // 2. El bidder tiene saldo suficiente para respaldar su oferta.
    assert(available_balance >= bid_amount);
    // 3. El compromiso coincide con (bid_amount, salt).
    let computed = commit(bid_amount, salt);
    assert(computed == commitment);
}

#[test]
fn test_valid_bid() {
    let salt: [u8; 32] = [7; 32];
    let commitment = commit(15_000_000, salt);
    main(15_000_000, 50_000_000, salt, 10_000_000, commitment);
}

#[test(should_fail)]
fn test_bid_below_min_fails() {
    let salt: [u8; 32] = [7; 32];
    let commitment = commit(5_000_000, salt);
    main(5_000_000, 50_000_000, salt, 10_000_000, commitment);
}

#[test(should_fail)]
fn test_insufficient_balance_fails() {
    let salt: [u8; 32] = [7; 32];
    let commitment = commit(15_000_000, salt);
    main(15_000_000, 9_000_000, salt, 10_000_000, commitment);
}

#[test(should_fail)]
fn test_wrong_commitment_fails() {
    let salt: [u8; 32] = [7; 32];
    let commitment = commit(15_000_000, salt);
    // Revela un monto distinto al comprometido.
    main(14_000_000, 50_000_000, salt, 10_000_000, commitment);
}
