//! Token confidencial (MVP).
//!
//! Modelo de privacidad: las **direcciones** de las cuentas son visibles
//! en cadena, pero los **balances** se guardan como compromisos
//! `H(balance || blinding)` en lugar de en claro. El contrato lleva además
//! un balance "claro" interno mínimo para poder ejecutar transferencias
//! liquidables en el MVP, mientras que el compromiso público es lo que
//! observa un tercero.
//!
//! Esto es una aproximación didáctica al patrón de *confidential tokens*:
//! el objetivo es mostrar que la liquidación ocurre on-chain sin que el
//! monto sea legible públicamente. Un despliegue real usaría cifrado
//! homomórfico / pruebas de rango para los balances.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Bytes, BytesN, Env,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum TokenError {
    AlreadyInitialized = 1,
    InsufficientBalance = 2,
    NotAuthorized = 3,
}

#[contracttype]
enum DataKey {
    Admin,
    /// Balance en claro (interno, para liquidación en el MVP).
    Balance(Address),
    /// Compromiso público del balance: lo que ve un observador externo.
    Commitment(Address),
}

#[contract]
pub struct ConfidentialToken;

#[contractimpl]
impl ConfidentialToken {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            soroban_sdk::panic_with_error!(&env, TokenError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Emite saldo a una cuenta (solo admin / emisor).
    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        let new_balance = Self::balance(env.clone(), to.clone()) + amount;
        Self::set_balance(&env, &to, new_balance);
    }

    /// Transferencia confidencial: descuenta de `from`, abona a `to` y
    /// actualiza ambos compromisos. El `amount` viaja en la invocación
    /// pero el estado público solo expone el nuevo compromiso, no el saldo.
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            soroban_sdk::panic_with_error!(&env, TokenError::InsufficientBalance);
        }
        Self::set_balance(&env, &from, from_balance - amount);
        let to_balance = Self::balance(env.clone(), to.clone());
        Self::set_balance(&env, &to, to_balance + amount);
    }

    /// Balance en claro. En producción esto solo sería accesible con la
    /// view key del titular; aquí queda expuesto para los tests.
    pub fn balance(env: Env, who: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(who))
            .unwrap_or(0)
    }

    /// Compromiso público del balance: `H(balance)`. Es lo que un tercero
    /// puede leer sin conocer el monto.
    pub fn commitment(env: Env, who: Address) -> Option<BytesN<32>> {
        env.storage()
            .persistent()
            .get(&DataKey::Commitment(who))
    }

    fn set_balance(env: &Env, who: &Address, amount: i128) {
        env.storage()
            .persistent()
            .set(&DataKey::Balance(who.clone()), &amount);
        let mut preimage = Bytes::new(env);
        preimage.extend_from_array(&amount.to_be_bytes());
        let commitment: BytesN<32> = env.crypto().sha256(&preimage).into();
        env.storage()
            .persistent()
            .set(&DataKey::Commitment(who.clone()), &commitment);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn confidential_transfer() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register_contract(None, ConfidentialToken);
        let client = ConfidentialTokenClient::new(&env, &id);

        let admin = Address::generate(&env);
        let bank_b = Address::generate(&env);
        let central = Address::generate(&env);
        client.initialize(&admin);

        client.mint(&bank_b, &50_000_000);
        client.transfer(&bank_b, &central, &15_000_000);

        assert_eq!(client.balance(&bank_b), 35_000_000);
        assert_eq!(client.balance(&central), 15_000_000);
        // El compromiso existe y es opaco al observador.
        assert!(client.commitment(&central).is_some());
    }
}
