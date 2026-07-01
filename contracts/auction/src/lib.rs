#![no_std]
//! Contrato principal de subastas *sealed-bid*.
//!
//! Ciclo de vida de una subasta:
//!
//! ```text
//! Setup ─create_auction─▶ BiddingOpen ─(plazo)─▶ reveal_and_settle ─▶ Settled
//! ```
//!
//! 1. **create_auction** — el emisor publica el activo, monto, mínimo y plazo,
//!    junto con un compromiso de reservas (proof-of-reserves).
//! 2. **submit_sealed_bid** — cada bidder envía un *compromiso* de su oferta
//!    `H(monto || salt)` más una prueba ZK de fondos. Nadie ve el monto.
//! 3. **reveal_bid** — tras el cierre, cada bidder revela `(monto, salt)`;
//!    el contrato verifica que coincide con su compromiso.
//! 4. **settle** — se determina el ganador (mayor oferta válida) y se marca
//!    la subasta como liquidada.
//!
//! La privacidad proviene de que durante `BiddingOpen` solo existen
//! compromisos en cadena; los montos se conocen únicamente en el reveal.

use idio_verifier::{Groth16Proof, Groth16Vk};
use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, Address, BytesN, Env,
    String, Vec,
};

/// Política mínima de liquidez (%) que el emisor debe probar en reservas.
const MIN_LIQUIDITY_PCT: i128 = 30;

/// Ventana de revelación tras el cierre de bidding, en segundos. Los bidders
/// disponen de este plazo para revelar `(monto, salt)`; pasado el plazo,
/// `reveal_bid` se rechaza (una oferta no revelada a tiempo no puede ganar).
const REVEAL_WINDOW_SECS: u64 = 86_400;

/// Versión del contrato (se incrementa en cada cambio de lógica/ABI).
const CONTRACT_VERSION: u32 = 2;

/// Interfaz del contrato ASP para la llamada cross-contract de gating.
/// Genera `AspClient`, usado por la subasta para validar participantes.
#[contractclient(name = "AspClient")]
pub trait AspInterface {
    fn is_allowed(env: Env, who: Address) -> bool;
}

/// Interfaz del token confidencial para la liquidación del pago.
/// Genera `TokenClient`, usado por la subasta en la fase de pago.
#[contractclient(name = "TokenClient")]
pub trait TokenInterface {
    fn transfer(env: Env, from: Address, to: Address, value_commitment: BytesN<64>);
}

