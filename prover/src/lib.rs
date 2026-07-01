//! Circuitos Groth16 (BN254) de IDIO y utilidades de prueba/serialización.
//!
//! - `EligibilityCircuit`: prueba `capacity ≥ oferta ≥ mínimo` y que el
//!   compromiso público `SHA-256(be16(oferta) ‖ salt)` corresponde a la oferta
//!   oculta (mismo esquema que el contrato Soroban y el circuito Noir).
//! - `ReservesCircuit`: prueba `total ≥ monto_subastado` (total privado; monto
//!   público). El emisor la presenta al crear la subasta.
//!
//! La serialización a bytes usa el formato de Soroban BN254 (G1 = 64 bytes
//! `X‖Y` big-endian; G2 = 128 bytes `c1‖c0` por coordenada; Fr = 32 bytes BE),
//! de modo que la verifying key y la prueba se verifican on-chain con
//! `idio-verifier::verify_groth16`.

pub mod membership;

use ark_bn254::{Bn254, Fq, Fq2, Fr, G1Affine, G2Affine};
use ark_ff::{BigInteger, PrimeField};
use ark_groth16::{Groth16, ProvingKey, VerifyingKey};
use ark_crypto_primitives::crh::sha256::{constraints::Sha256Gadget, Sha256};
use ark_crypto_primitives::crh::CRHScheme;
use ark_r1cs_std::eq::EqGadget;
use ark_r1cs_std::uint8::UInt8;
use ark_r1cs_std::uint64::UInt64;
use ark_r1cs_std::{alloc::AllocVar, cmp::CmpGadget, fields::fp::FpVar, prelude::*, R1CSVar};
use ark_relations::r1cs::{ConstraintSynthesizer, ConstraintSystemRef, SynthesisError};
use ark_snark::SNARK;
use ark_std::rand::{rngs::StdRng, SeedableRng};

// ---------------------------------------------------------------------------
// Circuitos
// ---------------------------------------------------------------------------

/// Oferta sellada + elegibilidad: `capacity ≥ bid ≥ min_bid` y
/// `commitment == SHA-256(be16(bid) ‖ salt)`.
/// Públicos: `min_bid`, `capacity`, los 32 bytes del compromiso.
/// Privados: `bid`, `salt`.
#[derive(Clone)]
pub struct EligibilityCircuit {
    pub min_bid: Option<Fr>,
    pub capacity: Option<Fr>,
    pub commitment: Option<[u8; 32]>,
    pub bid: Option<u64>,
    pub salt: Option<[u8; 32]>,
}

fn be16_bytes(bid: u64) -> [u8; 16] {
    let mut out = [0u8; 16];
    let mut v = bid;
    for i in 0..8 {
        out[15 - i] = (v & 0xff) as u8;
        v >>= 8;
    }
    out
}

/// Preimage idéntica al contrato: `be16(bid) ‖ salt` (48 bytes).
pub fn bid_preimage(bid: u64, salt: [u8; 32]) -> [u8; 48] {
    let mut out = [0u8; 48];
    out[..16].copy_from_slice(&be16_bytes(bid));
    out[16..].copy_from_slice(&salt);
    out
}

/// Compromiso on-chain / frontend: `SHA-256(preimage)`.
pub fn bid_commitment(bid: u64, salt: [u8; 32]) -> [u8; 32] {
    let digest = Sha256::evaluate(&(), &bid_preimage(bid, salt)[..]).unwrap();
    let mut out = [0u8; 32];
    out.copy_from_slice(&digest);
    out
}

/// Entradas públicas Groth16: `[min_bid, capacity, commitment_fr]`.
pub fn eligibility_public_inputs(min_bid: u64, capacity: u64, commitment: [u8; 32]) -> Vec<Fr> {
    vec![
        Fr::from(min_bid),
        Fr::from(capacity),
        Fr::from_be_bytes_mod_order(&commitment),
    ]
}

fn digest_to_fr(bytes: &[UInt8<Fr>]) -> Result<FpVar<Fr>, SynthesisError> {
    use ark_r1cs_std::convert::ToBitsGadget;
    let mut acc = FpVar::zero();
    let base = FpVar::constant(Fr::from(256u64));
    for b in bytes {
        let mut val = FpVar::zero();
        let mut pow = FpVar::one();
        for bit in b.to_bits_le()? {
            val = &val + &FpVar::from(bit) * &pow;
            pow = &pow * &FpVar::constant(Fr::from(2u64));
        }
        acc = &acc * &base + &val;
    }
    Ok(acc)
}

fn fr_to_u64(fr: Fr) -> u64 {
    fr.into_bigint().as_ref().first().copied().unwrap_or(0)
}

