//! Circuitos Groth16 (BN254) de IDIO y utilidades de prueba/serialización.
//!
//! - `EligibilityCircuit`: prueba `balance ≥ oferta ≥ mínimo` (oferta y balance
//!   privados; mínimo público). Es la condición que el contrato exige al ofertar.
//! - `ReservesCircuit`: prueba `total ≥ monto_subastado` (total privado; monto
//!   público). El emisor la presenta al crear la subasta.
//!
//! La serialización a bytes usa el formato de Soroban BN254 (G1 = 64 bytes
//! `X‖Y` big-endian; G2 = 128 bytes `c1‖c0` por coordenada; Fr = 32 bytes BE),
//! de modo que la verifying key y la prueba se verifican on-chain con
//! `idio-verifier::verify_groth16`.

use ark_bn254::{Bn254, Fq, Fq2, Fr, G1Affine, G2Affine};
use ark_ff::{BigInteger, PrimeField};
use ark_groth16::{Groth16, ProvingKey, VerifyingKey};
use ark_r1cs_std::{alloc::AllocVar, cmp::CmpGadget, fields::fp::FpVar};
use ark_relations::r1cs::{ConstraintSynthesizer, ConstraintSystemRef, SynthesisError};
use ark_snark::SNARK;
use ark_std::rand::{rngs::StdRng, SeedableRng};

// ---------------------------------------------------------------------------
// Circuitos
// ---------------------------------------------------------------------------

/// `balance ≥ bid ≥ min_bid`. `min_bid` público; `bid`, `balance` privados.
#[derive(Clone)]
pub struct EligibilityCircuit {
    pub min_bid: Option<Fr>,
    pub bid: Option<Fr>,
    pub balance: Option<Fr>,
}

impl ConstraintSynthesizer<Fr> for EligibilityCircuit {
    fn generate_constraints(self, cs: ConstraintSystemRef<Fr>) -> Result<(), SynthesisError> {
        let min = FpVar::new_input(cs.clone(), || self.min_bid.ok_or(SynthesisError::AssignmentMissing))?;
        let bid = FpVar::new_witness(cs.clone(), || self.bid.ok_or(SynthesisError::AssignmentMissing))?;
        let bal = FpVar::new_witness(cs.clone(), || self.balance.ok_or(SynthesisError::AssignmentMissing))?;
        // bid >= min  y  balance >= bid
        bid.is_cmp(&min, core::cmp::Ordering::Greater, true)?
            .enforce_equal(&ark_r1cs_std::boolean::Boolean::TRUE)?;
        bal.is_cmp(&bid, core::cmp::Ordering::Greater, true)?
            .enforce_equal(&ark_r1cs_std::boolean::Boolean::TRUE)?;
        Ok(())
    }
}

/// `total ≥ auction_amount`. `auction_amount` público; `total` privado.
#[derive(Clone)]
pub struct ReservesCircuit {
    pub auction_amount: Option<Fr>,
    pub total: Option<Fr>,
}

impl ConstraintSynthesizer<Fr> for ReservesCircuit {
    fn generate_constraints(self, cs: ConstraintSystemRef<Fr>) -> Result<(), SynthesisError> {
        let amount =
            FpVar::new_input(cs.clone(), || self.auction_amount.ok_or(SynthesisError::AssignmentMissing))?;
        let total = FpVar::new_witness(cs.clone(), || self.total.ok_or(SynthesisError::AssignmentMissing))?;
        total
            .is_cmp(&amount, core::cmp::Ordering::Greater, true)?
            .enforce_equal(&ark_r1cs_std::boolean::Boolean::TRUE)?;
        Ok(())
    }
}

use ark_r1cs_std::eq::EqGadget;

// ---------------------------------------------------------------------------
// Setup determinista (semilla fija → pk/vk reproducibles)
// ---------------------------------------------------------------------------

const SEED: u64 = 0x1D10_2026;

