/**
 * Generación de pruebas Zero-Knowledge reales en el navegador.
 *
 * Carga el circuito Noir compilado (`sealed_bid.json`), ejecuta el witness
 * con `@noir-lang/noir_js` (ACVM en WASM) — lo que comprueba de verdad las
 * restricciones del circuito sobre las entradas del usuario — y genera la
 * prueba con el backend UltraHonk de `@aztec/bb.js`.
 *
 * El witness solo se resuelve si `balance >= oferta >= mínimo` y si el
 * compromiso público coincide con `(oferta, salt)`. Por tanto, una prueba
 * válida garantiza esas propiedades sin revelar el monto.
 */
import sealedBidCircuit from '../circuits/sealed_bid.json'

function hexToByteArray(hex: string): number[] {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  const out: number[] = []
  for (let i = 0; i < clean.length; i += 2) out.push(parseInt(clean.slice(i, i + 2), 16))
  return out
}

export interface ZkResult {
  /** Bytes de la prueba en hex (vacío si el backend de proving no estaba disponible). */
  proofHex: string
  /** true si se ejecutó el witness del circuito real (restricciones verificadas). */
  witnessOk: boolean
  /** true si además se generó una prueba criptográfica completa. */
  proofOk: boolean
  /** Milisegundos que tomó. */
  ms: number
}

/**
 * Prueba que una oferta es válida y respaldada.
 * Lanza si el witness no se resuelve (restricción violada): eso significa
 * que la oferta NO cumple las reglas, y no debe enviarse.
 */
export async function proveSealedBid(
  amount: number,
  balance: number,
  minBid: number,
  saltHex: string,
  commitmentHex: string
): Promise<ZkResult> {
  const start = performance.now()
  const { Noir } = await import('@noir-lang/noir_js')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const circuit = sealedBidCircuit as any

  const noir = new Noir(circuit)
  const inputs = {
    bid_amount: amount.toString(),
    available_balance: balance.toString(),
    salt: hexToByteArray(saltHex),
    min_bid: minBid.toString(),
    commitment: hexToByteArray(commitmentHex),
  }

  // Ejecuta el circuito real: si una restricción falla, lanza aquí.
  const { witness } = await noir.execute(inputs)

  // Genera la prueba criptográfica con UltraHonk. Si la versión del backend
  // no es compatible en este entorno, devolvemos witnessOk=true igualmente:
  // el circuito ya validó las restricciones sobre las entradas reales.
  try {
    const { Barretenberg, UltraHonkBackend } = await import('@aztec/bb.js')
    const api = await Barretenberg.new()
    const backend = new UltraHonkBackend(circuit.bytecode, api)
    const proof = await backend.generateProof(witness)
    const proofHex = [...proof.proof].map((b) => b.toString(16).padStart(2, '0')).join('')
    const ms = performance.now() - start
    console.info(`[IDIO] Prueba ZK UltraHonk generada: ${proof.proof.length} bytes en ${Math.round(ms)} ms`)
    return { proofHex, witnessOk: true, proofOk: true, ms }
  } catch (e) {
    console.warn('[IDIO] Witness ejecutado; backend de proving no disponible:', e)
    return { proofHex: '', witnessOk: true, proofOk: false, ms: performance.now() - start }
  }
}
