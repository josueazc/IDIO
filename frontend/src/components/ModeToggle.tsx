import { useState } from 'react'
import { getMode, setMode, type Mode } from '../services/data'

const LABELS: Record<Mode, { short: string; title: string }> = {
  demo: {
    short: 'Demo',
    title: 'Datos de demo locales — no requiere wallet',
  },
  chain: {
    short: 'Testnet',
    title: 'Lee y escribe contra los contratos en Stellar Testnet',
  },
}

export default function ModeToggle({ stacked = false }: { stacked?: boolean }) {
  const [mode, setLocal] = useState<Mode>(getMode())

  function choose(next: Mode) {
    setMode(next)
    setLocal(next)
  }

  return (
    <div className={`segmented ${stacked ? 'w-full' : ''}`} role="group" aria-label="Modo de datos">
      {(['demo', 'chain'] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => choose(item)}
          className={`segmented-btn flex-1 ${mode === item ? 'segmented-btn-active' : ''}`}
          title={LABELS[item].title}
          aria-pressed={mode === item}
        >
          {item === 'chain' && (
            <span
              className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${mode === 'chain' ? 'bg-brand animate-pulse' : 'bg-zinc-600'}`}
              aria-hidden="true"
            />
          )}
          {LABELS[item].short}
        </button>
      ))}
    </div>
  )
}