pub fn setup_eligibility() -> (ProvingKey<Bn254>, VerifyingKey<Bn254>) {
    let mut rng = StdRng::seed_from_u64(SEED);
    let c = EligibilityCircuit { min_bid: None, bid: None, balance: None };
    Groth16::<Bn254>::circuit_specific_setup(c, &mut rng).unwrap()
}

pub fn setup_reserves() -> (ProvingKey<Bn254>, VerifyingKey<Bn254>) {
    let mut rng = StdRng::seed_from_u64(SEED ^ 0xABCD);
    let c = ReservesCircuit { auction_amount: None, total: None };
    Groth16::<Bn254>::circuit_specific_setup(c, &mut rng).unwrap()
}

pub fn prove_eligibility(
    pk: &ProvingKey<Bn254>,
    min_bid: u64,
    bid: u64,
    balance: u64,
    seed: u64,
) -> ark_groth16::Proof<Bn254> {
    let mut rng = StdRng::seed_from_u64(seed);
    let c = EligibilityCircuit {
        min_bid: Some(Fr::from(min_bid)),
        bid: Some(Fr::from(bid)),
        balance: Some(Fr::from(balance)),
    };
    Groth16::<Bn254>::prove(pk, c, &mut rng).unwrap()
}

pub fn prove_reserves(
    pk: &ProvingKey<Bn254>,
    auction_amount: u64,
    total: u64,
    seed: u64,
) -> ark_groth16::Proof<Bn254> {
    let mut rng = StdRng::seed_from_u64(seed);
    let c = ReservesCircuit {
        auction_amount: Some(Fr::from(auction_amount)),
        total: Some(Fr::from(total)),
    };
    Groth16::<Bn254>::prove(pk, c, &mut rng).unwrap()
}

// ---------------------------------------------------------------------------
// Serialización a bytes de Soroban BN254
// ---------------------------------------------------------------------------

pub fn fq_be(x: &Fq) -> [u8; 32] {
    let v = x.into_bigint().to_bytes_be();
    let mut out = [0u8; 32];
    out[32 - v.len()..].copy_from_slice(&v);
    out
}

pub fn fr_be(x: &Fr) -> [u8; 32] {
    let v = x.into_bigint().to_bytes_be();
    let mut out = [0u8; 32];
    out[32 - v.len()..].copy_from_slice(&v);
    out
}

pub fn g1_bytes(p: &G1Affine) -> [u8; 64] {
    let mut out = [0u8; 64];
    out[..32].copy_from_slice(&fq_be(&p.x));
    out[32..].copy_from_slice(&fq_be(&p.y));
    out
}

fn fq2_be(x: &Fq2) -> [u8; 64] {
    let mut out = [0u8; 64];
    out[..32].copy_from_slice(&fq_be(&x.c1));
    out[32..].copy_from_slice(&fq_be(&x.c0));
    out
}

pub fn g2_bytes(p: &G2Affine) -> [u8; 128] {
    let mut out = [0u8; 128];
    out[..64].copy_from_slice(&fq2_be(&p.x));
    out[64..].copy_from_slice(&fq2_be(&p.y));
    out
}

pub fn hex(bytes: &[u8]) -> ark_std::string::String {
    use ark_std::string::String;
    let mut s = String::new();
    for b in bytes {
        s.push_str(&ark_std::format!("{:02x}", b));
    }
    s
}

/// VK serializada como hex de cada componente (para incrustar en el contrato).
pub struct VkHex {
    pub alpha: ark_std::string::String,
    pub beta: ark_std::string::String,
    pub gamma: ark_std::string::String,
    pub delta: ark_std::string::String,
    pub ic: ark_std::vec::Vec<ark_std::string::String>,
}

pub fn vk_to_hex(vk: &VerifyingKey<Bn254>) -> VkHex {
    use ark_std::vec::Vec;
    let ic: Vec<_> = vk.gamma_abc_g1.iter().map(|p| hex(&g1_bytes(p))).collect();
    VkHex {
        alpha: hex(&g1_bytes(&vk.alpha_g1)),
        beta: hex(&g2_bytes(&vk.beta_g2)),
        gamma: hex(&g2_bytes(&vk.gamma_g2)),
        delta: hex(&g2_bytes(&vk.delta_g2)),
        ic,
    }
}

