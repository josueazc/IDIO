import { useState } from 'react'
import { getMode, setMode, type Mode } from '../services/data'

export default function ModeToggle({ stacked = false }: { stacked?: boolean }) {
  const [mode, setLocal] = useState<Mode>(getMode())

  function choose(next: Mode) {
    setMode(next)
    setLocal(next)
  }

  return (
    <div className={stacked ? 'grid grid-cols-2 gap-1' : 'inline-flex items-center border border-edge bg-white/[0.03] p-1'}>
      {(['demo', 'chain'] as const).map((item) => (
        <button
          key={item}
          onClick={() => choose(item)}
          className={`min-h-9 px-3 text-xs font-semibold transition ${
            mode === item
              ? 'bg-brand text-ink'
              : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
          }`}
          title={item === 'chain' ? 'Read and write against Stellar Testnet contracts' : 'Use local demo data'}
        >
          {item === 'demo' ? 'Demo' : 'Testnet'}
        </button>
      ))}
    </div>
  )
}
