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
    <div className="mb-8 flex flex-col gap-4 border-b border-edge pb-7 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 style={{ fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.15 }}
            className="text-[1.75rem] text-white md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
            {description}
          </p>
        )}
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
    <section className="overflow-hidden rounded-xl border border-edge bg-surface">
      {title && (
        <div className="border-b border-edge px-5 py-3.5">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</h2>
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && <div className="border-t border-edge px-5 py-3">{footer}</div>}
    </section>
  )
}

export function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-edge bg-surface p-5">
      <div className="micro-label">{label}</div>
      <div className="mt-2.5 text-2xl font-bold tracking-tight text-white">{value}</div>
      {detail && <div className="mt-1.5 text-xs" style={{ color: 'var(--text-3)' }}>{detail}</div>}
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
    <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-edge p-10 text-center">
      <div>
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-edge bg-raised">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{color:'var(--text-3)'}}>
            <circle cx="8" cy="8" r="6.5" strokeDasharray="3 2"/>
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>
          {description}
        </p>
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </div>
  )
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
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
      ? 'border-brand/30 bg-brand/10 text-brand'
      : notice.type === 'error'
        ? 'border-red-400/25 bg-red-500/10 text-red-200'
        : 'border-edge bg-raised text-zinc-300'
  return (
    <div className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${styles}`}>
      <span>{notice.message}</span>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity" aria-label="Cerrar">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 1l10 10M11 1L1 11"/>
        </svg>
      </button>
    </div>
  )
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-edge bg-surface">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex gap-4 border-t border-edge p-4 first:border-t-0">
          <div className="h-3.5 w-20 animate-pulse rounded-full bg-white/8" />
          <div className="h-3.5 flex-1 animate-pulse rounded-full bg-white/8" />
          <div className="h-3.5 w-16 animate-pulse rounded-full bg-white/8" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-edge bg-surface p-5 space-y-3.5">
      <div className="h-3 w-20 animate-pulse rounded-full bg-white/8" />
      <div className="h-6 w-2/3 animate-pulse rounded-full bg-white/8" />
      <div className="h-3 w-full animate-pulse rounded-full bg-white/8" />
      <div className="h-3 w-5/6 animate-pulse rounded-full bg-white/8" />
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
      className="btn-ghost btn-sm px-2 py-0.5 text-[11px]"
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
    info:    'border-edge bg-raised text-zinc-300',
    success: 'border-brand/25 bg-brand/8 text-brand',
    warn:    'border-amber-400/25 bg-amber-500/8 text-amber-200',
    error:   'border-red-400/25 bg-red-500/8 text-red-200',
  }
  return (
    <div className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${styles[variant]}`}>
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
    <div className="overflow-hidden rounded-xl border border-edge bg-surface">
      <div className="border-b border-edge px-5 py-3.5">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="p-5 space-y-4">
        <div className="divide-y divide-edge">
          {checks.map(({ label, value, ok }) => (
            <div key={label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span style={{ color: 'var(--text-2)' }}>{label}</span>
              <span className={`text-right font-mono text-[11px] tracking-widest uppercase ${ok === false ? 'text-red-300' : 'text-brand'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
        {summary && <div className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{summary}</div>}
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
        <li key={step.label} className="flex gap-3.5">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                step.done
                  ? 'bg-brand text-black'
                  : step.active
                    ? 'border border-brand bg-brand/15 text-brand'
                    : 'border border-edge bg-raised text-zinc-600'
              }`}
            >
              {step.done ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1.5 5l2.5 2.5L8.5 2"/>
                </svg>
              ) : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`mt-1 w-px flex-1 ${step.done ? 'bg-brand/30' : 'bg-edge'}`} style={{ minHeight: 20 }} />
            )}
          </div>
          <div className="pb-5 pt-0.5 min-w-0">
            <div className={`text-sm font-medium leading-tight ${
              step.done ? 'text-white' : step.active ? 'text-brand' : 'text-zinc-500'
            }`}>
              {step.label}
            </div>
            {step.detail && (
              <div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>
                {step.detail}
              </div>
            )}
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
      <div className="hidden overflow-x-auto border-x-0 md:block">
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
                    <td key={col.key} className={`px-4 py-3.5 ${col.align === 'right' ? 'text-right' : ''}`}>
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
              className={`cursor-pointer rounded-xl border p-4 ${
                selectedKey === k ? 'border-brand/30 bg-brand/5' : 'border-edge bg-surface'
              }`}
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
