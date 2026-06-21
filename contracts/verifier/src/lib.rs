#![no_std]
//! Verificación de pruebas ZK y compromisos.
//!
//! Este contrato expone:
//!
//! - `verify_groth16`: **verificación Groth16 real sobre BN254** usando las
//!   host functions nativas de Stellar (Protocol 26): `g1_mul`, `g1_add` y
//!   `pairing_check`. Comprueba la ecuación de Groth16
//!   `e(A,B) = e(α,β)·e(L,γ)·e(C,δ)` reescrita como un único `pairing_check`.
//! - `verify_commitment` / `commit`: binding del compromiso `SHA-256(monto‖salt)`
//!   usado por la fase de reveal de la subasta.
//!
//! La verificación Groth16 es genérica: recibe la verifying key, la prueba y
//! las entradas públicas, por lo que sirve para cualquier circuito (p. ej. el
//! predicado de elegibilidad de un bidder) compilado a Groth16/BN254.

use soroban_sdk::{
    contract, contractimpl, contracttype,
    crypto::bn254::{Bn254Fr, Bn254G1Affine, Bn254G2Affine},
    Bytes, BytesN, Env, Vec,
};

/// Verifying key de Groth16 sobre BN254.
/// Codificación: G1 = 64 bytes `X‖Y` (big-endian); G2 = 128 bytes
/// `c1‖c0` por coordenada; ambos como en EIP-197 / la API de Soroban.
#[contracttype]
#[derive(Clone)]
pub struct Groth16Vk {
    pub alpha: BytesN<64>,
    pub beta: BytesN<128>,
    pub gamma: BytesN<128>,
    pub delta: BytesN<128>,
    /// `IC` (gamma_abc_g1): IC[0] + Σ inputs[i]·IC[i+1].
    pub ic: Vec<BytesN<64>>,
}

/// Prueba Groth16: A ∈ G1, B ∈ G2, C ∈ G1.
#[contracttype]
#[derive(Clone)]
pub struct Groth16Proof {
    pub a: BytesN<64>,
    pub b: BytesN<128>,
    pub c: BytesN<64>,
}

#[contract]
pub struct Verifier;

#[contractimpl]
impl Verifier {
    /// Verifica una prueba Groth16 sobre BN254 con las entradas públicas dadas.
    ///
    /// Calcula `L = IC[0] + Σ inputs[i]·IC[i+1]` y evalúa
    /// `e(A,B)·e(-α,β)·e(-L,γ)·e(-C,δ) == 1` mediante `pairing_check`.
    pub fn verify_groth16(
        env: Env,
        vk: Groth16Vk,
        proof: Groth16Proof,
        public_inputs: Vec<BytesN<32>>,
    ) -> bool {
        let bn = env.crypto().bn254();

        // L = IC[0] + Σ inputs[i]·IC[i+1]
        let mut acc = Bn254G1Affine::from_bytes(vk.ic.get(0).unwrap());
        for i in 0..public_inputs.len() {
            let ic_i = Bn254G1Affine::from_bytes(vk.ic.get(i + 1).unwrap());
            let scalar = Bn254Fr::from_bytes(public_inputs.get(i).unwrap());
            let term = bn.g1_mul(&ic_i, &scalar);
            acc = bn.g1_add(&acc, &term);
        }

        let a = Bn254G1Affine::from_bytes(proof.a);
        let b = Bn254G2Affine::from_bytes(proof.b);
        let c = Bn254G1Affine::from_bytes(proof.c);
        let alpha = Bn254G1Affine::from_bytes(vk.alpha);
        let beta = Bn254G2Affine::from_bytes(vk.beta);
        let gamma = Bn254G2Affine::from_bytes(vk.gamma);
        let delta = Bn254G2Affine::from_bytes(vk.delta);

        // e(A,B)·e(-α,β)·e(-L,γ)·e(-C,δ) == 1
        let mut vp1: Vec<Bn254G1Affine> = Vec::new(&env);
        vp1.push_back(a);
        vp1.push_back(-&alpha);
        vp1.push_back(-&acc);
        vp1.push_back(-&c);

        let mut vp2: Vec<Bn254G2Affine> = Vec::new(&env);
        vp2.push_back(b);
        vp2.push_back(beta);
        vp2.push_back(gamma);
        vp2.push_back(delta);

        bn.pairing_check(vp1, vp2)
    }

    /// Recalcula el compromiso de una oferta sellada y lo compara con
    /// `commitment`. El compromiso se define como `SHA-256(monto ‖ salt)`.
    pub fn verify_commitment(
        env: Env,
        amount: i128,
        salt: BytesN<32>,
        commitment: BytesN<32>,
    ) -> bool {
        let computed = Self::commit(env, amount, salt);
        computed == commitment
    }

    /// Construye el compromiso `SHA-256(monto ‖ salt)`.
    pub fn commit(env: Env, amount: i128, salt: BytesN<32>) -> BytesN<32> {
        let mut preimage = Bytes::new(&env);
        preimage.extend_from_array(&amount.to_be_bytes());
        preimage.append(&Bytes::from(salt));
        env.crypto().sha256(&preimage).into()
    }
}

#[cfg(test)]
mod test;
