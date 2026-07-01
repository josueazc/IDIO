/* tslint:disable */
/* eslint-disable */

/**
 * Prueba de elegibilidad. Devuelve la prueba como hex de 256 bytes
 * (`a‖b‖c`) lista para construir el `Groth16Proof` del contrato.
 */
export function prove_eligibility_hex(min_bid: bigint, capacity: bigint, bid: bigint, salt_hex: string, seed: bigint): string;

/**
 * Covenant: prueba de pertenencia (Merkle + nullifier). `secrets_csv` es la
 * lista de secretos del árbol (u64 separados por comas), `index` el del
 * banco que prueba. Devuelve en hex: `a‖b‖c‖nullifier‖root`
 * (256 + 32 + 32 = 320 bytes = 640 chars) para construir el bid Covenant.
 */
export function prove_membership_hex(secrets_csv: string, index: number, seed: bigint): string;

/**
 * Prueba de reservas. Devuelve `a‖b‖c` en hex (256 bytes).
 */
export function prove_reserves_hex(auction_amount: bigint, min_liquidity_pct: bigint, total: bigint, liquid: bigint, seed: bigint): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly prove_eligibility_hex: (a: bigint, b: bigint, c: bigint, d: number, e: number, f: bigint) => [number, number];
    readonly prove_membership_hex: (a: number, b: number, c: number, d: bigint) => [number, number];
    readonly prove_reserves_hex: (a: bigint, b: bigint, c: bigint, d: bigint, e: bigint) => [number, number];
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
