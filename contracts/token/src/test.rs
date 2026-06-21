//! Tests del token confidencial Pedersen sobre BN254.
//!
//! Genera el generador `H` con arkworks (por incremento desde una semilla,
//! de modo que su logaritmo discreto respecto de `G` es desconocido) y
//! verifica el flujo: emisión, transferencia homomórfica y apertura.

use super::*;
use soroban_sdk::{testutils::Address as _, BytesN, Env};

use ark_bn254::{Fq, Fr, G1Affine};
use ark_ff::{BigInteger, Field, PrimeField};

fn fq_be(x: &Fq) -> [u8; 32] {
    let v = x.into_bigint().to_bytes_be();
    let mut out = [0u8; 32];
    out[32 - v.len()..].copy_from_slice(&v);
    out
}

fn fr_be(x: &Fr) -> [u8; 32] {
    let v = x.into_bigint().to_bytes_be();
    let mut out = [0u8; 32];
    out[32 - v.len()..].copy_from_slice(&v);
    out
}

fn g1_bytes(env: &Env, p: &G1Affine) -> BytesN<64> {
    let mut out = [0u8; 64];
    out[..32].copy_from_slice(&fq_be(&p.x));
    out[32..].copy_from_slice(&fq_be(&p.y));
    BytesN::from_array(env, &out)
}

/// Genera H sobre la curva por incremento desde una semilla (≠ generador G).
fn nums_h(env: &Env) -> BytesN<64> {
    let mut x = Fq::from(31337u64);
    loop {
        if let Some(p) = G1Affine::get_point_from_x_unchecked(x, true) {
            return g1_bytes(env, &p);
        }
        x += Fq::ONE;
    }
}

#[test]
fn confidential_pedersen_flow() {
    let env = Env::default();
    env.mock_all_auths();
    let id = env.register(ConfidentialToken, ());
    let client = ConfidentialTokenClient::new(&env, &id);

    let admin = Address::generate(&env);
    let bank_b = Address::generate(&env);
    let central = Address::generate(&env);

    let h = nums_h(&env);
    client.initialize(&admin, &h);

    // Cegados (blindings) como elementos Fr.
    let r1 = Fr::from(777u64); // blinding del mint a bank_b
    let r2 = Fr::from(444u64); // blinding de la transferencia
    let r1_be = BytesN::from_array(&env, &fr_be(&r1));
    let r2_be = BytesN::from_array(&env, &fr_be(&r2));

    // Emisión: bank_b recibe 50M.
    client.mint(&bank_b, &50_000_000, &r1_be);

    // Apertura correcta del balance de bank_b: (50M, r1).
    assert!(client.verify_opening(&bank_b, &50_000_000, &r1_be));
    // Apertura incorrecta (otro monto) → falla: binding.
    assert!(!client.verify_opening(&bank_b, &49_000_000, &r1_be));

    // Transferencia confidencial de 15M de bank_b a central.
    let t = client.commit_value(&15_000_000, &r2_be);
    client.transfer(&bank_b, &central, &t);

    // Homomorfismo: bank_b ahora abre a (35M, r1 - r2); central a (15M, r2).
    let r_diff = BytesN::from_array(&env, &fr_be(&(r1 - r2)));
    assert!(client.verify_opening(&bank_b, &35_000_000, &r_diff));
    assert!(client.verify_opening(&central, &15_000_000, &r2_be));

    // El compromiso público existe y es un punto de 64 bytes (no revela monto).
    let c = client.commitment(&central);
    assert_eq!(c.to_array().len(), 64);
}