/// Interfaz del verificador Groth16 para validar pruebas ZK on-chain.
/// Genera `VerifierClient`, usado por la subasta al ofertar y al crear.
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
pub enum AuctionError {
    NotInitialized = 1,
    AuctionNotFound = 2,
    NotInBiddingPhase = 3,
    BiddingClosed = 4,
    BiddingStillOpen = 5,
    BidBelowMinimum = 6,
    AlreadyRevealed = 7,
    CommitmentMismatch = 8,
    NotAllowed = 9,
    AlreadySettled = 10,
    BidNotFound = 11,
    NotWinner = 12,
    NotSettled = 13,
    AlreadyPaid = 14,
    InvalidEligibilityProof = 15,
    InvalidReservesProof = 16,
    InvalidApprovalProof = 17,
    ApprovalAlreadyCast = 18,
    NotEnoughApprovals = 19,
    ConsensusNotConfigured = 20,
    /// Se intentó operar sobre una subasta ya cancelada.
    AuctionCancelled = 21,
    /// El reveal llegó fuera de la ventana de revelación.
    RevealWindowClosed = 22,
    /// No se puede cancelar una subasta que ya recibió ofertas.
    AuctionHasBids = 23,
    /// El contrato está en pausa de emergencia.
    ContractPaused = 24,
    /// La dirección superó el límite de frecuencia (anti-spam).
    RateLimited = 25,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[contracttype]
pub enum AuctionStatus {
    BiddingOpen,
    BiddingClosed,
    Settled,
    Cancelled,
}

#[derive(Clone)]
#[contracttype]
pub struct SealedBid {
    pub bidder: Address,
    /// Compromiso `H(monto || salt)` de la oferta.
    pub commitment: BytesN<32>,
    /// Monto revelado tras el cierre (0 mientras está sellada).
    pub revealed_amount: i128,
    pub revealed: bool,
    pub timestamp: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct Auction {
    pub id: u64,
    pub issuer: Address,
    pub asset: String,
    pub amount: i128,
    pub min_bid: i128,
    pub status: AuctionStatus,
    /// Compromiso del proof-of-reserves del emisor.
    pub reserves_commitment: BytesN<32>,
    pub winner: Option<Address>,
    pub winning_amount: i128,
    pub end_time: u64,
    /// Límite para revelar ofertas (tras el cierre de bidding). Pasado este
    /// instante, `reveal_bid` se rechaza con `RevealWindowClosed`.
    pub reveal_deadline: u64,
    /// Si el ganador ya pagó confidencialmente al emisor (Paso 4-5).
    pub paid: bool,
}

#[contracttype]
enum DataKey {
    Admin,
    /// Contrato ASP usado para validar participantes.
    Asp,
    /// Token confidencial usado para liquidar el pago.
    Token,
    /// Verificador Groth16 BN254.
    Verifier,
    /// Verifying key del circuito de elegibilidad (oferta).
    EligVk,
    /// Verifying key del circuito de reservas (emisión).
    ReservesVk,
    Counter,
    Auction(u64),
    Bids(u64),
    /// BEShield: raíz Merkle del conjunto de validadores.
    ValidatorRoot,
    /// VK del circuito de pertenencia (validadores).
    ValidatorVk,
    /// Umbral de consenso (k de n). 0 = consenso desactivado.
    ConsensusThreshold,
    /// Nullifier de aprobación ya usado para una subasta.
    Approval(u64, BytesN<32>),
    /// Conteo de aprobaciones distintas por subasta.
    ApprovalCount(u64),
    /// Capacidad registrada (cupo máximo de oferta) de un banco.
    Capacity(Address),
    /// Pausa de emergencia (true = operaciones bloqueadas).
    Paused,
    /// Anti-spam: intervalo mínimo (segundos) entre acciones por dirección.
    RateLimitSecs,
    /// Anti-spam: timestamp de la última acción de una dirección.
    LastAction(Address),
}

#[contract]
pub struct AuctionContract;

#[contractimpl]
impl AuctionContract {
    /// Inicializa el contrato con el admin, el ASP de compliance, el token
    /// confidencial, el verificador Groth16 y las verifying keys de los
    /// circuitos de elegibilidad (oferta) y reservas (emisión).
    pub fn initialize(
        env: Env,
        admin: Address,
        asp: Address,
        token: Address,
        verifier: Address,
        elig_vk: Groth16Vk,
        reserves_vk: Groth16Vk,
    ) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Asp, &asp);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Verifier, &verifier);
        env.storage().instance().set(&DataKey::EligVk, &elig_vk);
        env.storage().instance().set(&DataKey::ReservesVk, &reserves_vk);
        env.storage().instance().set(&DataKey::Counter, &0u64);
    }

    /// Versión del contrato (para trazabilidad de upgrades).
    pub fn version(_env: Env) -> u32 {
        CONTRACT_VERSION
    }

    /// Pausa de emergencia (solo admin): bloquea create/bid/settle.
    pub fn pause(env: Env) {
        Self::admin(&env).require_auth();
        env.storage().instance().set(&DataKey::Paused, &true);
    }

    /// Reanuda las operaciones (solo admin).
    pub fn unpause(env: Env) {
        Self::admin(&env).require_auth();
        env.storage().instance().set(&DataKey::Paused, &false);
    }

    /// ¿El contrato está en pausa?
    pub fn is_paused(env: Env) -> bool {
        env.storage().instance().get(&DataKey::Paused).unwrap_or(false)
    }

    /// Anti-spam (solo admin): intervalo mínimo en segundos entre acciones de
    /// una misma dirección al crear subastas u ofertar. `0` desactiva el límite.
    pub fn set_rate_limit(env: Env, secs: u64) {
        Self::admin(&env).require_auth();
        env.storage().instance().set(&DataKey::RateLimitSecs, &secs);
    }

    /// Intervalo anti-spam configurado (0 = desactivado).
    pub fn get_rate_limit(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::RateLimitSecs).unwrap_or(0)
    }

    /// Crea una subasta. `duration` en segundos a partir de ahora.
    ///
    /// Exige una **prueba de reservas Groth16** (`total ≥ amount`) verificada
    /// on-chain: el emisor demuestra que respalda el activo sin revelar el total.
    pub fn create_auction(
        env: Env,
        issuer: Address,
        asset: String,
        amount: i128,
        min_bid: i128,
        duration: u64,
        reserves_commitment: BytesN<32>,
        reserves_proof: Groth16Proof,
    ) -> u64 {
        issuer.require_auth();
        Self::ensure_not_paused(&env);
        Self::enforce_rate_limit(&env, &issuer);

        // Verifica la prueba de reservas (Auspex+): entradas públicas =
        // [monto subastado, política mínima de liquidez %]. El emisor prueba
        // total ≥ monto y liquid/total ≥ pct sin revelar los números.
        let vk: Groth16Vk = env.storage().instance().get(&DataKey::ReservesVk).unwrap();
        let mut inputs: Vec<BytesN<32>> = Vec::new(&env);
        inputs.push_back(Self::i128_to_fr_bytes(&env, amount));
        inputs.push_back(Self::i128_to_fr_bytes(&env, MIN_LIQUIDITY_PCT));
        if !Self::verifier(&env).verify_groth16(&vk, &reserves_proof, &inputs) {
            panic(&env, AuctionError::InvalidReservesProof);
        }

        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::Counter)
            .unwrap_or(0)
            + 1;
        env.storage().instance().set(&DataKey::Counter, &id);

        let end_time = env.ledger().timestamp() + duration;
        let auction = Auction {
            id,
            issuer,
            asset,
            amount,
            min_bid,
            status: AuctionStatus::BiddingOpen,
            reserves_commitment,
            winner: None,
            winning_amount: 0,
            end_time,
            reveal_deadline: end_time + REVEAL_WINDOW_SECS,
            paid: false,
        };

        env.storage().persistent().set(&DataKey::Auction(id), &auction);
        env.storage()
            .persistent()
            .set(&DataKey::Bids(id), &Vec::<SealedBid>::new(&env));
        id
    }

    /// Envía una oferta sellada. Solo se guarda el compromiso; el monto
    /// permanece privado hasta el reveal. El bidder debe:
    ///   1. estar en la allow-list del ASP, y
    ///   2. presentar una **prueba de elegibilidad Groth16** (`balance ≥ oferta
    ///      ≥ mínimo`) que el contrato verifica on-chain, sin revelar el monto.
    pub fn submit_sealed_bid(
        env: Env,
        auction_id: u64,
        bidder: Address,
        commitment: BytesN<32>,
        eligibility_proof: Groth16Proof,
    ) {
        bidder.require_auth();
        Self::ensure_not_paused(&env);
        Self::enforce_rate_limit(&env, &bidder);
        Self::require_allowed(&env, &bidder);

        let mut auction = Self::get(&env, auction_id);
        if auction.status == AuctionStatus::Cancelled {
            panic(&env, AuctionError::AuctionCancelled);
        }
        if auction.status != AuctionStatus::BiddingOpen {
            panic(&env, AuctionError::NotInBiddingPhase);
        }
        if env.ledger().timestamp() > auction.end_time {
            panic(&env, AuctionError::BiddingClosed);
        }

        // Verifica la prueba de elegibilidad (binding anti-trampa): entradas
        // públicas = [mínimo de la subasta, capacidad registrada del banco].
        // La capacidad la provee el contrato desde su registro, así el banco no
        // puede ofertar por encima de su cupo ni declarar fondos falsos.
        let capacity = Self::capacity(&env, &bidder);
        let vk: Groth16Vk = env.storage().instance().get(&DataKey::EligVk).unwrap();
        let mut inputs: Vec<BytesN<32>> = Vec::new(&env);
        inputs.push_back(Self::i128_to_fr_bytes(&env, auction.min_bid));
        inputs.push_back(Self::i128_to_fr_bytes(&env, capacity));
        if !Self::verifier(&env).verify_groth16(&vk, &eligibility_proof, &inputs) {
            panic(&env, AuctionError::InvalidEligibilityProof);
        }

        let mut bids: Vec<SealedBid> = env
            .storage()
            .persistent()
            .get(&DataKey::Bids(auction_id))
            .unwrap();

        let new_bid = SealedBid {
            bidder: bidder.clone(),
            commitment,
            revealed_amount: 0,
            revealed: false,
            timestamp: env.ledger().timestamp(),
        };

        // Si el bidder ya tiene una oferta no revelada, la REEMPLAZA
        // (puede mejorar su oferta antes del cierre, sin ver las demás).
        let mut replaced = false;
        for i in 0..bids.len() {
            let existing = bids.get(i).unwrap();
            if existing.bidder == bidder && !existing.revealed {
                bids.set(i, new_bid.clone());
                replaced = true;
                break;
            }
        }
        if !replaced {
            bids.push_back(new_bid);
        }
        env.storage().persistent().set(&DataKey::Bids(auction_id), &bids);

        // Persistimos por si cambió el estado en el futuro.
        auction.status = AuctionStatus::BiddingOpen;
        env.storage()
            .persistent()
            .set(&DataKey::Auction(auction_id), &auction);
    }

    /// Revela una oferta tras el cierre. El contrato recalcula
    /// `H(monto || salt)` y exige que coincida con el compromiso.
    pub fn reveal_bid(
        env: Env,
        auction_id: u64,
        bidder: Address,
        amount: i128,
        salt: BytesN<32>,
    ) {
        bidder.require_auth();
        let mut auction = Self::get(&env, auction_id);

        if auction.status == AuctionStatus::Cancelled {
            panic(&env, AuctionError::AuctionCancelled);
        }
        if env.ledger().timestamp() <= auction.end_time {
            panic(&env, AuctionError::BiddingStillOpen);
        }
        if auction.status == AuctionStatus::Settled {
            panic(&env, AuctionError::AlreadySettled);
        }
        // Ventana de revelación: pasado el plazo ya no se acepta ningún reveal.
        if env.ledger().timestamp() > auction.reveal_deadline {
            panic(&env, AuctionError::RevealWindowClosed);
        }
        auction.status = AuctionStatus::BiddingClosed;
        env.storage()
            .persistent()
            .set(&DataKey::Auction(auction_id), &auction);

        if amount < Self::get(&env, auction_id).min_bid {
            panic(&env, AuctionError::BidBelowMinimum);
        }

        let expected = Self::commitment_of(&env, amount, salt);

        let mut bids: Vec<SealedBid> = env
            .storage()
            .persistent()
            .get(&DataKey::Bids(auction_id))
            .unwrap();

        let mut found = false;
        for i in 0..bids.len() {
            let mut bid = bids.get(i).unwrap();
            if bid.bidder == bidder && !bid.revealed {
                if bid.commitment != expected {
                    panic(&env, AuctionError::CommitmentMismatch);
                }
                bid.revealed = true;
                bid.revealed_amount = amount;
                bids.set(i, bid);
                found = true;
                break;
            }
        }
        if !found {
            panic(&env, AuctionError::BidNotFound);
        }
        env.storage().persistent().set(&DataKey::Bids(auction_id), &bids);
    }

    /// BEShield: configura el consenso de liquidación — raíz Merkle del set de
    /// validadores, VK de pertenencia y umbral `k`. Solo el admin. `threshold=0`
    /// desactiva el consenso (la liquidación no requiere aprobaciones).
    pub fn set_consensus(env: Env, root: BytesN<32>, vk: Groth16Vk, threshold: u32) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::ValidatorRoot, &root);
        env.storage().instance().set(&DataKey::ValidatorVk, &vk);
        env.storage().instance().set(&DataKey::ConsensusThreshold, &threshold);
    }

    /// BEShield: un validador aprueba la liquidación de una subasta probando
    /// (en ZK) que pertenece al set de validadores, sin revelar cuál es. El
    /// nullifier (único por validador) cuenta como un voto y no se puede repetir.
    /// Reúne `k` votos distintos para habilitar `settle`.
    pub fn approve_settlement(
        env: Env,
        auction_id: u64,
        proof: Groth16Proof,
        nullifier: BytesN<32>,
    ) {
        let root: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::ValidatorRoot)
            .unwrap_or_else(|| panic(&env, AuctionError::ConsensusNotConfigured));
        let vk: Groth16Vk = env.storage().instance().get(&DataKey::ValidatorVk).unwrap();

        if env
            .storage()
            .persistent()
            .get::<_, bool>(&DataKey::Approval(auction_id, nullifier.clone()))
            .unwrap_or(false)
        {
            panic(&env, AuctionError::ApprovalAlreadyCast);
        }

        let mut inputs: Vec<BytesN<32>> = Vec::new(&env);
        inputs.push_back(root);
        inputs.push_back(nullifier.clone());
        if !Self::verifier(&env).verify_groth16(&vk, &proof, &inputs) {
            panic(&env, AuctionError::InvalidApprovalProof);
        }

        env.storage()
            .persistent()
            .set(&DataKey::Approval(auction_id, nullifier), &true);
        let count: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::ApprovalCount(auction_id))
            .unwrap_or(0)
            + 1;
        env.storage()
            .persistent()
            .set(&DataKey::ApprovalCount(auction_id), &count);
    }

    /// Aprobaciones de consenso reunidas para una subasta.
    pub fn approvals(env: Env, auction_id: u64) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::ApprovalCount(auction_id))
            .unwrap_or(0)
    }

    /// Liquida la subasta: recorre las ofertas reveladas y elige la mayor.
    /// Si hay consenso configurado (umbral > 0), exige `k` aprobaciones de
    /// validadores antes de liquidar (BEShield).
    pub fn settle(env: Env, auction_id: u64) -> Option<Address> {
        Self::ensure_not_paused(&env);
        let mut auction = Self::get(&env, auction_id);
        if auction.status == AuctionStatus::Cancelled {
            panic(&env, AuctionError::AuctionCancelled);
        }
        if auction.status == AuctionStatus::Settled {
            panic(&env, AuctionError::AlreadySettled);
        }
        if env.ledger().timestamp() <= auction.end_time {
            panic(&env, AuctionError::BiddingStillOpen);
        }

        let threshold: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ConsensusThreshold)
            .unwrap_or(0);
        if threshold > 0 && Self::approvals(env.clone(), auction_id) < threshold {
            panic(&env, AuctionError::NotEnoughApprovals);
        }

        let bids: Vec<SealedBid> = env
            .storage()
            .persistent()
            .get(&DataKey::Bids(auction_id))
            .unwrap();

        // Selección del ganador: mayor monto revelado. Criterio de desempate
        // determinista: ante montos iguales gana la oferta con menor timestamp
        // (la primera en llegar).
        let mut best_amount: i128 = 0;
        let mut best_ts: u64 = 0;
        let mut winner: Option<Address> = None;
        for bid in bids.iter() {
            if !bid.revealed {
                continue;
            }
            let is_better = match winner {
                None => true,
                Some(_) => {
                    bid.revealed_amount > best_amount
                        || (bid.revealed_amount == best_amount && bid.timestamp < best_ts)
                }
            };
            if is_better {
                best_amount = bid.revealed_amount;
                best_ts = bid.timestamp;
                winner = Some(bid.bidder.clone());
            }
        }

        auction.status = AuctionStatus::Settled;
        auction.winner = winner.clone();
        auction.winning_amount = best_amount;
        env.storage()
            .persistent()
            .set(&DataKey::Auction(auction_id), &auction);
        winner
    }

    /// Pago confidencial y liquidación (Pasos 4-5).
    ///
    /// El ganador paga al emisor mediante el token confidencial: la subasta
    /// invoca `token.transfer(ganador, emisor, value_commitment)` como llamada
    /// cross-contract. `value_commitment` es el compromiso Pedersen del monto
    /// ganador, por lo que la cantidad transferida permanece oculta on-chain.
    pub fn settle_payment(env: Env, auction_id: u64, value_commitment: BytesN<64>) {
        let mut auction = Self::get(&env, auction_id);
        if auction.status != AuctionStatus::Settled {
            panic(&env, AuctionError::NotSettled);
        }
        if auction.paid {
            panic(&env, AuctionError::AlreadyPaid);
        }
        let winner = match &auction.winner {
            Some(w) => w.clone(),
            None => panic(&env, AuctionError::NotWinner),
        };
        winner.require_auth();

        // Transferencia confidencial ganador -> emisor vía el token.
        let token_id: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .unwrap_or_else(|| panic(&env, AuctionError::NotInitialized));
        let token = TokenClient::new(&env, &token_id);
        token.transfer(&winner, &auction.issuer, &value_commitment);

        auction.paid = true;
        env.storage()
            .persistent()
            .set(&DataKey::Auction(auction_id), &auction);
    }

    /// Cancela una subasta (solo el emisor). Solo puede cancelarse mientras
    /// está en fase de bidding y **antes de recibir ofertas**: una vez que hay
    /// compromisos en cadena, el emisor ya no puede retirar la subasta.
    pub fn cancel_auction(env: Env, auction_id: u64) {
        let mut auction = Self::get(&env, auction_id);
        auction.issuer.require_auth();
        if auction.status == AuctionStatus::Settled {
            panic(&env, AuctionError::AlreadySettled);
        }
        if auction.status == AuctionStatus::Cancelled {
            panic(&env, AuctionError::AuctionCancelled);
        }
        if auction.status != AuctionStatus::BiddingOpen {
            panic(&env, AuctionError::NotInBiddingPhase);
        }
        let bids: Vec<SealedBid> = env
            .storage()
            .persistent()
            .get(&DataKey::Bids(auction_id))
            .unwrap_or(Vec::new(&env));
        if !bids.is_empty() {
            panic(&env, AuctionError::AuctionHasBids);
        }
        auction.status = AuctionStatus::Cancelled;
        env.storage()
            .persistent()
            .set(&DataKey::Auction(auction_id), &auction);
    }

    // ---- Lecturas ----

    pub fn get_auction(env: Env, auction_id: u64) -> Auction {
        Self::get(&env, auction_id)
    }

    pub fn get_bids(env: Env, auction_id: u64) -> Vec<SealedBid> {
        env.storage()
            .persistent()
            .get(&DataKey::Bids(auction_id))
            .unwrap_or(Vec::new(&env))
    }

    pub fn total_auctions(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::Counter).unwrap_or(0)
    }

    // ---- Helpers internos ----

    fn get(env: &Env, auction_id: u64) -> Auction {
        env.storage()
            .persistent()
            .get(&DataKey::Auction(auction_id))
            .unwrap_or_else(|| panic(env, AuctionError::AuctionNotFound))
    }

    /// Recalcula el compromiso `H(monto || salt)` con SHA-256.
    /// Debe coincidir con la lógica del frontend y del circuito Noir.
    fn commitment_of(env: &Env, amount: i128, salt: BytesN<32>) -> BytesN<32> {
        let mut preimage = soroban_sdk::Bytes::new(env);
        preimage.extend_from_array(&amount.to_be_bytes());
        preimage.append(&soroban_sdk::Bytes::from(salt));
        env.crypto().sha256(&preimage).into()
    }

    /// Gating de compliance: consulta el contrato ASP vía cross-contract call
    /// y exige que el participante esté en la allow-list. Aborta con
    /// `NotAllowed` si no lo está.
    /// Registra la capacidad (cupo máximo de oferta) de un banco. Solo admin.
    pub fn set_capacity(env: Env, who: Address, capacity: i128) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Capacity(who), &capacity);
    }

    /// Capacidad registrada de un banco (0 si no tiene cupo asignado).
    pub fn get_capacity(env: Env, who: Address) -> i128 {
        Self::capacity(&env, &who)
    }

    /// Dirección del admin registrada en `initialize`.
    fn admin(env: &Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic(env, AuctionError::NotInitialized))
    }

    /// Aborta si el contrato está en pausa de emergencia.
    fn ensure_not_paused(env: &Env) {
        if env.storage().instance().get(&DataKey::Paused).unwrap_or(false) {
            panic(env, AuctionError::ContractPaused);
        }
    }

    /// Anti-spam: exige que haya pasado al menos `RateLimitSecs` desde la última
    /// acción de esta dirección. Registra el instante actual. `0` = desactivado.
    fn enforce_rate_limit(env: &Env, who: &Address) {
        let secs: u64 = env
            .storage()
            .instance()
            .get(&DataKey::RateLimitSecs)
            .unwrap_or(0);
        if secs == 0 {
            return;
        }
        let now = env.ledger().timestamp();
        let last: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::LastAction(who.clone()))
            .unwrap_or(0);
        if last != 0 && now < last + secs {
            panic(env, AuctionError::RateLimited);
        }
        env.storage()
            .persistent()
            .set(&DataKey::LastAction(who.clone()), &now);
    }

    fn capacity(env: &Env, who: &Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Capacity(who.clone()))
            .unwrap_or(0)
    }

    /// Cliente del verificador Groth16.
    fn verifier(env: &Env) -> VerifierClient {
        let id: Address = env
            .storage()
            .instance()
            .get(&DataKey::Verifier)
            .unwrap_or_else(|| panic(env, AuctionError::NotInitialized));
        VerifierClient::new(env, &id)
    }

    /// Convierte un `i128` no negativo al elemento `Fr` (32 bytes big-endian)
    /// que el verificador espera como entrada pública.
    fn i128_to_fr_bytes(env: &Env, v: i128) -> BytesN<32> {
        let mut out = [0u8; 32];
        out[16..32].copy_from_slice(&v.to_be_bytes());
        BytesN::from_array(env, &out)
    }

    fn require_allowed(env: &Env, who: &Address) {
        let asp_id: Address = env
            .storage()
            .instance()
            .get(&DataKey::Asp)
            .unwrap_or_else(|| panic(env, AuctionError::NotInitialized));
        let asp = AspClient::new(env, &asp_id);
        if !asp.is_allowed(who) {
            panic(env, AuctionError::NotAllowed);
        }
    }
}

