#![no_std]
//! IDIO — Institutional Decentralized Issuance & Offerings
//!
//! Conjunto de contratos Soroban que implementan subastas privadas
//! tipo *sealed-bid* sobre Stellar:
//!
//! - [`auction`]  — lógica de subastas (crear, ofertar sellado, revelar, liquidar)
//! - [`token`]    — token confidencial (balances ocultos, direcciones visibles)
//! - [`asp`]      — Association Set Provider (allow/deny lists, compliance)
//! - [`verifier`] — verificación de pruebas ZK y compromisos Poseidon2

pub mod asp;
pub mod auction;
pub mod token;
pub mod verifier;
