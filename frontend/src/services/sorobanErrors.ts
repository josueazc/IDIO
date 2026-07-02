/**
 * Decodifica errores Soroban/RPC en mensajes legibles para el usuario.
 * Los contratos de IDIO emiten Error(Contract, #N) con códigos conocidos.
 */

const CONTRACT_ERRORS: Record<number, string> = {
  1: 'La subasta no existe o el ID es inválido.',
  2: 'La subasta ya está cerrada o no está en estado correcto para esta operación.',
  3: 'Ya ofertaste en esta subasta. Podés actualizar tu oferta antes del cierre.',
  4: 'La oferta es menor al mínimo requerido.',
  5: 'Tu cupo (capacity) es insuficiente para esta oferta. Pedile al admin que lo aumente.',
  6: 'La prueba ZK es inválida. Verificá que los parámetros del circuito sean correctos.',
  7: 'No estás en la allow-list del contrato ASP. Necesitás ser aprobado por el emisor.',
  8: 'La subasta todavía no cerró. Esperá a que finalice el período de ofertas.',
  9: 'La subasta ya está liquidada.',
  10: 'No sos el ganador de esta subasta.',
  11: 'El pago ya fue realizado.',
  12: 'No tenés permisos para esta operación (solo el admin puede hacerla).',
  13: 'El compromiso de reservas es inválido.',
  14: 'El reveal falló: el (monto, salt) no coincide con el compromiso on-chain.',
  15: 'Capacidad (capacity) debe ser mayor a cero.',
  16: 'La subasta está pausada por el administrador.',
  17: 'Límite anti-spam: esperá antes de volver a intentar.',
  18: 'El depósito requerido no fue enviado.',
  19: 'El consenso de validadores (BEShield) no alcanzó el threshold requerido.',
  20: 'Nullifier ya usado: esta aprobación ya fue registrada.',
}

const RPC_ERRORS: Record<string, string> = {
  'HostError: Error(Contract, #': 'Error del contrato',
  'Error(Crypto, InvalidInput)': 'Prueba ZK rechazada on-chain. La prueba es inválida o fue manipulada.',
  'Error(WasmVm, InvalidAction)': 'El contrato rechazó la operación (estado incorrecto).',
  'Error(Storage, MissingValue)': 'Dato no encontrado on-chain. El contrato puede no estar inicializado.',
  'transaction simulation failed': 'La simulación de la transacción falló. Verificá que la red esté disponible.',
  'Network Error': 'Sin conexión a la red Stellar. Verificá tu conexión a internet.',
  'user rejected': 'Cancelaste la firma en tu wallet.',
  'User rejected': 'Cancelaste la firma en tu wallet.',
  'timeout': 'La operación tardó demasiado. Intentá de nuevo.',
}

export function decodeSorobanError(raw: string): string {
  // Extract contract error code: Error(Contract, #N)
  const contractMatch = raw.match(/Error\(Contract,\s*#(\d+)\)/)
  if (contractMatch) {
    const code = Number(contractMatch[1])
    const msg = CONTRACT_ERRORS[code]
    if (msg) return msg
    return `Error del contrato #${code}. Revisá los parámetros de la operación.`
  }

  // Specific crypto error
  if (raw.includes('Error(Crypto, InvalidInput)')) {
    return RPC_ERRORS['Error(Crypto, InvalidInput)']
  }

  // Check known RPC/network error patterns
  for (const [pattern, msg] of Object.entries(RPC_ERRORS)) {
    if (raw.toLowerCase().includes(pattern.toLowerCase())) return msg
  }

  // Truncate raw message if too long
  if (raw.length > 160) return raw.slice(0, 157) + '…'
  return raw
}

/** Acción sugerida según el código de error del contrato */
export function errorAction(raw: string): string | null {
  const match = raw.match(/Error\(Contract,\s*#(\d+)\)/)
  if (!match) return null
  const code = Number(match[1])
  const actions: Record<number, string> = {
    5: 'Ir a Cupos para solicitar más capacidad',
    7: 'Contactar al emisor para ser incluido en la allow-list',
    6: 'Regenerar la prueba ZK',
    12: 'Conectar la wallet del administrador',
  }
  return actions[code] ?? null
}