fn panic(env: &Env, err: AuctionError) -> ! {
    soroban_sdk::panic_with_error!(env, err)
}

#[cfg(test)]
mod test {
    use super::*;
    use ark_bn254::Bn254;
    use ark_groth16::{Proof, ProvingKey, VerifyingKey};
    use idio_asp::{Asp, AspClient as RealAspClient};
    use idio_prover::{
        fr_be,
        membership::{prove_membership, setup_membership},
        prove_eligibility, prove_reserves, proof_bytes, setup_eligibility, setup_reserves, vk_bytes,
    };
    use idio_token::{ConfidentialToken, ConfidentialTokenClient};
    use idio_verifier::Verifier;
    use soroban_sdk::testutils::{Address as _, BytesN as _, Ledger};

    /// Claves y contratos auxiliares para una subasta completa.
    struct Env_ {
        verifier: Address,
        elig_vk: Groth16Vk,
        reserves_vk: Groth16Vk,
        elig_pk: ProvingKey<Bn254>,
        reserves_pk: ProvingKey<Bn254>,
    }

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

    /// Despliega el verificador y genera las VKs/PKs de los circuitos.
    fn setup_zk(env: &Env) -> Env_ {
        let verifier = env.register(Verifier, ());
        let (elig_pk, elig_vk_ark) = setup_eligibility();
        let (reserves_pk, reserves_vk_ark) = setup_reserves();
        Env_ {
            verifier,
            elig_vk: to_vk(env, &elig_vk_ark),
            reserves_vk: to_vk(env, &reserves_vk_ark),
            elig_pk,
            reserves_pk,
        }
    }

