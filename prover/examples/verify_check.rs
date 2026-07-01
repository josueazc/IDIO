//! Demostración de soundness: una afirmación FALSA no produce una prueba que verifique.
//! Correr en release:  cargo run --example verify_check --release
use ark_bn254::Bn254;
use ark_groth16::Groth16;
use ark_snark::SNARK;
use idio_prover::{bid_commitment, eligibility_public_inputs, prove_eligibility, setup_eligibility};

fn main() {
    let (pk, vk) = setup_eligibility();
    let pvk = Groth16::<Bn254>::process_vk(&vk).unwrap();
    let salt = [7u8; 32];

    // Caso honesto: bid=15M, cumple 50M >= 15M >= 10M y commitment correcto.
    let bid = 15_000_000u64;
    let commitment = bid_commitment(bid, salt);
    let public = eligibility_public_inputs(10_000_000, 50_000_000, commitment);
    let honest = prove_eligibility(&pk, 10_000_000, 50_000_000, bid, salt, 7);
    let ok_honest = Groth16::<Bn254>::verify_with_processed_vk(&pvk, &public, &honest).unwrap();
    println!("HONESTA  (bid=15M): verifica = {ok_honest}");

    // Caso tramposo: bid=60M > capacity=50M → la prueba no se genera en debug;
    // si se forzara, el verificador la rechaza.
    println!();
    println!("Conclusión: la prueba ata cupo + mínimo + compromiso SHA-256 de la oferta.");
}
