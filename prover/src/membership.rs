//! Covenant: prueba ZK de pertenencia a la allow-list (Merkle) + nullifier.
//!
//! El regulador construye un árbol de Merkle con los miembros aprobados. Cada
//! miembro tiene un `secret`; su hoja es `Poseidon(secret)`. El banco prueba
//! "pertenezco al árbol con raíz R" sin revelar **qué** hoja es, y publica un
//! `nullifier = Poseidon(secret, 1)` de un solo uso (anti-reuso/Sybil).
//!
//! Entradas públicas del circuito: `[root, nullifier]`. Privadas: `secret` y
//! el camino de Merkle. El contrato ASP guarda la raíz, registra los nullifiers
//! usados y verifica la prueba con `verify_groth16`.

use ark_bn254::{Bn254, Fr};
use ark_crypto_primitives::{
    crh::{poseidon, CRHScheme},
    merkle_tree::{constraints::ConfigGadget, Config, IdentityDigestConverter, MerkleTree, Path},
    sponge::poseidon::PoseidonConfig,
};
use ark_groth16::{Groth16, ProvingKey, VerifyingKey};
use ark_r1cs_std::{alloc::AllocVar, fields::fp::FpVar, prelude::EqGadget};
use ark_relations::r1cs::{ConstraintSynthesizer, ConstraintSystemRef, SynthesisError};
use ark_snark::SNARK;
use ark_std::rand::{rngs::StdRng, SeedableRng};

pub const TREE_DEPTH: usize = 8; // hasta 256 miembros

// --- Parámetros Poseidon (rate 2) deterministas sobre BN254 Fr ---

pub fn poseidon_config() -> PoseidonConfig<Fr> {
    let full_rounds = 8;
    let partial_rounds = 57;
    let alpha = 5u64;
    let rate = 2;
    let capacity = 1;
    let (ark, mds) = ark_crypto_primitives::sponge::poseidon::find_poseidon_ark_and_mds::<Fr>(
        254,
        rate,
        full_rounds,
        partial_rounds,
        0,
    );
    PoseidonConfig::new(full_rounds as usize, partial_rounds as usize, alpha, mds, ark, rate, capacity)
}

// --- Config del árbol de Merkle con Poseidon ---

#[derive(Clone)]
pub struct MerkleConfig;
impl Config for MerkleConfig {
    type Leaf = [Fr];
    type LeafDigest = Fr;
    type LeafInnerDigestConverter = IdentityDigestConverter<Fr>;
    type InnerDigest = Fr;
    type LeafHash = poseidon::CRH<Fr>;
    type TwoToOneHash = poseidon::TwoToOneCRH<Fr>;
}

pub struct MerkleConfigGadget;
impl ConfigGadget<MerkleConfig, Fr> for MerkleConfigGadget {
    type Leaf = [FpVar<Fr>];
    type LeafDigest = FpVar<Fr>;
    type LeafInnerConverter = IdentityDigestConverter<FpVar<Fr>>;
    type InnerDigest = FpVar<Fr>;
    type LeafHash = poseidon::constraints::CRHGadget<Fr>;
    type TwoToOneHash = poseidon::constraints::TwoToOneCRHGadget<Fr>;
}

/// Hoja de un miembro: `Poseidon(secret)`.
pub fn leaf_hash(cfg: &PoseidonConfig<Fr>, secret: Fr) -> Fr {
    poseidon::CRH::<Fr>::evaluate(cfg, [secret]).unwrap()
}

/// Nullifier de un miembro: `Poseidon(secret, 1)`.
pub fn nullifier(cfg: &PoseidonConfig<Fr>, secret: Fr) -> Fr {
    poseidon::CRH::<Fr>::evaluate(cfg, [secret, Fr::from(1u64)]).unwrap()
}

/// Construye el árbol con los secretos dados, relleno a `2^TREE_DEPTH` hojas
/// (profundidad fija para que el circuito sea idéntico en setup y prueba).
pub fn build_tree(secrets: &[Fr]) -> MerkleTree<MerkleConfig> {
    let cfg = poseidon_config();
    let size = 1usize << TREE_DEPTH;
    let mut leaf_inputs: ark_std::vec::Vec<[Fr; 1]> = secrets.iter().map(|s| [*s]).collect();
    // Relleno con hojas dummy (secret = 0) hasta completar el árbol.
    while leaf_inputs.len() < size {
        leaf_inputs.push([Fr::from(0u64)]);
    }
    leaf_inputs.truncate(size);
    MerkleTree::<MerkleConfig>::new(&cfg, &cfg, leaf_inputs).unwrap()
}