    fn reserves_proof(env: &Env, z: &Env_, amount: u64, total: u64) -> Groth16Proof {
        // pct=30 política; liquid = total (100% líquido, satisface el ratio).
        to_proof(env, &prove_reserves(&z.reserves_pk, amount, 30, total, total, 7))
    }

    fn elig_proof(env: &Env, z: &Env_, min: u64, capacity: u64, bid: u64) -> Groth16Proof {
        to_proof(env, &prove_eligibility(&z.elig_pk, min, capacity, bid, 7))
    }

    fn setup_token(env: &Env, admin: &Address) -> Address {
        let token_id = env.register(ConfidentialToken, ());
        let token = ConfidentialTokenClient::new(env, &token_id);
        let mut h = [0u8; 64];
        h[31] = 1;
        h[63] = 2;
        token.initialize(admin, &BytesN::from_array(env, &h));
        token_id
    }

    fn commit(env: &Env, amount: i128, salt: &BytesN<32>) -> BytesN<32> {
        let mut preimage = soroban_sdk::Bytes::new(env);
        preimage.extend_from_array(&amount.to_be_bytes());
        preimage.append(&soroban_sdk::Bytes::from(salt.clone()));
        env.crypto().sha256(&preimage).into()
    }

    fn setup_asp(env: &Env, admin: &Address, banks: &[&Address]) -> Address {
        let asp_id = env.register(Asp, ());
        let asp = RealAspClient::new(env, &asp_id);
        asp.initialize(admin);
        for b in banks {
            asp.allow(b);
        }
        asp_id
    }

