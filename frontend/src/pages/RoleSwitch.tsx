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
        eyebrow="Authority switch"
        title="Choose the operating desk for this session."
        description="Switching desks changes the frontend permissions and navigation context. It does not change protocol state."
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
                {active ? 'Current desk' : 'Switch to desk'}
              </div>
            </button>
          )
        })}
      </div>

      <RuledPanel title="Switching rules">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['No backend mutation', 'Changing roles only changes the active frontend desk.'],
            ['Wallet remains active', 'Connected wallet or demo session persists across desk changes.'],
            ['Route changes intentionally', 'Each desk opens on its most useful operational page.'],
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
