import { useNavigate } from 'react-router-dom'
import { ROLES, setRole, type Role } from '../services/role'

export default function RolePicker() {
  const nav = useNavigate()

  function pick(r: Role) {
    setRole(r)
    nav(r === 'emisor' ? '/create' : r === 'oferente' ? '/auctions' : r === 'auditor' ? '/audit' : '/compliance')
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-white">Elegí tu rol</h1>
        <p className="mt-2 text-slate-400">
          Cada rol tiene su propia vista y sus propias acciones. No podés actuar como otro rol sin cambiar de vista.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => pick(r.id)}
            className="card p-6 text-left transition hover:border-brand-soft/60 hover:bg-panel"
          >
            <div className="text-3xl">{r.icon}</div>
            <div className="mt-3 text-lg font-bold text-white">{r.label}</div>
            <div className="mt-1 text-sm text-slate-400">{r.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