// --- Circuito ---

pub struct MembershipCircuit {
    pub cfg: PoseidonConfig<Fr>,
    // públicos
    pub root: Fr,
    pub nullifier: Fr,
    // privados
    pub secret: Fr,
    pub path: Path<MerkleConfig>,
}

impl ConstraintSynthesizer<Fr> for MembershipCircuit {
    fn generate_constraints(self, cs: ConstraintSystemRef<Fr>) -> Result<(), SynthesisError> {
        use ark_crypto_primitives::crh::constraints::{CRHSchemeGadget, TwoToOneCRHSchemeGadget};
        use ark_crypto_primitives::merkle_tree::constraints::PathVar;

        let cfg_leaf =
            <poseidon::constraints::CRHParametersVar<Fr>>::new_constant(cs.clone(), self.cfg.clone())?;
        let cfg_two = cfg_leaf.clone();

        // Públicos
        let root_var = FpVar::new_input(cs.clone(), || Ok(self.root))?;
        let nullifier_var = FpVar::new_input(cs.clone(), || Ok(self.nullifier))?;

        // Privados
        let secret_var = FpVar::new_witness(cs.clone(), || Ok(self.secret))?;
        let path_var =
            PathVar::<MerkleConfig, Fr, MerkleConfigGadget>::new_witness(cs.clone(), || Ok(self.path))?;

        // 1. nullifier == Poseidon(secret, 1)
        let one = FpVar::new_constant(cs.clone(), Fr::from(1u64))?;
        let computed_nullifier =
            <poseidon::constraints::CRHGadget<Fr> as CRHSchemeGadget<_, _>>::evaluate(
                &cfg_leaf,
                &[secret_var.clone(), one],
            )?;
        computed_nullifier.enforce_equal(&nullifier_var)?;

        // 2. pertenencia: la hoja Poseidon(secret) está en el árbol con raíz root
        let leaf = [secret_var];
        let is_member = path_var.verify_membership(&cfg_leaf, &cfg_two, &root_var, &leaf)?;
        is_member.enforce_equal(&ark_r1cs_std::prelude::Boolean::TRUE)?;

        Ok(())
    }
}

// --- Setup / prove ---

pub fn setup_membership() -> (ProvingKey<Bn254>, VerifyingKey<Bn254>) {
    let cfg = poseidon_config();
    // Circuito "molde" con un árbol dummy para fijar la estructura.
    let secrets = [Fr::from(1u64), Fr::from(2u64)];
    let tree = build_tree(&secrets);
    let path = tree.generate_proof(0).unwrap();
    let circuit = MembershipCircuit {
        cfg: cfg.clone(),
        root: tree.root(),
        nullifier: nullifier(&cfg, Fr::from(1u64)),
        secret: Fr::from(1u64),
        path,
    };
    let mut rng = StdRng::seed_from_u64(0xC0FFEE);
    Groth16::<Bn254>::circuit_specific_setup(circuit, &mut rng).unwrap()
}

pub fn prove_membership(
    pk: &ProvingKey<Bn254>,
    secrets: &[Fr],
    index: usize,
    seed: u64,
) -> (ark_groth16::Proof<Bn254>, Fr, Fr) {
    let cfg = poseidon_config();
    let tree = build_tree(secrets);
    let path = tree.generate_proof(index).unwrap();
    let root = tree.root();
    let null = nullifier(&cfg, secrets[index]);
    let circuit = MembershipCircuit {
        cfg,
        root,
        nullifier: null,
        secret: secrets[index],
        path,
    };
    let mut rng = StdRng::seed_from_u64(seed);
    let proof = Groth16::<Bn254>::prove(pk, circuit, &mut rng).unwrap();
    (proof, root, null)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn membership_proves_and_verifies() {
        let (pk, vk) = setup_membership();
        let secrets: ark_std::vec::Vec<Fr> = (1..=5u64).map(Fr::from).collect();
        let (proof, root, null) = prove_membership(&pk, &secrets, 2, 7);
        let pvk = Groth16::<Bn254>::process_vk(&vk).unwrap();
        assert!(Groth16::<Bn254>::verify_with_processed_vk(&pvk, &[root, null], &proof).unwrap());
        // Una raíz distinta no verifica.
        assert!(!Groth16::<Bn254>::verify_with_processed_vk(&pvk, &[Fr::from(99u64), null], &proof).unwrap());
    }
}
