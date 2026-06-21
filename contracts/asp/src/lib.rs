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

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, Vec};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum AspError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
}

#[contracttype]
enum DataKey {
    Admin,
    Allowed(Address),
    Members,
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
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn allow_and_check() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, Asp);
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
}
