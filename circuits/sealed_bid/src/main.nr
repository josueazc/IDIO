//! Circuito de oferta sellada (sealed bid).
//!
//! Demuestra dos cosas sin revelar el monto de la oferta:
//!   1. El bidder dispone de fondos suficientes:  `available_balance >= bid_amount`.
//!   2. El compromiso público `commitment` corresponde a `(bid_amount, salt)`.
//!
//! Entradas:
//!   - `bid_amount`        (privada) — monto que se oferta.
//!   - `available_balance` (privada) — saldo disponible del bidder.
//!   - `salt`              (privada) — cegado para que el compromiso sea oculto.
//!   - `min_bid`           (pública) — mínimo exigido por la subasta.
//!   - `commitment`        (pública) — compromiso publicado on-chain.
//!
//! La prueba convence al contrato de que la oferta es válida y está
//! respaldada, mientras el monto real solo se revela en la fase de reveal.

use std::hash::poseidon2::Poseidon2;

fn main(
    bid_amount: Field,
    available_balance: Field,
    salt: Field,
    min_bid: pub Field,
    commitment: pub Field,
) {
    // 1. La oferta cubre el mínimo de la subasta.
    let bid_u: u64 = bid_amount as u64;
    let min_u: u64 = min_bid as u64;
    assert(bid_u >= min_u);

    // 2. El bidder tiene saldo suficiente para respaldar su oferta.
    let bal_u: u64 = available_balance as u64;
    assert(bal_u >= bid_u);

    // 3. El compromiso coincide:  commitment == Poseidon2(bid_amount, salt).
    let computed = Poseidon2::hash([bid_amount, salt], 2);
    assert(computed == commitment);
}

#[test]
fn test_valid_bid() {
    let bid = 15_000_000;
    let salt = 123456;
    let commitment = std::hash::poseidon2::Poseidon2::hash([bid, salt], 2);
    main(bid, 50_000_000, salt, 10_000_000, commitment);
}

#[test(should_fail)]
fn test_bid_below_min_fails() {
    let bid = 5_000_000;
    let salt = 123456;
    let commitment = std::hash::poseidon2::Poseidon2::hash([bid, salt], 2);
    main(bid, 50_000_000, salt, 10_000_000, commitment);
}

#[test(should_fail)]
fn test_insufficient_balance_fails() {
    let bid = 15_000_000;
    let salt = 123456;
    let commitment = std::hash::poseidon2::Poseidon2::hash([bid, salt], 2);
    main(bid, 9_000_000, salt, 10_000_000, commitment);
}
