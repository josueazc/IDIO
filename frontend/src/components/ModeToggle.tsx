import { useState } from 'react'
import { getMode, setMode, type Mode } from '../services/data'

export default function ModeToggle() {
  const [mode, setLocal] = useState<Mode>(getMode())

  function choose(m: Mode) {
    setMode(m)
    setLocal(m)
  }

  return (
    <div className="flex items-center rounded-xl border border-edge bg-white/5 p-0.5 text-xs font-semibold">
      <button
        onClick={() => choose('demo')}
        className={`rounded-lg px-2.5 py-1.5 transition ${
          mode === 'demo' ? 'bg-white/10 text-white' : 'text-slate-400'
        }`}
      >
        Demo
      </button>
      <button
        onClick={() => choose('chain')}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition ${
          mode === 'chain' ? 'bg-brand text-white' : 'text-slate-400'
        }`}
        title="Lee y escribe contra los contratos reales en Stellar Testnet"
      >
        <span className={`h-1.5 w-1.5 rounded-full ${mode === 'chain' ? 'bg-emerald-300' : 'bg-slate-500'}`} />
        Testnet
      </button>
    </div>
  )
}