impl ConstraintSynthesizer<Fr> for EligibilityCircuit {
    fn generate_constraints(self, cs: ConstraintSystemRef<Fr>) -> Result<(), SynthesisError> {
        let min = FpVar::new_input(cs.clone(), || self.min_bid.ok_or(SynthesisError::AssignmentMissing))?;
        let cap = FpVar::new_input(cs.clone(), || self.capacity.ok_or(SynthesisError::AssignmentMissing))?;
        let commitment_fr = FpVar::new_input(cs.clone(), || {
            self.commitment
                .map(|c| Fr::from_be_bytes_mod_order(&c))
                .ok_or(SynthesisError::AssignmentMissing)
        })?;

        let bid_u64 = UInt64::new_witness(cs.clone(), || self.bid.ok_or(SynthesisError::AssignmentMissing))?;
        let bid_fp = bid_u64.to_fp()?;
        bid_fp
            .is_cmp(&min, core::cmp::Ordering::Greater, true)?
            .enforce_equal(&Boolean::TRUE)?;
        cap.is_cmp(&bid_fp, core::cmp::Ordering::Greater, true)?
            .enforce_equal(&Boolean::TRUE)?;

        let salt_arr = self.salt.ok_or(SynthesisError::AssignmentMissing)?;
        let salt_vars: Vec<UInt8<Fr>> = (0..32)
            .map(|i| UInt8::new_witness(cs.clone(), || Ok(salt_arr[i])))
            .collect::<Result<_, _>>()?;

        let mut preimage = Vec::with_capacity(48);
        for _ in 0..8 {
            preimage.push(UInt8::constant(0u8));
        }
        preimage.extend(bid_u64.to_bytes_be()?);
        preimage.extend(salt_vars);

        let digest = Sha256Gadget::<Fr>::digest(&preimage)?;
        digest_to_fr(&digest.0)?.enforce_equal(&commitment_fr)?;
        Ok(())
    }
}

/// Auspex+: política de reservas/solvencia probada en ZK.
/// Públicos: `auction_amount`, `min_liquidity_pct` (p. ej. 30).
/// Privados: `total` (reservas) y `liquid` (parte líquida).
/// Prueba, sin revelar los números:
///   1. `total ≥ auction_amount`            (respaldo del activo)
///   2. `liquid ≤ total`                     (consistencia)
///   3. `liquid·100 ≥ min_liquidity_pct·total` (ratio de liquidez)
#[derive(Clone)]
pub struct ReservesCircuit {
    pub auction_amount: Option<Fr>,
    pub min_liquidity_pct: Option<Fr>,
    pub total: Option<Fr>,
    pub liquid: Option<Fr>,
}

