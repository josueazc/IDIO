//! Test de verificación Groth16 BN254 end-to-end.
//!
//! Genera una verifying key y una prueba REALES con arkworks para el circuito
//! `a · b = c` (con `c` como entrada pública), las serializa al formato de
//! Soroban y las verifica on-chain a través de `verify_groth16`, que ejecuta
//! las host functions BN254 nativas del entorno de pruebas de Soroban.

use super::*;
use soroban_sdk::{BytesN, Env, Vec as SVec};

use ark_bn254::{Bn254, Fq, Fq2, Fr, G1Affine, G2Affine};
use ark_ff::{BigInteger, PrimeField};
use ark_groth16::Groth16;
use ark_relations::lc;
use ark_relations::r1cs::{ConstraintSynthesizer, ConstraintSystemRef, SynthesisError};
use ark_snark::SNARK;
use ark_std::rand::{rngs::StdRng, SeedableRng};

/// Circuito: conozco `a`, `b` (privados) tales que `a * b = c` (público).
#[derive(Clone)]
struct MulCircuit {
    a: Option<Fr>,
    b: Option<Fr>,
    c: Option<Fr>,
}

impl ConstraintSynthesizer<Fr> for MulCircuit {
    fn generate_constraints(self, cs: ConstraintSystemRef<Fr>) -> Result<(), SynthesisError> {
        let a = cs.new_witness_variable(|| self.a.ok_or(SynthesisError::AssignmentMissing))?;
        let b = cs.new_witness_variable(|| self.b.ok_or(SynthesisError::AssignmentMissing))?;
        let c = cs.new_input_variable(|| self.c.ok_or(SynthesisError::AssignmentMissing))?;
        cs.enforce_constraint(lc!() + a, lc!() + b, lc!() + c)?;
        Ok(())
    }
}

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

/// Fp2 → 64 bytes en orden `c1 ‖ c0` (convención EIP-197 / Soroban).
fn fq2_be(x: &Fq2) -> [u8; 64] {
    let mut out = [0u8; 64];
    out[..32].copy_from_slice(&fq_be(&x.c1));
    out[32..].copy_from_slice(&fq_be(&x.c0));
    out
}

fn g2_bytes(env: &Env, p: &G2Affine) -> BytesN<128> {
    let mut out = [0u8; 128];
    out[..64].copy_from_slice(&fq2_be(&p.x));
    out[64..].copy_from_slice(&fq2_be(&p.y));
    BytesN::from_array(env, &out)
}

#[test]
fn groth16_verifies_real_proof() {
    let env = Env::default();
    let id = env.register(Verifier, ());
    let client = VerifierClient::new(&env, &id);

    // 1. Setup + prueba reales con arkworks (a=3, b=5, c=15).
    let mut rng = StdRng::seed_from_u64(12345);
    let circuit = MulCircuit {
        a: Some(Fr::from(3u64)),
        b: Some(Fr::from(5u64)),
        c: Some(Fr::from(15u64)),
    };
    let (pk, vk) = Groth16::<Bn254>::circuit_specific_setup(circuit.clone(), &mut rng).unwrap();
    let proof = Groth16::<Bn254>::prove(&pk, circuit, &mut rng).unwrap();

    // 2. Serializa VK al formato Soroban.
    let mut ic: SVec<BytesN<64>> = SVec::new(&env);
    for p in vk.gamma_abc_g1.iter() {
        ic.push_back(g1_bytes(&env, p));
    }
    let vk_s = Groth16Vk {
        alpha: g1_bytes(&env, &vk.alpha_g1),
        beta: g2_bytes(&env, &vk.beta_g2),
        gamma: g2_bytes(&env, &vk.gamma_g2),
        delta: g2_bytes(&env, &vk.delta_g2),
        ic,
    };
    let proof_s = Groth16Proof {
        a: g1_bytes(&env, &proof.a),
        b: g2_bytes(&env, &proof.b),
        c: g1_bytes(&env, &proof.c),
    };

    // 3. Entrada pública correcta (c = 15) → verifica.
    let mut inputs: SVec<BytesN<32>> = SVec::new(&env);
    inputs.push_back(BytesN::from_array(&env, &fr_be(&Fr::from(15u64))));
    assert!(client.verify_groth16(&vk_s, &proof_s, &inputs));

    // 4. Entrada pública falsa (c = 16) → NO verifica.
    let mut bad: SVec<BytesN<32>> = SVec::new(&env);
    bad.push_back(BytesN::from_array(&env, &fr_be(&Fr::from(16u64))));
    assert!(!client.verify_groth16(&vk_s, &proof_s, &bad));
}

#[test]
fn commitment_roundtrip() {
    use soroban_sdk::testutils::BytesN as _;
    let env = Env::default();
    let id = env.register(Verifier, ());
    let client = VerifierClient::new(&env, &id);

    let salt = BytesN::random(&env);
    let commitment = client.commit(&15_000_000, &salt);
    assert!(client.verify_commitment(&15_000_000, &salt, &commitment));
    assert!(!client.verify_commitment(&14_000_000, &salt, &commitment));
}
