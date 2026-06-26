#![no_std]
//! Association Set Provider (ASP).
//!
//! Mantiene la lista de participantes autorizados (allow-list) para
//! compliance FATF/OFAC. Un administrador (regulador) agrega o quita
//! direcciones. Las subastas consultan `is_allowed` antes de aceptar
//! una oferta.
//!
//! En producción la pertenencia se prueba con un Merkle root y una prueba
//! de inclusión (privacidad del set). Aquí mantenemos el set explícito
//! para el MVP y exponemos `root()` como puente hacia esa evolución.

use idio_verifier::{Groth16Proof, Groth16Vk};
use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, Address, BytesN, Env, Vec,
};

/// Interfaz del verificador Groth16 (cross-contract).
#[contractclient(name = "VerifierClient")]
pub trait VerifierInterface {
    fn verify_groth16(
        env: Env,
        vk: Groth16Vk,
        proof: Groth16Proof,
        public_inputs: Vec<BytesN<32>>,
    ) -> bool;
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum AspError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    InvalidMembershipProof = 4,
    NullifierUsed = 5,
    MembershipNotConfigured = 6,
}

#[contracttype]
enum DataKey {
    Admin,
    Allowed(Address),
    Members,
    /// Raíz Merkle de la allow-list privada (Covenant).
    MembershipRoot,
    /// Verifying key del circuito de pertenencia.
    MembershipVk,
    /// Contrato verificador Groth16.
    Verifier,
    /// Nullifiers ya usados (anti-reuso).
    Nullifier(BytesN<32>),
}

#[contract]
pub struct Asp;

#[contractimpl]
impl Asp {
    /// Inicializa el contrato fijando al administrador (regulador).
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with(&env, AspError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::Members, &Vec::<Address>::new(&env));
    }

    /// Agrega una dirección a la allow-list. Solo el admin.
    pub fn allow(env: Env, who: Address) {
        Self::require_admin(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Allowed(who.clone()), &true);
        let mut members: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Members)
            .unwrap_or(Vec::new(&env));
        if !members.contains(&who) {
            members.push_back(who);
            env.storage().instance().set(&DataKey::Members, &members);
        }
    }

    /// Revoca una dirección de la allow-list. Solo el admin.
    pub fn revoke(env: Env, who: Address) {
        Self::require_admin(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Allowed(who.clone()), &false);
    }

    /// Indica si una dirección está autorizada a participar.
    pub fn is_allowed(env: Env, who: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Allowed(who))
            .unwrap_or(false)
    }

    /// Lista de miembros registrados (para dashboards de compliance).
    pub fn members(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::Members)
            .unwrap_or(Vec::new(&env))
    }

    /// Configura la allow-list privada (Covenant): raíz Merkle, verifying key
    /// del circuito de pertenencia y contrato verificador. Solo el admin.
    pub fn set_membership(env: Env, root: BytesN<32>, vk: Groth16Vk, verifier: Address) {
        Self::require_admin(&env);
        env.storage().instance().set(&DataKey::MembershipRoot, &root);
        env.storage().instance().set(&DataKey::MembershipVk, &vk);
        env.storage().instance().set(&DataKey::Verifier, &verifier);
    }

    /// Raíz Merkle publicada de la allow-list privada.
    pub fn membership_root(env: Env) -> Option<BytesN<32>> {
        env.storage().instance().get(&DataKey::MembershipRoot)
    }

    /// ¿Ya se usó este nullifier?
    pub fn is_nullifier_used(env: Env, nullifier: BytesN<32>) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Nullifier(nullifier))
            .unwrap_or(false)
    }

    /// Verifica una **prueba ZK de pertenencia** a la allow-list privada
    /// (Covenant): el participante prueba que está en el árbol con la raíz
    /// publicada, sin revelar cuál es, y consume un nullifier de un solo uso.
    ///
    /// Entradas públicas del circuito: `[root, nullifier]`. Devuelve `true` si
    /// la prueba es válida y el nullifier no se había usado (entonces lo marca).
    pub fn verify_membership(env: Env, proof: Groth16Proof, nullifier: BytesN<32>) -> bool {
        let root: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::MembershipRoot)
            .unwrap_or_else(|| panic_with(&env, AspError::MembershipNotConfigured));
        let vk: Groth16Vk = env.storage().instance().get(&DataKey::MembershipVk).unwrap();
        let verifier_id: Address = env.storage().instance().get(&DataKey::Verifier).unwrap();

        if Self::is_nullifier_used(env.clone(), nullifier.clone()) {
            panic_with(&env, AspError::NullifierUsed);
        }

        let mut inputs: Vec<BytesN<32>> = Vec::new(&env);
        inputs.push_back(root);
        inputs.push_back(nullifier.clone());

        let verifier = VerifierClient::new(&env, &verifier_id);
        if !verifier.verify_groth16(&vk, &proof, &inputs) {
            panic_with(&env, AspError::InvalidMembershipProof);
        }

        env.storage()
            .persistent()
            .set(&DataKey::Nullifier(nullifier), &true);
        true
    }

    fn require_admin(env: &Env) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with(env, AspError::NotInitialized));
        admin.require_auth();
    }
}

