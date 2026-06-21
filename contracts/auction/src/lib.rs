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

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, Address, BytesN, Env,
    String, Vec,
};

/// Interfaz del contrato ASP para la llamada cross-contract de gating.
/// Genera `AspClient`, usado por la subasta para validar participantes.
#[contractclient(name = "AspClient")]
pub trait AspInterface {
    fn is_allowed(env: Env, who: Address) -> bool;
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
}

#[contracttype]
enum DataKey {
    Admin,
    /// Contrato ASP usado para validar participantes.
    Asp,
    Counter,
    Auction(u64),
    Bids(u64),
}

#[contract]
pub struct AuctionContract;

#[contractimpl]
impl AuctionContract {
    /// Inicializa el contrato con el admin y el contrato ASP de compliance.
    pub fn initialize(env: Env, admin: Address, asp: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Asp, &asp);
        env.storage().instance().set(&DataKey::Counter, &0u64);
    }

    /// Crea una subasta. `duration` en segundos a partir de ahora.
    pub fn create_auction(
        env: Env,
        issuer: Address,
        asset: String,
        amount: i128,
        min_bid: i128,
        duration: u64,
        reserves_commitment: BytesN<32>,
    ) -> u64 {
        issuer.require_auth();

        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::Counter)
            .unwrap_or(0)
            + 1;
        env.storage().instance().set(&DataKey::Counter, &id);

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
            end_time: env.ledger().timestamp() + duration,
        };

        env.storage().persistent().set(&DataKey::Auction(id), &auction);
        env.storage()
            .persistent()
            .set(&DataKey::Bids(id), &Vec::<SealedBid>::new(&env));
        id
    }

    /// Envía una oferta sellada. Solo se guarda el compromiso; el monto
    /// permanece privado hasta el reveal. El bidder debe estar en la
    /// allow-list del ASP.
    pub fn submit_sealed_bid(
        env: Env,
        auction_id: u64,
        bidder: Address,
        commitment: BytesN<32>,
    ) {
        bidder.require_auth();
        Self::require_allowed(&env, &bidder);

        let mut auction = Self::get(&env, auction_id);
        if auction.status != AuctionStatus::BiddingOpen {
            panic(&env, AuctionError::NotInBiddingPhase);
        }
        if env.ledger().timestamp() > auction.end_time {
            panic(&env, AuctionError::BiddingClosed);
        }

        let mut bids: Vec<SealedBid> = env
            .storage()
            .persistent()
            .get(&DataKey::Bids(auction_id))
            .unwrap();
        bids.push_back(SealedBid {
            bidder,
            commitment,
            revealed_amount: 0,
            revealed: false,
            timestamp: env.ledger().timestamp(),
        });
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

        if env.ledger().timestamp() <= auction.end_time {
            panic(&env, AuctionError::BiddingStillOpen);
        }
        if auction.status == AuctionStatus::Settled {
            panic(&env, AuctionError::AlreadySettled);
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

    /// Liquida la subasta: recorre las ofertas reveladas y elige la mayor.
    pub fn settle(env: Env, auction_id: u64) -> Option<Address> {
        let mut auction = Self::get(&env, auction_id);
        if auction.status == AuctionStatus::Settled {
            panic(&env, AuctionError::AlreadySettled);
        }
        if env.ledger().timestamp() <= auction.end_time {
            panic(&env, AuctionError::BiddingStillOpen);
        }

        let bids: Vec<SealedBid> = env
            .storage()
            .persistent()
            .get(&DataKey::Bids(auction_id))
            .unwrap();

        let mut best_amount: i128 = 0;
        let mut winner: Option<Address> = None;
        for bid in bids.iter() {
            if bid.revealed && bid.revealed_amount > best_amount {
                best_amount = bid.revealed_amount;
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

    /// Cancela una subasta (solo el emisor, antes de liquidar).
    pub fn cancel_auction(env: Env, auction_id: u64) {
        let mut auction = Self::get(&env, auction_id);
        auction.issuer.require_auth();
        if auction.status == AuctionStatus::Settled {
            panic(&env, AuctionError::AlreadySettled);
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
    use idio_asp::{Asp, AspClient as RealAspClient};
    use soroban_sdk::testutils::{Address as _, BytesN as _, Ledger};

    fn commit(env: &Env, amount: i128, salt: &BytesN<32>) -> BytesN<32> {
        let mut preimage = soroban_sdk::Bytes::new(env);
        preimage.extend_from_array(&amount.to_be_bytes());
        preimage.append(&soroban_sdk::Bytes::from(salt.clone()));
        env.crypto().sha256(&preimage).into()
    }

    /// Despliega un ASP real, lo inicializa y autoriza a `banks`.
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
        client.initialize(&admin, &asp);

        let reserves = BytesN::random(&env);
        let auction_id = client.create_auction(
            &issuer,
            &String::from_str(&env, "Bonos Argentina"),
            &500_000_000,
            &10_000_000,
            &100, // duration
            &reserves,
        );
        assert_eq!(auction_id, 1);

        // Ofertas selladas
        let salt_a = BytesN::random(&env);
        let salt_b = BytesN::random(&env);
        let bid_a = 12_000_000i128;
        let bid_b = 15_000_000i128;
        client.submit_sealed_bid(&auction_id, &bank_a, &commit(&env, bid_a, &salt_a));
        client.submit_sealed_bid(&auction_id, &bank_b, &commit(&env, bid_b, &salt_b));

        // Avanza el tiempo más allá del cierre
        env.ledger().with_mut(|l| l.timestamp += 200);

        // Reveal
        client.reveal_bid(&auction_id, &bank_a, &bid_a, &salt_a);
        client.reveal_bid(&auction_id, &bank_b, &bid_b, &salt_b);

        // Settle: gana bank_b con 15M
        let winner = client.settle(&auction_id);
        assert_eq!(winner, Some(bank_b.clone()));

        let auction = client.get_auction(&auction_id);
        assert_eq!(auction.status, AuctionStatus::Settled);
        assert_eq!(auction.winner, Some(bank_b));
        assert_eq!(auction.winning_amount, 15_000_000);
    }

    #[test]
    #[should_panic]
    fn reveal_with_wrong_amount_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register(AuctionContract, ());
        let client = AuctionContractClient::new(&env, &id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let bank = Address::generate(&env);
        let asp = setup_asp(&env, &admin, &[&bank]);
        client.initialize(&admin, &asp);

        let reserves = BytesN::random(&env);
        let auction_id = client.create_auction(
            &issuer,
            &String::from_str(&env, "Bonos"),
            &500_000_000,
            &10_000_000,
            &100,
            &reserves,
        );

        let salt = BytesN::random(&env);
        client.submit_sealed_bid(&auction_id, &bank, &commit(&env, 12_000_000, &salt));
        env.ledger().with_mut(|l| l.timestamp += 200);
        // Revela un monto distinto al comprometido -> CommitmentMismatch
        client.reveal_bid(&auction_id, &bank, &13_000_000, &salt);
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
        // ASP sin autorizar a `outsider`.
        let asp = setup_asp(&env, &admin, &[]);
        client.initialize(&admin, &asp);

        let reserves = BytesN::random(&env);
        let auction_id = client.create_auction(
            &issuer,
            &String::from_str(&env, "Bonos"),
            &500_000_000,
            &10_000_000,
            &100,
            &reserves,
        );
        let salt = BytesN::random(&env);
        // Debe abortar con NotAllowed.
        client.submit_sealed_bid(&auction_id, &outsider, &commit(&env, 12_000_000, &salt));
    }
}
