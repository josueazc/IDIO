import type { Auction } from '../types'
import { getMode } from '../services/data'
import { config } from '../config'

/**
 * Panel "qué se ve / qué se oculta" — hace tangible la privacidad del ZK:
 * lista qué dato es público on-chain y cuál permanece oculto. Incluye un link
 * a stellar.expert para comprobar el contrato uno mismo.
 */
export default function PrivacyPanel({ auction }: { auction: Auction }) {
  const settled = auction.status === 'Settled'
  const explorer = `https://stellar.expert/explorer/testnet/contract/${config.contracts.auction}`

  const rows: { label: string; shown: boolean; note?: string; tip?: string }[] = [
    { label: 'Existencia de la subasta', shown: true },
    { label: 'Emisor (dirección)', shown: true },
    { label: 'Activo y monto emitido', shown: true },
    {
      label: 'Compromiso de cada oferta (hash)',
      shown: true,
      tip: 'Commitment = SHA-256(monto‖salt). Es un “sobre cerrado”: oculta el monto pero lo fija, así nadie puede cambiarlo después.',
    },
    {
      label: 'Monto de cada oferta',
      shown: settled,
      note: settled ? 'revelado tras el cierre' : 'oculto hasta el cierre',
      tip: 'Solo se revela en la fase de reveal; antes, on-chain únicamente vive el hash.',
    },
    {
      label: 'Monto del pago al emisor',
      shown: false,
      note: 'compromiso Pedersen',
      tip: 'El pago usa un token confidencial: el balance es C = v·G + r·H, así el monto no es legible on-chain.',
    },
  ]

  return (
    <div className="border border-edge">
      <div className="border-b border-edge px-4 py-3 micro-label">Qué se ve / qué se oculta</div>
      <ul>
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3 border-b border-edge/60 px-4 py-2.5 text-sm last:border-0">
            <span className={`text-slate-300 ${r.tip ? 'cursor-help underline decoration-dotted decoration-slate-600 underline-offset-4' : ''}`} title={r.tip}>
              {r.label}
            </span>
            <span className={`flex items-center gap-2 ${r.shown ? 'text-brand' : 'text-slate-500'}`}>
              {r.note && <span className="text-[11px] text-slate-500">{r.note}</span>}
              {r.shown ? '👁 visible' : '🔒 oculto'}
            </span>
          </li>
        ))}
      </ul>
      {getMode() === 'chain' && (
        <a
          href={explorer}
          target="_blank"
          rel="noreferrer"
          className="block border-t border-edge px-4 py-3 text-sm text-brand hover:underline"
        >
          Verificar el contrato en stellar.expert →
        </a>
      )}
    </div>
  )
}
