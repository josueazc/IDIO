//! Imprime las verifying keys de elegibilidad y reservas como JSON listo para
//! pasar a `auction.initialize` vía la CLI de Stellar.

use idio_prover::{setup_eligibility, setup_reserves, vk_to_hex, VkHex};

fn json(v: &VkHex) -> String {
    let ic = v
        .ic
        .iter()
        .map(|s| format!("\"{}\"", s))
        .collect::<Vec<_>>()
        .join(",");
    format!(
        "{{\"alpha\":\"{}\",\"beta\":\"{}\",\"gamma\":\"{}\",\"delta\":\"{}\",\"ic\":[{}]}}",
        v.alpha, v.beta, v.gamma, v.delta, ic
    )
}

fn main() {
    let (_, elig) = setup_eligibility();
    let (_, reserves) = setup_reserves();
    println!("ELIG_VK={}", json(&vk_to_hex(&elig)));
    println!("RESERVES_VK={}", json(&vk_to_hex(&reserves)));
}
