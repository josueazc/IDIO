import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-edge pb-7 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow && <div className="micro-label mb-3">{eyebrow}</div>}
        <h1 className="max-w-4xl text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function RuledPanel({
  title,
  children,
  footer,
}: {
  title?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <section className="ruled-panel">
      {title && <div className="border-b border-edge px-5 py-4 micro-label">{title}</div>}
      <div className="p-5">{children}</div>
      {footer && <div className="border-t border-edge px-5 py-4">{footer}</div>}
    </section>
  )
}

export function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="border border-edge bg-panel p-5">
      <div className="micro-label">{label}</div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</div>
      {detail && <div className="mt-1 text-xs text-slate-500">{detail}</div>}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="grid min-h-56 place-items-center border border-edge bg-panel p-8 text-center">
      <div>
        <div className="mx-auto mb-4 h-2 w-16 bg-brand" />
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </div>
  )
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {message}
    </div>
  )
}

/** Aviso inline (éxito/error/info) descartable, para acciones de usuario. */
export function Toast({
  notice,
  onClose,
}: {
  notice: { type: 'success' | 'error' | 'info'; message: string } | null
  onClose: () => void
}) {
  if (!notice) return null
  const styles =
    notice.type === 'success'
      ? 'border-brand/40 bg-brand/10 text-brand'
      : notice.type === 'error'
        ? 'border-red-400/30 bg-red-500/10 text-red-200'
        : 'border-edge bg-white/[0.03] text-slate-300'
  return (
    <div className={`flex items-start justify-between gap-4 border px-4 py-3 text-sm ${styles}`}>
      <span>{notice.message}</span>
      <button onClick={onClose} className="text-xs opacity-70 hover:opacity-100" aria-label="Cerrar">
        ✕
      </button>
    </div>
  )
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border border-edge bg-panel">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex gap-4 border-t border-edge p-4 first:border-t-0">
          <div className="h-4 w-24 animate-pulse bg-white/10" />
          <div className="h-4 flex-1 animate-pulse bg-white/10" />
          <div className="h-4 w-20 animate-pulse bg-white/10" />
        </div>
      ))}
    </div>
  )
}
