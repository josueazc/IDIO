import { useState } from 'react'
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

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-6 space-y-4">
      <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
      <div className="h-7 w-3/4 animate-pulse rounded bg-white/10" />
      <div className="h-3 w-full animate-pulse rounded bg-white/10" />
      <div className="h-3 w-5/6 animate-pulse rounded bg-white/10" />
    </div>
  )
}

export function CopyButton({ text, label = 'copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button
      onClick={copy}
      className="btn-ghost btn-sm px-2 py-1 text-[11px]"
      title={`Copiar: ${text}`}
      aria-label="Copiar al portapapeles"
    >
      {copied ? '✓ copiado' : label}
    </button>
  )
}

type AlertVariant = 'info' | 'success' | 'warn' | 'error'

export function InlineAlert({
  variant = 'info',
  children,
  action,
}: {
  variant?: AlertVariant
  children: ReactNode
  action?: ReactNode
}) {
  const styles: Record<AlertVariant, string> = {
    info: 'border-edge bg-raised text-zinc-300',
    success: 'border-brand/30 bg-brand/10 text-brand',
    warn: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
    error: 'border-red-400/25 bg-red-500/10 text-red-200',
  }
  return (
    <div className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${styles[variant]}`}>
      <span className="leading-relaxed">{children}</span>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function PreflightPanel({
  title = 'Verificación previa',
  checks,
  summary,
}: {
  title?: string
  checks: { label: string; value: string; ok?: boolean }[]
  summary?: ReactNode
}) {
  return (
    <div className="ruled-panel">
      <div className="border-b border-edge px-6 py-4">
        <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
      </div>
      <div className="p-6 space-y-4">
        <div className="divide-y divide-edge border-y border-edge">
          {checks.map(({ label, value, ok }) => (
            <div key={label} className="flex items-center justify-between gap-4 py-3 text-sm">
              <span className="text-zinc-400">{label}</span>
              <span className={`text-right font-mono text-[11px] uppercase tracking-[0.18em] ${ok === false ? 'text-red-300' : 'text-brand'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
        {summary && <div className="text-sm leading-relaxed text-zinc-400">{summary}</div>}
      </div>
    </div>
  )
}

export function Timeline({
  steps,
}: {
  steps: { label: string; detail?: string; done: boolean; active?: boolean }[]
}) {
  return (
    <ol className="space-y-0">
      {steps.map((step, i) => (
        <li key={step.label} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                step.done
                  ? 'border-brand bg-brand text-ink'
                  : step.active
                    ? 'border-brand bg-brand/20 text-brand'
                    : 'border-edge bg-raised text-zinc-600'
              }`}
            >
              {step.done ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`mt-1 w-px flex-1 ${step.done ? 'bg-brand/40' : 'bg-edge'}`} style={{ minHeight: 24 }} />
            )}
          </div>
          <div className="pb-6 pt-1 min-w-0">
            <div className={`text-sm font-medium ${step.done ? 'text-white' : step.active ? 'text-brand' : 'text-zinc-500'}`}>
              {step.label}
            </div>
            {step.detail && <div className="mt-1 text-xs leading-relaxed text-zinc-600">{step.detail}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function DataTable<T>({
  columns,
  rows,
  keyFn,
  onRowClick,
  selectedKey,
}: {
  columns: { key: string; label: string; align?: 'left' | 'right'; render: (row: T) => ReactNode }[]
  rows: T[]
  keyFn: (row: T) => string | number
  onRowClick?: (row: T) => void
  selectedKey?: string | number | null
}) {
  return (
    <>
      <div className="hidden overflow-x-auto border border-edge bg-panel md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge text-left">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 micro-label ${col.align === 'right' ? 'text-right' : ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const k = keyFn(row)
              return (
                <tr
                  key={k}
                  className={`data-row cursor-pointer ${selectedKey === k ? 'data-row-active' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-4 ${col.align === 'right' ? 'text-right' : ''}`}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 md:hidden">
        {rows.map((row) => {
          const k = keyFn(row)
          return (
            <div
              key={k}
              onClick={() => onRowClick?.(row)}
              className={`cursor-pointer border p-4 ${selectedKey === k ? 'border-brand bg-brand/10' : 'border-edge bg-panel'}`}
            >
              {columns.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-3 py-1 text-sm">
                  <span className="micro-label shrink-0 pt-0.5">{col.label}</span>
                  <span className="text-right">{col.render(row)}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}