    #[test]
    fn full_auction_flow() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register(AuctionContract, ());
        let client = AuctionContractClient::new(&env, &id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let bank_a = Address::generate(&env);
        let bank_b = Address::generate(&env);

        let asp = setup_asp(&env, &admin, &[&bank_a, &bank_b]);
        let token = setup_token(&env, &admin);
        let z = setup_zk(&env);
        client.initialize(&admin, &asp, &token, &z.verifier, &z.elig_vk, &z.reserves_vk);

        let reserves = BytesN::random(&env);
        // Prueba de reservas real: total (600M) >= monto (500M).
        let auction_id = client.create_auction(
            &issuer,
            &String::from_str(&env, "Bonos Argentina"),
            &500_000_000,
            &10_000_000,
            &100,
            &reserves,
            &reserves_proof(&env, &z, 500_000_000, 600_000_000),
        );
        assert_eq!(auction_id, 1);

        // Capacidad registrada de cada banco (cupo máximo de oferta).
        client.set_capacity(&bank_a, &50_000_000);
        client.set_capacity(&bank_b, &50_000_000);
        let salt_a = BytesN::random(&env);
        let salt_b = BytesN::random(&env);
        let bid_a = 12_000_000i128;
        let bid_b = 15_000_000i128;
        // Pruebas de elegibilidad reales: capacidad >= oferta >= mínimo (10M).
        client.submit_sealed_bid(
            &auction_id,
            &bank_a,
            &commit(&env, bid_a, &salt_a),
            &elig_proof(&env, &z, 10_000_000, 50_000_000, 12_000_000),
        );
        client.submit_sealed_bid(
            &auction_id,
            &bank_b,
            &commit(&env, bid_b, &salt_b),
            &elig_proof(&env, &z, 10_000_000, 50_000_000, 15_000_000),
        );

        env.ledger().with_mut(|l| l.timestamp += 200);
        client.reveal_bid(&auction_id, &bank_a, &bid_a, &salt_a);
        client.reveal_bid(&auction_id, &bank_b, &bid_b, &salt_b);

        let winner = client.settle(&auction_id);
        assert_eq!(winner, Some(bank_b.clone()));
        let auction = client.get_auction(&auction_id);
        assert_eq!(auction.winning_amount, 15_000_000);
    }