fn panic_with(env: &Env, err: AspError) -> ! {
    soroban_sdk::panic_with_error!(env, err)
}

#[cfg(test)]
mod test {
    use super::*;
    use ark_bn254::Bn254;
    use ark_groth16::{Proof, VerifyingKey};
    use idio_prover::{
        fr_be, membership::{prove_membership, setup_membership}, proof_bytes, vk_bytes,
    };
    use idio_verifier::Verifier;
    use soroban_sdk::testutils::Address as _;

    fn to_vk(env: &Env, vk: &VerifyingKey<Bn254>) -> Groth16Vk {
        let (a, b, g, d, ic_arr) = vk_bytes(vk);
        let mut ic: Vec<BytesN<64>> = Vec::new(env);
        for p in ic_arr.iter() {
            ic.push_back(BytesN::from_array(env, p));
        }
        Groth16Vk {
            alpha: BytesN::from_array(env, &a),
            beta: BytesN::from_array(env, &b),
            gamma: BytesN::from_array(env, &g),
            delta: BytesN::from_array(env, &d),
            ic,
        }
    }
    fn to_proof(env: &Env, p: &Proof<Bn254>) -> Groth16Proof {
        let (a, b, c) = proof_bytes(p);
        Groth16Proof {
            a: BytesN::from_array(env, &a),
            b: BytesN::from_array(env, &b),
            c: BytesN::from_array(env, &c),
        }
    }

    #[test]
    fn allow_and_check() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register(Asp, ());
        let client = AspClient::new(&env, &id);

        let admin = Address::generate(&env);
        let bank = Address::generate(&env);
        client.initialize(&admin);

        assert!(!client.is_allowed(&bank));
        client.allow(&bank);
        assert!(client.is_allowed(&bank));
        client.revoke(&bank);
        assert!(!client.is_allowed(&bank));
    }

    #[test]
    fn membership_proof_verifies_and_nullifier_is_single_use() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);

        let verifier_id = env.register(Verifier, ());
        let asp_id = env.register(Asp, ());
        let asp = AspClient::new(&env, &asp_id);
        asp.initialize(&admin);

        // Covenant: setup del circuito + árbol de miembros.
        let (pk, vk) = setup_membership();
        let secrets = [ark_bn254::Fr::from(1u64), ark_bn254::Fr::from(2u64), ark_bn254::Fr::from(3u64), ark_bn254::Fr::from(4u64)];
        let (proof, root, null) = prove_membership(&pk, &secrets, 1, 7);

        asp.set_membership(
            &BytesN::from_array(&env, &fr_be(&root)),
            &to_vk(&env, &vk),
            &verifier_id,
        );

        let null_bytes = BytesN::from_array(&env, &fr_be(&null));
        // Primera vez: válido.
        assert!(asp.verify_membership(&to_proof(&env, &proof), &null_bytes));
        assert!(asp.is_nullifier_used(&null_bytes));
    }

    #[test]
    #[should_panic]
    fn membership_nullifier_cannot_be_reused() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let verifier_id = env.register(Verifier, ());
        let asp_id = env.register(Asp, ());
        let asp = AspClient::new(&env, &asp_id);
        asp.initialize(&admin);

        let (pk, vk) = setup_membership();
        let secrets = [ark_bn254::Fr::from(1u64), ark_bn254::Fr::from(2u64), ark_bn254::Fr::from(3u64), ark_bn254::Fr::from(4u64)];
        let (proof, root, null) = prove_membership(&pk, &secrets, 1, 7);
        asp.set_membership(&BytesN::from_array(&env, &fr_be(&root)), &to_vk(&env, &vk), &verifier_id);

        let null_bytes = BytesN::from_array(&env, &fr_be(&null));
        let p = to_proof(&env, &proof);
        asp.verify_membership(&p, &null_bytes);
        // Reuso del mismo nullifier -> panic.
        asp.verify_membership(&p, &null_bytes);
    }
}
