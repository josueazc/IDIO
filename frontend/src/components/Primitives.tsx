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
    <div className="mb-10 flex flex-col gap-6 border-b border-edge pb-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="font-display text-3xl text-white md:text-[2.35rem] md:leading-tight">{title}</h1>
        {description && <p className="mt-4 text-base leading-relaxed text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
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
      {title && (
        <div className="border-b border-edge px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && <div className="border-t border-edge px-6 py-4">{footer}</div>}
    </section>
  )
}

export function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-6">
      <div className="micro-label">{label}</div>
      <div className="font-display mt-3 text-3xl text-white">{value}</div>
      {detail && <div className="mt-2 text-xs text-zinc-500">{detail}</div>}
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
    <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-edge bg-raised/40 p-10 text-center">
      <div>
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          ◌
        </div>
        <h3 className="font-display text-xl text-white">{title}</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-500">{description}</p>
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </div>
  )
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {message}
    </div>
  )
}

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
      ? 'border-brand/30 bg-brand/10 text-brand-soft'
      : notice.type === 'error'
        ? 'border-red-400/25 bg-red-500/10 text-red-200'
        : 'border-edge bg-raised text-zinc-300'
  return (
    <div className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${styles}`}>
      <span>{notice.message}</span>
      <button onClick={onClose} className="text-xs opacity-70 hover:opacity-100" aria-label="Cerrar">
        ✕
      </button>
    </div>
  )
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-surface">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex gap-4 border-t border-edge p-4 first:border-t-0">
          <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-4 flex-1 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
        </div>
      ))}
    </div>
  )
}