    #[test]
    fn bidder_can_replace_own_bid() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register(AuctionContract, ());
        let client = AuctionContractClient::new(&env, &id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let bank = Address::generate(&env);
        let asp = setup_asp(&env, &admin, &[&bank]);
        let token = setup_token(&env, &admin);
        let z = setup_zk(&env);
        client.initialize(&admin, &asp, &token, &z.verifier, &z.elig_vk, &z.reserves_vk);

        let reserves = BytesN::random(&env);
        let auction_id = client.create_auction(
            &issuer,
            &String::from_str(&env, "Bonos"),
            &500_000_000,
            &10_000_000,
            &100,
            &reserves,
            &reserves_proof(&env, &z, 500_000_000, 600_000_000),
        );

        // Primera oferta (12M), luego la reemplaza por una mayor (18M).
        client.set_capacity(&bank, &50_000_000);
        let salt1 = BytesN::random(&env);
        let salt2 = BytesN::random(&env);
        client.submit_sealed_bid(
            &auction_id,
            &bank,
            &commit(&env, 12_000_000, &salt1),
            &elig_proof(&env, &z, 10_000_000, 50_000_000, 12_000_000),
        );
        client.submit_sealed_bid(
            &auction_id,
            &bank,
            &commit(&env, 18_000_000, &salt2),
            &elig_proof(&env, &z, 10_000_000, 50_000_000, 18_000_000),
        );

        // Una sola oferta (reemplazada, no duplicada).
        assert_eq!(client.get_bids(&auction_id).len(), 1);

        env.ledger().with_mut(|l| l.timestamp += 200);
        // Solo revela con el monto/salt de la oferta vigente (18M).
        client.reveal_bid(&auction_id, &bank, &18_000_000, &salt2);
        assert_eq!(client.settle(&auction_id), Some(bank));
        assert_eq!(client.get_auction(&auction_id).winning_amount, 18_000_000);
    }

    #[test]
    #[should_panic]
    fn bid_with_invalid_eligibility_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register(AuctionContract, ());
        let client = AuctionContractClient::new(&env, &id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let bank = Address::generate(&env);
        let asp = setup_asp(&env, &admin, &[&bank]);
        let token = setup_token(&env, &admin);
        let z = setup_zk(&env);
        client.initialize(&admin, &asp, &token, &z.verifier, &z.elig_vk, &z.reserves_vk);

        let reserves = BytesN::random(&env);
        let auction_id = client.create_auction(
            &issuer,
            &String::from_str(&env, "Bonos"),
            &500_000_000,
            &10_000_000,
            &100,
            &reserves,
            &reserves_proof(&env, &z, 500_000_000, 600_000_000),
        );

        let salt = BytesN::random(&env);
        // Prueba para mínimo=5M, pero la subasta exige mínimo=10M:
        // la entrada pública no coincide -> verify_groth16 falla.
        client.submit_sealed_bid(
            &auction_id,
            &bank,
            &commit(&env, 12_000_000, &salt),
            &elig_proof(&env, &z, 5_000_000, 50_000_000, 12_000_000),
        );
    }

    #[test]
    #[should_panic]
    fn bid_from_non_whitelisted_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register(AuctionContract, ());
        let client = AuctionContractClient::new(&env, &id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let outsider = Address::generate(&env);
        let asp = setup_asp(&env, &admin, &[]);
        let token = setup_token(&env, &admin);
        let z = setup_zk(&env);
        client.initialize(&admin, &asp, &token, &z.verifier, &z.elig_vk, &z.reserves_vk);

        let reserves = BytesN::random(&env);
        let auction_id = client.create_auction(
            &issuer,
            &String::from_str(&env, "Bonos"),
            &500_000_000,
            &10_000_000,
            &100,
            &reserves,
            &reserves_proof(&env, &z, 500_000_000, 600_000_000),
        );
        let salt = BytesN::random(&env);
        client.submit_sealed_bid(
            &auction_id,
            &outsider,
            &commit(&env, 12_000_000, &salt),
            &elig_proof(&env, &z, 10_000_000, 50_000_000, 12_000_000),
        );
    }

    #[test]
    fn payment_flow_settles_confidentially() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register(AuctionContract, ());
        let client = AuctionContractClient::new(&env, &id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let winner = Address::generate(&env);

        let asp = setup_asp(&env, &admin, &[&winner]);
        let token_id = setup_token(&env, &admin);
        let z = setup_zk(&env);
        client.initialize(&admin, &asp, &token_id, &z.verifier, &z.elig_vk, &z.reserves_vk);

        let reserves = BytesN::random(&env);
        let auction_id = client.create_auction(
            &issuer,
            &String::from_str(&env, "Bonos"),
            &500_000_000,
            &10_000_000,
            &100,
            &reserves,
            &reserves_proof(&env, &z, 500_000_000, 600_000_000),
        );

        client.set_capacity(&winner, &50_000_000);
        let salt = BytesN::random(&env);
        let bid = 15_000_000i128;
        client.submit_sealed_bid(
            &auction_id,
            &winner,
            &commit(&env, bid, &salt),
            &elig_proof(&env, &z, 10_000_000, 50_000_000, 15_000_000),
        );
        env.ledger().with_mut(|l| l.timestamp += 200);
        client.reveal_bid(&auction_id, &winner, &bid, &salt);
        assert_eq!(client.settle(&auction_id), Some(winner.clone()));

        let token = ConfidentialTokenClient::new(&env, &token_id);
        let blinding = BytesN::from_array(&env, &[9u8; 32]);
        let value_commitment = token.commit_value(&bid, &blinding);
        client.settle_payment(&auction_id, &value_commitment);

        let auction = client.get_auction(&auction_id);
        assert!(auction.paid);
        assert_eq!(token.commitment(&issuer), value_commitment);
    }

