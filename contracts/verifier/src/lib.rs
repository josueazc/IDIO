#![no_std]
//! Verificación de pruebas ZK y compromisos.
//!
//! En una integración completa, este contrato verifica una prueba Noir
//! (sistema Barretenberg / UltraHonk) sobre la curva BN254 usando los
//! host functions de cripto de Stellar (Protocol 26). Para el MVP de la
//! hackathon, exponemos:
//!
//! - `verify_commitment`: re-cálculo del compromiso Poseidon2 de una oferta
//!   sellada a partir de `(monto, salt)` y comparación con el hash publicado.
//! - `verify_proof`: punto de extensión donde se enchufa el verificador on-chain
//!   de la prueba (gating de fondos / credencial). Devuelve `true` cuando el
//!   `proof` no está vacío y su longitud es coherente.
//!
//! La separación permite que `auction.rs` dependa de una interfaz estable
//! mientras el verificador real evoluciona.

use soroban_sdk::{contract, contractimpl, Bytes, BytesN, Env};

#[contract]
pub struct Verifier;

#[contractimpl]
impl Verifier {
    /// Recalcula el compromiso de una oferta sellada y lo compara con
    /// `commitment`. El compromiso se define como `H(monto || salt)`.
    ///
    /// Usamos SHA-256 (disponible como host function nativo) como
    /// instanciación de la función hash en el MVP. En producción se
    /// sustituye por Poseidon2 para que coincida con el circuito Noir.
    pub fn verify_commitment(
        env: Env,
        amount: i128,
        salt: BytesN<32>,
        commitment: BytesN<32>,
    ) -> bool {
        let computed = Self::commit(env, amount, salt);
        computed == commitment
    }

    /// Construye el compromiso `H(monto || salt)`.
    pub fn commit(env: Env, amount: i128, salt: BytesN<32>) -> BytesN<32> {
        let mut preimage = Bytes::new(&env);
        preimage.extend_from_array(&amount.to_be_bytes());
        preimage.append(&Bytes::from(salt));
        env.crypto().sha256(&preimage).into()
    }

    /// Punto de extensión para la verificación de la prueba ZK de gating
    /// (fondos suficientes / credencial válida). En el MVP validamos que
    /// la prueba tenga forma; el verificador real BN254 se conecta aquí.
    pub fn verify_proof(_env: Env, proof: Bytes) -> bool {
        proof.len() > 0
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::BytesN as _;

    #[test]
    fn commitment_roundtrip() {
        let env = Env::default();
        let id = env.register(Verifier, ());
        let client = VerifierClient::new(&env, &id);

        let salt = BytesN::random(&env);
        let commitment = client.commit(&15_000_000, &salt);

        assert!(client.verify_commitment(&15_000_000, &salt, &commitment));
        assert!(!client.verify_commitment(&14_000_000, &salt, &commitment));
    }
}
