import { useEffect, useState } from 'react'

interface Props {
  chain: boolean
  label?: string
}

const STEPS_DEMO = [
  'Calculando compromiso SHA-256…',
  'Verificando restricciones del circuito…',
  'Prueba generada.',
]

const STEPS_CHAIN = [
  'Inicializando el prover WASM…',
  'Construyendo el circuito R1CS…',
  'Generando testigos…',
  'Calculando prueba Groth16 / BN254…',
  'Serializando la prueba…',
  'Prueba lista — esperando firma de wallet…',
]

export default function ProverProgress({ chain, label }: Props) {
  const steps = chain ? STEPS_CHAIN : STEPS_DEMO
  const [step, setStep] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = chain ? 4000 : 1200
    const t = setInterval(() => {
      setStep((s) => Math.min(s + 1, steps.length - 1))
    }, interval)
    return () => clearInterval(t)
  }, [chain, steps.length])

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const pct = Math.round(((step + 1) / steps.length) * 100)

  return (
    <div className="space-y-4 border border-edge bg-raised/60 p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="micro-label text-brand">
          {label ?? (chain ? 'Generando prueba ZK Groth16' : 'Verificando restricciones')}
        </span>
        <span className="font-mono text-xs text-zinc-500">{elapsed}s</span>
      </div>

      <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-brand transition-all"
          style={{ width: `${pct}%`, transitionDuration: '600ms', transitionTimingFunction: 'var(--ease-out)' }}
        />
      </div>

      <div className="text-sm text-zinc-400">{steps[step]}</div>

      {chain && (
        <p className="text-xs leading-relaxed text-zinc-600">
          En hardware lento puede tomar 30–60 s. No cierres esta ventana.
        </p>
      )}
    </div>
  )
}
