#![no_std]
//! Token confidencial con compromisos Pedersen sobre BN254.
//!
//! El balance de cada cuenta se guarda como un **compromiso Pedersen**
//! `C = v·G + r·H`, donde `v` es el valor, `r` el cegado (blinding) y `G`, `H`
//! son dos generadores independientes de G1. El compromiso es:
//!
//! - **Ocultante (hiding):** `C` no revela `v` (perfecto, por el cegado).
//! - **Vinculante (binding):** no se puede abrir `C` a otro `v` (discreto).
//! - **Homomórfico:** `C1 + C2 = (v1+v2)·G + (r1+r2)·H`.
//!
//! Por eso una transferencia es simplemente aritmética de puntos: el emisor
//! resta el compromiso de la cantidad a su balance y el receptor lo suma. El
//! **monto nunca se almacena en claro** ni aparece en el estado on-chain;
//! en una transferencia ni siquiera viaja en los argumentos (se pasa el
//! punto de compromiso de la cantidad).
//!
//! `G` es el generador estándar de BN254 G1 `(1, 2)`. `H` se fija en
//! `initialize` y debe provenir de un procedimiento *nothing-up-my-sleeve*
//! (hash-to-curve) para que su logaritmo discreto respecto de `G` sea
//! desconocido.
//!
//! Nota: la prueba de solvencia (que un balance no se vuelve negativo) se
//! delega a una prueba de rango ZK (ver `idio-verifier`); aquí se modela la
//! capa de compromisos confidenciales.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype,
    crypto::bn254::{Bn254Fr, Bn254G1Affine},
    Address, BytesN, Env, U256,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum TokenError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
}

#[contracttype]
enum DataKey {
    Admin,
    /// Generador H (segundo punto base de Pedersen).
    GenH,
    /// Compromiso del balance de una cuenta: lo único público.
    Commitment(Address),
}

/// Generador estándar de BN254 G1: `(x=1, y=2)` en 64 bytes big-endian.
fn generator_g(env: &Env) -> Bn254G1Affine {
    let mut bytes = [0u8; 64];
    bytes[31] = 1;
    bytes[63] = 2;
    Bn254G1Affine::from_bytes(BytesN::from_array(env, &bytes))
}

/// Punto identidad (infinito): 64 bytes cero.
fn identity(env: &Env) -> Bn254G1Affine {
    Bn254G1Affine::from_bytes(BytesN::from_array(env, &[0u8; 64]))
}

#[contract]
pub struct ConfidentialToken;

#[contractimpl]
impl ConfidentialToken {
    /// Inicializa el token con el admin y el generador `H` de Pedersen.
    pub fn initialize(env: Env, admin: Address, gen_h: BytesN<64>) {
        if env.storage().instance().has(&DataKey::Admin) {
            soroban_sdk::panic_with_error!(&env, TokenError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::GenH, &gen_h);
    }

    /// Emite saldo a una cuenta (solo admin). Suma `amount·G + blinding·H`
    /// al compromiso del balance. El monto aparece en los argumentos de la
    /// emisión (acto del emisor), pero el estado solo guarda el compromiso.
    pub fn mint(env: Env, to: Address, amount: i128, blinding: BytesN<32>) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic(&env, TokenError::NotInitialized));
        admin.require_auth();

        let t = Self::commit_value_inner(&env, amount, blinding);
        let current = Self::get_commitment(&env, &to);
        let updated = env.crypto().bn254().g1_add(&current, &t);
        Self::set_commitment(&env, &to, &updated);
    }

    /// Transferencia confidencial. `value_commitment` = `amount·G + r·H` es
    /// el compromiso de la cantidad transferida (calculado por el emisor sin
    /// revelar `amount`). Se resta del balance de `from` y se suma al de `to`.
    /// El monto no aparece en ningún lado.
    pub fn transfer(env: Env, from: Address, to: Address, value_commitment: BytesN<64>) {
        from.require_auth();
        let bn = env.crypto().bn254();
        let t = Bn254G1Affine::from_bytes(value_commitment);

        let from_c = Self::get_commitment(&env, &from);
        let to_c = Self::get_commitment(&env, &to);

        let new_from = bn.g1_add(&from_c, &(-&t));
        let new_to = bn.g1_add(&to_c, &t);

        Self::set_commitment(&env, &from, &new_from);
        Self::set_commitment(&env, &to, &new_to);
    }

    /// Compromiso público del balance de una cuenta (64 bytes). Es lo único
    /// que un observador puede leer; no revela el monto.
    pub fn commitment(env: Env, who: Address) -> BytesN<64> {
        Self::get_commitment(&env, &who).to_bytes()
    }

    /// Verifica una apertura: ¿es `C_who == amount·G + blinding·H`?
    /// Permite a un titular o auditor (con la apertura) comprobar el balance.
    pub fn verify_opening(env: Env, who: Address, amount: i128, blinding: BytesN<32>) -> bool {
        let expected = Self::commit_value_inner(&env, amount, blinding);
        Self::get_commitment(&env, &who).to_bytes() == expected.to_bytes()
    }

    /// Construye el compromiso público de una cantidad: `amount·G + r·H`.
    /// Útil para que el emisor lo calcule antes de `transfer`.
    pub fn commit_value(env: Env, amount: i128, blinding: BytesN<32>) -> BytesN<64> {
        Self::commit_value_inner(&env, amount, blinding).to_bytes()
    }

    // ---- internos ----

    fn commit_value_inner(env: &Env, amount: i128, blinding: BytesN<32>) -> Bn254G1Affine {
        let bn = env.crypto().bn254();
        let g = generator_g(env);
        let h = Bn254G1Affine::from_bytes(
            env.storage()
                .instance()
                .get(&DataKey::GenH)
                .unwrap_or_else(|| panic(env, TokenError::NotInitialized)),
        );
        let v = Bn254Fr::from_u256(U256::from_u128(env, amount as u128));
        let r = Bn254Fr::from_bytes(blinding);
        let vg = bn.g1_mul(&g, &v);
        let rh = bn.g1_mul(&h, &r);
        bn.g1_add(&vg, &rh)
    }

    fn get_commitment(env: &Env, who: &Address) -> Bn254G1Affine {
        match env
            .storage()
            .persistent()
            .get::<_, BytesN<64>>(&DataKey::Commitment(who.clone()))
        {
            Some(b) => Bn254G1Affine::from_bytes(b),
            None => identity(env),
        }
    }

    fn set_commitment(env: &Env, who: &Address, c: &Bn254G1Affine) {
        env.storage()
            .persistent()
            .set(&DataKey::Commitment(who.clone()), &c.to_bytes());
    }
}

fn panic(env: &Env, err: TokenError) -> ! {
    soroban_sdk::panic_with_error!(env, err)
}

#[cfg(test)]
mod test;
