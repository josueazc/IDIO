import { useEffect, useState } from 'react'
import { timeLeft } from '../utils/format'

/** Cuenta regresiva en vivo hasta el cierre de una subasta. */
export default function Countdown({ endTime }: { endTime: number }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const closed = endTime <= Date.now()
  return (
    <span className={closed ? 'text-amber-300' : 'text-slate-200'}>
      {closed ? 'cerrada' : timeLeft(endTime)}
    </span>
  )
}
