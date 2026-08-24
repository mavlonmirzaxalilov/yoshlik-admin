import type { OrderStatus } from '../types'

interface StatusMeta {
  label: string
  dot: string
  simple: string
  dotted: string
  flat: string
}

const STATUS_MAP: Record<OrderStatus, StatusMeta> = {
  new: {
    label: 'Yangi',
    dot: 'bg-blue-600 dark:bg-blue-400',
    simple: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    dotted:
      'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    flat: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  },
  accepted: {
    label: 'Qabul qilindi',
    dot: 'bg-indigo-600 dark:bg-indigo-400',
    simple: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    dotted:
      'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
    flat: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  },
  preparing: {
    label: 'Tayyorlanmoqda',
    dot: 'bg-amber-500 dark:bg-amber-400',
    simple: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    dotted:
      'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    flat: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  ready: {
    label: 'Tayyor',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
    simple: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    dotted:
      'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    flat: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  cancelled: {
    label: 'Bekor qilingan',
    dot: 'bg-red-500 dark:bg-red-400',
    simple: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    dotted:
      'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
    flat: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  },
}

export function statusLabel(status: OrderStatus): string {
  return STATUS_MAP[status]?.label ?? status
}

interface StatusBadgeProps {
  status: OrderStatus
  variant?: 'simple' | 'dotted' | 'flat'
  className?: string
}

export function StatusBadge({ status, variant = 'simple', className }: StatusBadgeProps) {
  const meta = STATUS_MAP[status] ?? STATUS_MAP.new
  const colorClass =
    variant === 'dotted' ? meta.dotted : variant === 'flat' ? meta.flat : meta.simple

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-status-badge font-status-badge ${colorClass} ${className ?? ''}`}
    >
      {variant === 'dotted' && (
        <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      )}
      {meta.label}
    </span>
  )
}