pub fn proof_to_hex(p: &ark_groth16::Proof<Bn254>) -> (ark_std::string::String, ark_std::string::String, ark_std::string::String) {
    (hex(&g1_bytes(&p.a)), hex(&g2_bytes(&p.b)), hex(&g1_bytes(&p.c)))
}

/// VK como bytes crudos en formato Soroban: (alpha, beta, gamma, delta, ic).
pub fn vk_bytes(
    vk: &VerifyingKey<Bn254>,
) -> ([u8; 64], [u8; 128], [u8; 128], [u8; 128], ark_std::vec::Vec<[u8; 64]>) {
    let ic = vk.gamma_abc_g1.iter().map(|p| g1_bytes(p)).collect();
    (
        g1_bytes(&vk.alpha_g1),
        g2_bytes(&vk.beta_g2),
        g2_bytes(&vk.gamma_g2),
        g2_bytes(&vk.delta_g2),
        ic,
    )
}

/// Prueba como bytes crudos en formato Soroban: (a, b, c).
pub fn proof_bytes(p: &ark_groth16::Proof<Bn254>) -> ([u8; 64], [u8; 128], [u8; 64]) {
    (g1_bytes(&p.a), g2_bytes(&p.b), g1_bytes(&p.c))
}

// ---------------------------------------------------------------------------
// Exports WASM para el navegador (frontend)
// ---------------------------------------------------------------------------

#[cfg(target_arch = "wasm32")]
mod wasm {
    use super::*;
    use std::sync::OnceLock;
    use wasm_bindgen::prelude::*;

    fn elig_pk() -> &'static ProvingKey<Bn254> {
        static PK: OnceLock<ProvingKey<Bn254>> = OnceLock::new();
        PK.get_or_init(|| setup_eligibility().0)
    }
    fn reserves_pk() -> &'static ProvingKey<Bn254> {
        static PK: OnceLock<ProvingKey<Bn254>> = OnceLock::new();
        PK.get_or_init(|| setup_reserves().0)
    }

    /// Prueba de elegibilidad. Devuelve la prueba como hex de 256 bytes
    /// (`a‖b‖c`) lista para construir el `Groth16Proof` del contrato.
    #[wasm_bindgen]
    pub fn prove_eligibility_hex(min_bid: u64, bid: u64, balance: u64, seed: u64) -> String {
        let p = prove_eligibility(elig_pk(), min_bid, bid, balance, seed);
        let (a, b, c) = proof_bytes(&p);
        ark_std::format!("{}{}{}", hex(&a), hex(&b), hex(&c))
    }

    /// Prueba de reservas. Devuelve `a‖b‖c` en hex (256 bytes).
    #[wasm_bindgen]
    pub fn prove_reserves_hex(auction_amount: u64, total: u64, seed: u64) -> String {
        let p = prove_reserves(reserves_pk(), auction_amount, total, seed);
        let (a, b, c) = proof_bytes(&p);
        ark_std::format!("{}{}{}", hex(&a), hex(&b), hex(&c))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn eligibility_proves_and_verifies() {
        let (pk, vk) = setup_eligibility();
        let proof = prove_eligibility(&pk, 10_000_000, 15_000_000, 50_000_000, 42);
        let pvk = Groth16::<Bn254>::process_vk(&vk).unwrap();
        assert!(Groth16::<Bn254>::verify_with_processed_vk(&pvk, &[Fr::from(10_000_000u64)], &proof).unwrap());
    }

    #[test]
    fn reserves_proves_and_verifies() {
        let (pk, vk) = setup_reserves();
        let proof = prove_reserves(&pk, 500_000_000, 500_000_000, 42);
        let pvk = Groth16::<Bn254>::process_vk(&vk).unwrap();
        assert!(Groth16::<Bn254>::verify_with_processed_vk(&pvk, &[Fr::from(500_000_000u64)], &proof).unwrap());
    }
}