impl ConstraintSynthesizer<Fr> for ReservesCircuit {
    fn generate_constraints(self, cs: ConstraintSystemRef<Fr>) -> Result<(), SynthesisError> {
        let amount =
            FpVar::new_input(cs.clone(), || self.auction_amount.ok_or(SynthesisError::AssignmentMissing))?;
        let pct = FpVar::new_input(cs.clone(), || {
            self.min_liquidity_pct.ok_or(SynthesisError::AssignmentMissing)
        })?;
        let total = FpVar::new_witness(cs.clone(), || self.total.ok_or(SynthesisError::AssignmentMissing))?;
        let liquid = FpVar::new_witness(cs.clone(), || self.liquid.ok_or(SynthesisError::AssignmentMissing))?;

        // 1. total >= amount
        total
            .is_cmp(&amount, core::cmp::Ordering::Greater, true)?
            .enforce_equal(&ark_r1cs_std::boolean::Boolean::TRUE)?;
        // 2. liquid <= total
        liquid
            .is_cmp(&total, core::cmp::Ordering::Less, true)?
            .enforce_equal(&ark_r1cs_std::boolean::Boolean::TRUE)?;
        // 3. liquid*100 >= pct*total
        let hundred = FpVar::new_constant(cs.clone(), Fr::from(100u64))?;
        let liquid_100 = &liquid * &hundred;
        let pct_total = &pct * &total;
        liquid_100
            .is_cmp(&pct_total, core::cmp::Ordering::Greater, true)?
            .enforce_equal(&ark_r1cs_std::boolean::Boolean::TRUE)?;
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Setup determinista (semilla fija → pk/vk reproducibles)
// ---------------------------------------------------------------------------

const SEED: u64 = 0x1D10_2027;

pub fn setup_eligibility() -> (ProvingKey<Bn254>, VerifyingKey<Bn254>) {
    let mut rng = StdRng::seed_from_u64(SEED);
    let salt = [9u8; 32];
    let commitment = bid_commitment(1, salt);
    let c = EligibilityCircuit {
        min_bid: Some(Fr::from(1u64)),
        capacity: Some(Fr::from(1_000_000u64)),
        commitment: Some(commitment),
        bid: Some(1),
        salt: Some(salt),
    };
    Groth16::<Bn254>::circuit_specific_setup(c, &mut rng).unwrap()
}

pub fn setup_reserves() -> (ProvingKey<Bn254>, VerifyingKey<Bn254>) {
    let mut rng = StdRng::seed_from_u64(SEED ^ 0xABCD);
    let c = ReservesCircuit { auction_amount: None, min_liquidity_pct: None, total: None, liquid: None };
    Groth16::<Bn254>::circuit_specific_setup(c, &mut rng).unwrap()
}

pub fn prove_eligibility(
    pk: &ProvingKey<Bn254>,
    min_bid: u64,
    capacity: u64,
    bid: u64,
    salt: [u8; 32],
    seed: u64,
) -> ark_groth16::Proof<Bn254> {
    let mut rng = StdRng::seed_from_u64(seed);
    let commitment = bid_commitment(bid, salt);
    let c = EligibilityCircuit {
        min_bid: Some(Fr::from(min_bid)),
        capacity: Some(Fr::from(capacity)),
        commitment: Some(commitment),
        bid: Some(bid),
        salt: Some(salt),
    };
    Groth16::<Bn254>::prove(pk, c, &mut rng).unwrap()
}

pub fn prove_reserves(
    pk: &ProvingKey<Bn254>,
    auction_amount: u64,
    min_liquidity_pct: u64,
    total: u64,
    liquid: u64,
    seed: u64,
) -> ark_groth16::Proof<Bn254> {
    let mut rng = StdRng::seed_from_u64(seed);
    let c = ReservesCircuit {
        auction_amount: Some(Fr::from(auction_amount)),
        min_liquidity_pct: Some(Fr::from(min_liquidity_pct)),
        total: Some(Fr::from(total)),
        liquid: Some(Fr::from(liquid)),
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
    fn membership_pk() -> &'static ProvingKey<Bn254> {
        static PK: OnceLock<ProvingKey<Bn254>> = OnceLock::new();
        PK.get_or_init(|| crate::membership::setup_membership().0)
    }

    /// Prueba de elegibilidad. Devuelve la prueba como hex de 256 bytes
    /// (`a‖b‖c`) lista para construir el `Groth16Proof` del contrato.
    #[wasm_bindgen]
    pub fn prove_eligibility_hex(
        min_bid: u64,
        capacity: u64,
        bid: u64,
        salt_hex: &str,
        seed: u64,
    ) -> String {
        let salt = parse_hex32(salt_hex).expect("salt hex inválido (64 chars)");
        let p = prove_eligibility(elig_pk(), min_bid, capacity, bid, salt, seed);
        let (a, b, c) = proof_bytes(&p);
        ark_std::format!("{}{}{}", hex(&a), hex(&b), hex(&c))
    }

    fn parse_hex32(s: &str) -> Result<[u8; 32], ()> {
        let s = s.strip_prefix("0x").unwrap_or(s);
        if s.len() != 64 {
            return Err(());
        }
        let mut out = [0u8; 32];
        for i in 0..32 {
            out[i] = u8::from_str_radix(&s[i * 2..i * 2 + 2], 16).map_err(|_| ())?;
        }
        Ok(out)
    }

    /// Prueba de reservas. Devuelve `a‖b‖c` en hex (256 bytes).
    #[wasm_bindgen]
    pub fn prove_reserves_hex(
        auction_amount: u64,
        min_liquidity_pct: u64,
        total: u64,
        liquid: u64,
        seed: u64,
    ) -> String {
        let p = prove_reserves(reserves_pk(), auction_amount, min_liquidity_pct, total, liquid, seed);
        let (a, b, c) = proof_bytes(&p);
        ark_std::format!("{}{}{}", hex(&a), hex(&b), hex(&c))
    }

    /// Covenant: prueba de pertenencia (Merkle + nullifier). `secrets_csv` es la
    /// lista de secretos del árbol (u64 separados por comas), `index` el del
    /// banco que prueba. Devuelve en hex: `a‖b‖c‖nullifier‖root`
    /// (256 + 32 + 32 = 320 bytes = 640 chars) para construir el bid Covenant.
    #[wasm_bindgen]
    pub fn prove_membership_hex(secrets_csv: String, index: u32, seed: u64) -> String {
        let secrets: ark_std::vec::Vec<Fr> = secrets_csv
            .split(',')
            .filter(|s| !s.trim().is_empty())
            .map(|s| Fr::from(s.trim().parse::<u64>().unwrap_or(0)))
            .collect();
        let (proof, root, null) =
            crate::membership::prove_membership(membership_pk(), &secrets, index as usize, seed);
        let (a, b, c) = proof_bytes(&proof);
        ark_std::format!(
            "{}{}{}{}{}",
            hex(&a),
            hex(&b),
            hex(&c),
            hex(&fr_be(&null)),
            hex(&fr_be(&root))
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn eligibility_public_input_count() {
        let salt = [7u8; 32];
        let bid = 15_000_000u64;
        let commitment = bid_commitment(bid, salt);
        let c = EligibilityCircuit {
            min_bid: Some(Fr::from(10_000_000u64)),
            capacity: Some(Fr::from(50_000_000u64)),
            commitment: Some(commitment),
            bid: Some(bid),
            salt: Some(salt),
        };
        let cs = ark_relations::r1cs::ConstraintSystem::<Fr>::new_ref();
        c.generate_constraints(cs.clone()).unwrap();
        let n = cs.num_instance_variables();
        let w = cs.num_witness_variables();
        let c = cs.num_constraints();
        eprintln!("instance={n} witness={w} constraints={c}");
        assert_eq!(n, 4, "expected 3 public inputs + constant 1");
    }

    #[test]
    fn eligibility_proves_and_verifies() {
        let salt = [7u8; 32];
        let bid = 15_000_000u64;
        let commitment = bid_commitment(bid, salt);
        let (pk, vk) = setup_eligibility();
        let proof = prove_eligibility(&pk, 10_000_000, 50_000_000, bid, salt, 42);
        let pvk = Groth16::<Bn254>::process_vk(&vk).unwrap();
        let public = eligibility_public_inputs(10_000_000, 50_000_000, commitment);
        assert_eq!(public.len() + 1, vk.gamma_abc_g1.len(), "public input count mismatch");
        assert!(Groth16::<Bn254>::verify_with_processed_vk(&pvk, &public, &proof).unwrap());
    }

    #[test]
    #[should_panic]
    fn eligibility_bid_above_capacity_cannot_be_generated() {
        let salt = [7u8; 32];
        let (pk, _) = setup_eligibility();
        let _ = prove_eligibility(&pk, 10_000_000, 50_000_000, 60_000_000, salt, 42);
    }

    #[test]
    #[should_panic]
    fn eligibility_wrong_commitment_cannot_be_generated() {
        let salt = [7u8; 32];
        let bad_commitment = bid_commitment(14_000_000, salt);
        let (pk, _) = setup_eligibility();
        let c = EligibilityCircuit {
            min_bid: Some(Fr::from(10_000_000u64)),
            capacity: Some(Fr::from(50_000_000u64)),
            commitment: Some(bad_commitment),
            bid: Some(15_000_000),
            salt: Some(salt),
        };
        let mut rng = StdRng::seed_from_u64(42);
        let _ = Groth16::<Bn254>::prove(&pk, c, &mut rng).unwrap();
    }

    #[test]
    fn reserves_proves_and_verifies() {
        let (pk, vk) = setup_reserves();
        // amount=500M, pct=30; total=600M, liquid=300M (ratio 50% ≥ 30%).
        let proof = prove_reserves(&pk, 500_000_000, 30, 600_000_000, 300_000_000, 42);
        let pvk = Groth16::<Bn254>::process_vk(&vk).unwrap();
        assert!(Groth16::<Bn254>::verify_with_processed_vk(
            &pvk,
            &[Fr::from(500_000_000u64), Fr::from(30u64)],
            &proof
        )
        .unwrap());
    }

    #[test]
    #[should_panic]
    fn reserves_with_insufficient_liquidity_cannot_be_generated() {
        // Auspex+ negativo: total=600M pero liquid=100M (ratio 16.7% < 30%).
        // El circuito no se satisface, así que la prueba NO verifica.
        let (pk, vk) = setup_reserves();
        let proof = prove_reserves(&pk, 500_000_000, 30, 600_000_000, 100_000_000, 42);
        let pvk = Groth16::<Bn254>::process_vk(&vk).unwrap();
        let ok = Groth16::<Bn254>::verify_with_processed_vk(
            &pvk,
            &[Fr::from(500_000_000u64), Fr::from(30u64)],
            &proof,
        )
        .unwrap_or(false);
        assert!(!ok, "una prueba con liquidez insuficiente no debe verificar");
    }

    #[test]
    #[should_panic]
    fn reserves_undercollateralized_cannot_be_generated() {
        // total=400M < monto=500M: no respalda el activo.
        let (pk, vk) = setup_reserves();
        let proof = prove_reserves(&pk, 500_000_000, 30, 400_000_000, 400_000_000, 42);
        let pvk = Groth16::<Bn254>::process_vk(&vk).unwrap();
        let ok = Groth16::<Bn254>::verify_with_processed_vk(
            &pvk,
            &[Fr::from(500_000_000u64), Fr::from(30u64)],
            &proof,
        )
        .unwrap_or(false);
        assert!(!ok, "una prueba sin respaldo suficiente no debe verificar");
    }
}
