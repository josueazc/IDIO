import { useState } from 'react'
import { getMode, setMode, type Mode } from '../services/data'

export default function ModeToggle({ stacked = false }: { stacked?: boolean }) {
  const [mode, setLocal] = useState<Mode>(getMode())

  function choose(next: Mode) {
    setMode(next)
    setLocal(next)
  }

  return (
    <div className={`segmented ${stacked ? 'grid w-full grid-cols-2' : ''}`}>
      {(['demo', 'chain'] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => choose(item)}
          className={`segmented-btn ${mode === item ? 'segmented-btn-active' : ''} ${stacked ? 'w-full' : ''}`}
          title={
            item === 'chain'
              ? 'Leer y escribir contra los contratos en Stellar Testnet'
              : 'Usar datos de demo locales'
          }
        >
          {item === 'demo' ? 'Demo' : 'Testnet'}
        </button>
      ))}
    </div>
  )
}
