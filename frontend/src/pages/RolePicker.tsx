import { useNavigate } from 'react-router-dom'
import ModeToggle from '../components/ModeToggle'
import WalletConnect from '../components/WalletConnect'
import BrandLogo from '../components/BrandLogo'
import BankAccess from '../components/BankAccess'
import { ROLES, setRole, type Role } from '../services/role'
import { roleHome } from '../utils/roleNav'

interface Props {
  address: string | null
  demo: boolean
  onConnect: (address: string, demo: boolean) => void
  onDisconnect: () => void
}

export default function RolePicker({ address, demo, onConnect, onDisconnect }: Props) {
  const nav = useNavigate()

  function pick(role: Role) {
    setRole(role)
    nav(roleHome(role))
  }

  function enterAsBank() {
    pick('oferente')
  }

  return (
    <main className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-30 border-b border-edge bg-ink/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Intent issuance layer</div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:flex">
            <a className="transition hover:text-white" href="#protocol">Protocol</a>
            <a className="transition hover:text-white" href="#roles">Roles</a>
            <a className="transition hover:text-white" href="#wallet">Wallet</a>
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <ModeToggle />
            <WalletConnect address={address} demo={demo} onConnect={onConnect} onDisconnect={onDisconnect} />
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:py-20 lg:grid-cols-[1fr_0.92fr] lg:px-8 lg:py-24">
        <div className="flex flex-col justify-center">
          <div className="mb-6 flex w-fit items-center gap-3 border border-edge bg-white/[0.02] px-3 py-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-brand" />
            Stellar Testnet ready / demo mode available
          </div>
          <h1 className="max-w-5xl text-5xl font-semibold leading-[0.95] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
            Private auctions for institutions that still need public proof.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            IDIO lets issuers publish reserve-backed auctions, bidders submit sealed offers, and auditors
            verify the outcome without exposing private amounts before settlement.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button className="btn-primary" onClick={() => pick('emisor')}>
              Enter issuer desk
            </button>
            <a className="btn-ghost text-center" href="#banks">
              Sign up / log in as a bank
            </a>
          </div>
          <div className="mt-8 grid max-w-2xl grid-cols-3 border border-edge">
            {[
              ['Proof', 'reserve predicate'],
              ['Bid', 'sealed commitment'],
              ['Settle', 'auditable winner'],
            ].map(([label, text]) => (
              <div key={label} className="border-r border-edge p-4 last:border-r-0">
                <div className="text-[10px] uppercase tracking-[0.22em] text-slate-600">{label}</div>
                <div className="mt-2 text-sm text-slate-300">{text}</div>
              </div>
            ))}
          </div>
        </div>

        <LandingMockup />
      </section>

      <section id="protocol" className="border-y border-edge">
        <div className="mx-auto grid max-w-7xl gap-0 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            ['01', 'Issue', 'The issuer defines asset terms and generates proof of reserves.'],
            ['02', 'Commit', 'Bidders submit sealed commitments instead of public amounts.'],
            ['03', 'Reveal', 'Eligible bids are opened when settlement rules allow it.'],
            ['04', 'Audit', 'Auditors inspect evidence and produce a signed report.'],
          ].map(([step, title, text]) => (
            <article key={step} className="border-b border-edge p-5 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
              <div className="font-mono text-xs text-white">{step}</div>
              <h2 className="mt-8 text-xl font-semibold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="roles" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="micro-label mb-3">Choose operating authority</div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em]">One protocol, four controlled desks.</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-500">
            Each role enters a different frontend surface. The backend permissions and data model remain unchanged.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ROLES.map((role, index) => (
            <button
              key={role.id}
              onClick={() => pick(role.id)}
              className="group border border-edge bg-panel p-5 text-left transition hover:border-white/40 hover:bg-raised"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-white">{String(index + 1).padStart(2, '0')}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600">{role.icon}</span>
              </div>
              <h3 className="mt-10 text-xl font-semibold text-white">{role.label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{role.desc}</p>
              <div className="mt-6 text-sm font-semibold text-brand opacity-0 transition group-hover:opacity-100">
                Enter desk
              </div>
            </button>
          ))}
        </div>
      </section>

      <section id="banks" className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <BankAccess
          address={address}
          demo={demo}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
          onEnter={enterAsBank}
        />
      </section>

      <section id="wallet" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 border border-edge bg-[#050505] p-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="micro-label mb-3">Wallet access</div>
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Connect with Stellar Wallets Kit.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Wallet artwork is served from stable local assets, while signing still uses the real Stellar wallet module selected in the kit.
            </p>
          </div>
          <div className="space-y-3">
            <ModeToggle />
            <WalletConnect address={address} demo={demo} onConnect={onConnect} onDisconnect={onDisconnect} />
          </div>
        </div>
      </section>
    </main>
  )
}

function LandingMockup() {
  return (
    <div className="relative min-h-[520px] overflow-hidden border border-edge bg-[#050505] p-5">
      <div className="flex items-center justify-between border-b border-edge pb-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        </div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-slate-600">idio.xyz</div>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_220px]">
        <div>
          <div className="micro-label">Issuer desk / new record</div>
          <div className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white">Issue a private auction.</div>
          <div className="mt-3 max-w-md text-sm leading-6 text-slate-500">
            A proof of reserves is generated before this record is published to the protocol.
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {['Sovereign Notes', 'Sovereign bond', '500000000', 'USDC'].map((value, index) => (
              <div key={value} className="border border-edge bg-[#111] p-4">
                <div className="micro-label">{['Asset', 'Asset class', 'Issue amount', 'Currency'][index]}</div>
                <div className="mt-3 text-sm font-semibold text-white">{value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-edge">
          <div className="border-b border-edge p-4 micro-label">Proof preflight</div>
          {['Stellar Testnet', 'Total coverage', 'Groth16 / BN254', 'After validation'].map((item) => (
            <div key={item} className="flex justify-between gap-4 border-b border-edge p-4 text-xs last:border-b-0">
              <span className="text-slate-600">state</span>
              <span className="font-mono uppercase tracking-[0.16em] text-brand">{item}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-8 right-8 h-32 w-32 rounded-full border border-white/15" />
      <div className="absolute bottom-16 right-20 h-24 w-52 rotate-[-18deg] border border-white/15 bg-white/[0.03]" />
      <div className="absolute bottom-12 right-28 h-16 w-36 rotate-[18deg] border border-brand/45 bg-brand/10" />
    </div>
  )
}