    #[test]
    fn beshield_consensus_gates_settlement() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register(AuctionContract, ());
        let client = AuctionContractClient::new(&env, &id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let bank = Address::generate(&env);
        let asp = setup_asp(&env, &admin, &[&bank]);
        let token = setup_token(&env, &admin);
        let z = setup_zk(&env);
        client.initialize(&admin, &asp, &token, &z.verifier, &z.elig_vk, &z.reserves_vk);

        // BEShield: set de validadores (secretos 1..=5) y umbral 2 de 5.
        let (vpk, vvk) = setup_membership();
        let validators = [
            ark_bn254::Fr::from(1u64),
            ark_bn254::Fr::from(2u64),
            ark_bn254::Fr::from(3u64),
            ark_bn254::Fr::from(4u64),
            ark_bn254::Fr::from(5u64),
        ];
        let (_, vroot, _) = prove_membership(&vpk, &validators, 0, 1);
        client.set_consensus(&BytesN::from_array(&env, &fr_be(&vroot)), &to_vk(&env, &vvk), &2u32);

        let reserves = BytesN::random(&env);
        let auction_id = client.create_auction(
            &issuer,
            &String::from_str(&env, "Bonos"),
            &500_000_000,
            &10_000_000,
            &100,
            &reserves,
            &reserves_proof(&env, &z, 500_000_000, 600_000_000),
        );
        client.set_capacity(&bank, &50_000_000);
        let salt = BytesN::random(&env);
        client.submit_sealed_bid(
            &auction_id,
            &bank,
            &commit(&env, 15_000_000, &salt),
            &elig_proof(&env, &z, 10_000_000, 50_000_000, 15_000_000),
        );
        env.ledger().with_mut(|l| l.timestamp += 200);
        client.reveal_bid(&auction_id, &bank, &15_000_000i128, &salt);

        // Sin aprobaciones suficientes, settle debe fallar.
        assert_eq!(client.try_settle(&auction_id).is_err(), true);

        // Dos validadores distintos aprueban (membership ZK + nullifier).
        let (p0, _, n0) = prove_membership(&vpk, &validators, 0, 11);
        let (p2, _, n2) = prove_membership(&vpk, &validators, 2, 22);
        client.approve_settlement(&auction_id, &to_proof(&env, &p0), &BytesN::from_array(&env, &fr_be(&n0)));
        client.approve_settlement(&auction_id, &to_proof(&env, &p2), &BytesN::from_array(&env, &fr_be(&n2)));
        assert_eq!(client.approvals(&auction_id), 2);

        // Ahora sí liquida.
        assert_eq!(client.settle(&auction_id), Some(bank));
    }

    // ---- Tarea 2: casos borde y robustez ----

