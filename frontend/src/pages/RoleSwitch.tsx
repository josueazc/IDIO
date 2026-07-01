import { useNavigate } from 'react-router-dom'
import { PageHeader, RuledPanel } from '../components/Primitives'
import { ROLES, setRole, type Role } from '../services/role'
import { useRole } from '../utils/useRole'
import { roleHome } from '../utils/roleNav'

export default function RoleSwitch() {
  const activeRole = useRole()
  const navigate = useNavigate()

  function choose(role: Role) {
    setRole(role)
    navigate(roleHome(role))
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Cambiar de rol"
        title="Elegí la mesa de operación para esta sesión."
        description="Cambiar de mesa cambia los permisos del frontend y el contexto de navegación. No cambia el estado del protocolo."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {ROLES.map((role, index) => {
          const active = activeRole === role.id
          return (
            <button
              key={role.id}
              onClick={() => choose(role.id)}
              className={`group min-h-[220px] border p-5 text-left transition duration-200 ease-out hover:-translate-y-0.5 hover:border-white/40 ${
                active ? 'border-brand bg-white/[0.045]' : 'border-edge bg-panel hover:bg-raised'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={active ? 'font-mono text-xs text-brand' : 'font-mono text-xs text-white'}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600">
                  {role.icon}
                </span>
              </div>
              <div className="mt-10">
                <h2 className="text-xl font-semibold text-white">{role.label}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">{role.desc}</p>
              </div>
              <div className={`mt-8 text-sm font-semibold ${active ? 'text-brand' : 'text-slate-500 group-hover:text-brand'}`}>
                {active ? 'Mesa actual' : 'Cambiar a esta mesa'}
              </div>
            </button>
          )
        })}
      </div>

      <RuledPanel title="Reglas del cambio de rol">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Sin mutación del backend', 'Cambiar de rol solo cambia la mesa activa del frontend.'],
            ['La billetera sigue activa', 'La billetera conectada o la sesión demo persisten al cambiar de mesa.'],
            ['La ruta cambia a propósito', 'Cada mesa abre en su pantalla operativa más útil.'],
          ].map(([title, body]) => (
            <div key={title} className="border border-edge bg-[#080808] p-4">
              <div className="text-sm font-semibold text-white">{title}</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
            </div>
          ))}
        </div>
      </RuledPanel>
    </div>
  )
}