    /// Prepara un contrato inicializado con `banks` en la allow-list y una
    /// subasta abierta (mínimo 10M, duración 100s). Devuelve cliente y contexto.
    fn deploy_with_auction<'a>(
        env: &'a Env,
        banks: &[&Address],
    ) -> (AuctionContractClient<'a>, Address, Env_, u64) {
        let id = env.register(AuctionContract, ());
        let client = AuctionContractClient::new(env, &id);
        let admin = Address::generate(env);
        let issuer = Address::generate(env);
        let asp = setup_asp(env, &admin, banks);
        let token = setup_token(env, &admin);
        let z = setup_zk(env);
        client.initialize(&admin, &asp, &token, &z.verifier, &z.elig_vk, &z.reserves_vk);
        let reserves = BytesN::random(env);
        let auction_id = client.create_auction(
            &issuer,
            &String::from_str(env, "Bonos"),
            &500_000_000,
            &10_000_000,
            &100,
            &reserves,
            &reserves_proof(env, &z, 500_000_000, 600_000_000),
        );
        (client, issuer, z, auction_id)
    }

    /// Empate de montos: gana la oferta con menor timestamp (la primera).
    #[test]
    fn ties_resolved_by_earliest_timestamp() {
        let env = Env::default();
        env.mock_all_auths();
        let bank_a = Address::generate(&env);
        let bank_b = Address::generate(&env);
        let (client, _issuer, z, auction_id) = deploy_with_auction(&env, &[&bank_a, &bank_b]);

        client.set_capacity(&bank_a, &50_000_000);
        client.set_capacity(&bank_b, &50_000_000);
        let salt_a = BytesN::random(&env);
        let salt_b = BytesN::random(&env);
        let amount = 15_000_000i128;

        // bank_a oferta primero; avanzamos el ledger para que bank_b tenga un
        // timestamp estrictamente mayor.
        client.submit_sealed_bid(
            &auction_id,
            &bank_a,
            &commit(&env, amount, &salt_a),
            &elig_proof(&env, &z, 10_000_000, 50_000_000, 15_000_000),
        );
        env.ledger().with_mut(|l| l.timestamp += 1);
        client.submit_sealed_bid(
            &auction_id,
            &bank_b,
            &commit(&env, amount, &salt_b),
            &elig_proof(&env, &z, 10_000_000, 50_000_000, 15_000_000),
        );

        env.ledger().with_mut(|l| l.timestamp += 200);
        client.reveal_bid(&auction_id, &bank_a, &amount, &salt_a);
        client.reveal_bid(&auction_id, &bank_b, &amount, &salt_b);

        // Ante el empate, gana bank_a (menor timestamp).
        assert_eq!(client.settle(&auction_id), Some(bank_a));
        assert_eq!(client.get_auction(&auction_id).winning_amount, amount);
    }

    /// Reveal fuera de la ventana de revelación: se rechaza.
    #[test]
    fn late_reveal_is_rejected() {
        let env = Env::default();
        env.mock_all_auths();
        let bank = Address::generate(&env);
        let (client, _issuer, z, auction_id) = deploy_with_auction(&env, &[&bank]);

        client.set_capacity(&bank, &50_000_000);
        let salt = BytesN::random(&env);
        let bid = 15_000_000i128;
        client.submit_sealed_bid(
            &auction_id,
            &bank,
            &commit(&env, bid, &salt),
            &elig_proof(&env, &z, 10_000_000, 50_000_000, 15_000_000),
        );

        // Muy pasado el reveal_deadline (end_time + 86400s).
        env.ledger().with_mut(|l| l.timestamp += 200_000);
        let res = client.try_reveal_bid(&auction_id, &bank, &bid, &salt);
        assert!(res.is_err());
    }

    /// Doble settle: la segunda llamada aborta.
    #[test]
    fn double_settle_is_rejected() {
        let env = Env::default();
        env.mock_all_auths();
        let bank = Address::generate(&env);
        let (client, _issuer, z, auction_id) = deploy_with_auction(&env, &[&bank]);

        client.set_capacity(&bank, &50_000_000);
        let salt = BytesN::random(&env);
        let bid = 15_000_000i128;
        client.submit_sealed_bid(
            &auction_id,
            &bank,
            &commit(&env, bid, &salt),
            &elig_proof(&env, &z, 10_000_000, 50_000_000, 15_000_000),
        );
        env.ledger().with_mut(|l| l.timestamp += 200);
        client.reveal_bid(&auction_id, &bank, &bid, &salt);

        assert_eq!(client.settle(&auction_id), Some(bank));
        // Segunda liquidación: debe abortar.
        assert!(client.try_settle(&auction_id).is_err());
    }

    /// Cancelación antes de ofertas: OK; luego no se puede ofertar ni recancelar.
    #[test]
    fn cancel_before_bids_blocks_further_ops() {
        let env = Env::default();
        env.mock_all_auths();
        let bank = Address::generate(&env);
        let (client, _issuer, z, auction_id) = deploy_with_auction(&env, &[&bank]);

        client.cancel_auction(&auction_id);
        assert_eq!(client.get_auction(&auction_id).status, AuctionStatus::Cancelled);

        // No se puede ofertar sobre una subasta cancelada.
        client.set_capacity(&bank, &50_000_000);
        let salt = BytesN::random(&env);
        let res = client.try_submit_sealed_bid(
            &auction_id,
            &bank,
            &commit(&env, 15_000_000, &salt),
            &elig_proof(&env, &z, 10_000_000, 50_000_000, 15_000_000),
        );
        assert!(res.is_err());
        // Recancelar aborta.
        assert!(client.try_cancel_auction(&auction_id).is_err());
    }

    /// Cancelación después de recibir ofertas: se rechaza.
    #[test]
    fn cancel_after_bids_is_rejected() {
        let env = Env::default();
        env.mock_all_auths();
        let bank = Address::generate(&env);
        let (client, _issuer, z, auction_id) = deploy_with_auction(&env, &[&bank]);

        client.set_capacity(&bank, &50_000_000);
        let salt = BytesN::random(&env);
        client.submit_sealed_bid(
            &auction_id,
            &bank,
            &commit(&env, 15_000_000, &salt),
            &elig_proof(&env, &z, 10_000_000, 50_000_000, 15_000_000),
        );
        assert!(client.try_cancel_auction(&auction_id).is_err());
    }

    // ---- Tarea 5: pausa, versión y anti-spam ----

    /// En pausa, ofertar se rechaza; al reanudar, vuelve a permitirse.
    #[test]
    fn pause_blocks_operations() {
        let env = Env::default();
        env.mock_all_auths();
        let bank = Address::generate(&env);
        let (client, _issuer, z, auction_id) = deploy_with_auction(&env, &[&bank]);

        assert_eq!(client.version(), 2);
        client.set_capacity(&bank, &50_000_000);
        let salt = BytesN::random(&env);

        client.pause();
        assert!(client.is_paused());
        let res = client.try_submit_sealed_bid(
            &auction_id,
            &bank,
            &commit(&env, 15_000_000, &salt),
            &elig_proof(&env, &z, 10_000_000, 50_000_000, 15_000_000),
        );
        assert!(res.is_err());

        client.unpause();
        assert!(!client.is_paused());
        client.submit_sealed_bid(
            &auction_id,
            &bank,
            &commit(&env, 15_000_000, &salt),
            &elig_proof(&env, &z, 10_000_000, 50_000_000, 15_000_000),
        );
    }

    /// Rate-limit anti-spam: dos ofertas de la misma dirección demasiado
    /// seguidas se rechazan; pasado el intervalo, se vuelven a permitir.
    #[test]
    fn rate_limit_blocks_rapid_actions() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().with_mut(|l| l.timestamp = 1_000);
        let id = env.register(AuctionContract, ());
        let client = AuctionContractClient::new(&env, &id);
        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let bank = Address::generate(&env);
        let asp = setup_asp(&env, &admin, &[&bank]);
        let token = setup_token(&env, &admin);
        let z = setup_zk(&env);
        client.initialize(&admin, &asp, &token, &z.verifier, &z.elig_vk, &z.reserves_vk);
        let reserves = BytesN::random(&env);
        let auction_id = client.create_auction(
            &issuer,
            &String::from_str(&env, "Bonos"),
            &500_000_000,
            &10_000_000,
            &100_000,
            &reserves,
            &reserves_proof(&env, &z, 500_000_000, 600_000_000),
        );

        client.set_rate_limit(&100);
        assert_eq!(client.get_rate_limit(), 100);
        client.set_capacity(&bank, &50_000_000);
        let salt = BytesN::random(&env);

        // Primera oferta: OK (registra el instante).
        client.submit_sealed_bid(
            &auction_id,
            &bank,
            &commit(&env, 15_000_000, &salt),
            &elig_proof(&env, &z, 10_000_000, 50_000_000, 15_000_000),
        );
        // Inmediata (mismo timestamp, < 100s): rechazada.
        assert!(client
            .try_submit_sealed_bid(
                &auction_id,
                &bank,
                &commit(&env, 15_000_000, &salt),
                &elig_proof(&env, &z, 10_000_000, 50_000_000, 15_000_000),
            )
            .is_err());
        // Pasado el intervalo: permitida de nuevo.
        env.ledger().with_mut(|l| l.timestamp += 150);
        client.submit_sealed_bid(
            &auction_id,
            &bank,
            &commit(&env, 15_000_000, &salt),
            &elig_proof(&env, &z, 10_000_000, 50_000_000, 15_000_000),
        );
    }

    /// No se puede revelar sin haber ofertado (orden de estados).
    #[test]
    fn reveal_without_bid_is_rejected() {
        let env = Env::default();
        env.mock_all_auths();
        let bank = Address::generate(&env);
        let (client, _issuer, _z, auction_id) = deploy_with_auction(&env, &[&bank]);

        env.ledger().with_mut(|l| l.timestamp += 200);
        let salt = BytesN::random(&env);
        let res = client.try_reveal_bid(&auction_id, &bank, &15_000_000, &salt);
        assert!(res.is_err());
    }
}
