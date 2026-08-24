import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useAuth } from '../context/AuthContext'
import { ThemeToggleButton } from '../components/ThemeToggleButton'
import { ExpenseFormModal } from '../components/ExpenseFormModal'
import { formatCompact, formatDateLabel, formatNumber, formatSum } from '../lib/format'
import {
  EXPENSE_CATEGORIES,
  createExpense,
  deleteExpense,
  expenseCategoryLabel,
  fetchExpenses,
  percentDelta,
  shiftDateStr,
  shiftMonthPrefix,
  todayDateStr,
  updateExpense,
  type ExpenseInput,
} from '../lib/expenses'
import type { Expense } from '../types'

interface CategoryMeta {
  value: string
  label: string
  icon: string
  colorClass: string
  iconBgClass: string
  legendDotClass: string
  badgeClass: string
  badgeDotClass: string
}

const CATEGORY_META: CategoryMeta[] = [
  {
    value: 'mahsulot',
    label: 'Mahsulot xaridi',
    icon: 'shopping_basket',
    colorClass: 'text-primary-container',
    iconBgClass: 'bg-primary-container/10',
    legendDotClass: 'bg-primary-container',
    badgeClass: 'bg-primary-container/10 text-primary-container',
    badgeDotClass: 'bg-primary-container',
  },
  {
    value: 'oylik',
    label: 'Oyliklar',
    icon: 'payments',
    colorClass: 'text-tertiary-container',
    iconBgClass: 'bg-tertiary-container/10',
    legendDotClass: 'bg-tertiary-container',
    badgeClass: 'bg-tertiary-container/10 text-tertiary-container',
    badgeDotClass: 'bg-tertiary-container',
  },
  {
    value: 'ijara',
    label: 'Ijara',
    icon: 'storefront',
    colorClass: 'text-secondary',
    iconBgClass: 'bg-secondary/10',
    legendDotClass: 'bg-secondary',
    badgeClass: 'bg-secondary/10 text-secondary',
    badgeDotClass: 'bg-secondary',
  },
  {
    value: 'kommunal',
    label: 'Kommunal',
    icon: 'bolt',
    colorClass: 'text-outline-variant',
    iconBgClass: 'bg-outline-variant/20',
    legendDotClass: 'bg-outline-variant',
    badgeClass: 'bg-outline-variant/20 text-on-surface-variant',
    badgeDotClass: 'bg-outline-variant',
  },
  {
    value: 'boshqa',
    label: 'Boshqa',
    icon: 'more_horiz',
    colorClass: 'text-surface-variant',
    iconBgClass: 'bg-surface-variant',
    legendDotClass: 'bg-surface-variant',
    badgeClass: 'bg-surface-variant text-on-surface-variant',
    badgeDotClass: 'bg-on-surface-variant',
  },
]

const FALLBACK_META: CategoryMeta = {
  value: 'boshqa',
  label: 'Boshqa',
  icon: 'more_horiz',
  colorClass: 'text-surface-variant',
  iconBgClass: 'bg-surface-variant',
  legendDotClass: 'bg-surface-variant',
  badgeClass: 'bg-surface-variant text-on-surface-variant',
  badgeDotClass: 'bg-on-surface-variant',
}

function categoryMeta(value: string): CategoryMeta {
  return CATEGORY_META.find((c) => c.value === value) ?? { ...FALLBACK_META, value, label: expenseCategoryLabel(value) }
}

const WEEKDAY_SHORT = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh']
const PAGE_SIZE = 5

function pieSegmentStyle(startPct: number, pct: number): CSSProperties {
  const circumference = 251.2
  const dash = (pct / 100) * circumference
  const gap = circumference - dash
  const rotation = (startPct / 100) * 360
  return {
    strokeDasharray: `${dash} ${gap}`,
    transformOrigin: 'center',
    transform: `rotate(${rotation}deg)`,
  }
}

function parseSpentAt(spentAt: string): Date {
  const [y, m, d] = spentAt.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function getPageWindow(total: number, current: number): (number | 'ellipsis')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set<number>([1, total, current - 1, current, current + 1])
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)
  const result: (number | 'ellipsis')[] = []
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push('ellipsis')
    result.push(p)
    prev = p
  }
  return result
}

function ExpenseActionsMenu({
  onEdit,
  onDelete,
  disabled,
  triggerClassName,
}: {
  onEdit: () => void
  onDelete: () => void
  disabled?: boolean
  triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={
          triggerClassName ??
          'rounded p-1 text-outline transition-colors hover:bg-primary-container/10 hover:text-primary-container disabled:pointer-events-none disabled:opacity-40'
        }
      >
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-1 shadow-lg">
          <button
            onClick={() => {
              setOpen(false)
              onEdit()
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-on-surface transition-colors hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Tahrirlash
          </button>
          <button
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-error transition-colors hover:bg-error-container/30"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            O'chirish
          </button>
        </div>
      )}
    </div>
  )
}

function CategoryFilterMenu({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const options = [{ value: 'all', label: 'Barchasi' }, ...EXPENSE_CATEGORIES]
  const activeLabel = options.find((o) => o.value === value)?.label ?? 'Barchasi'

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-outline-variant/40 px-3 py-1.5 font-body-md text-body-md text-on-surface-variant transition-colors hover:bg-surface-container-low"
      >
        <span className="material-symbols-outlined text-sm">filter_list</span>
        {value === 'all' ? 'Filtr' : activeLabel}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-1 shadow-lg">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-surface-container-low ${
                o.value === value ? 'font-semibold text-primary' : 'text-on-surface'
              }`}
            >
              {o.label}
              {o.value === value && <span className="material-symbols-outlined text-[16px]">check</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ExpensesPage() {
  const { admin } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchExpenses()
      .then((data) => {
        if (active) {
          setExpenses(data)
          setLoadError(null)
        }
      })
      .catch((err) => {
        if (active) setLoadError(err instanceof Error ? err.message : "Harajatlarni yuklab bo'lmadi")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reloadToken])

  useEffect(() => {
    setPage(1)
  }, [search, categoryFilter])

  const todayStr = todayDateStr()
  const monthPrefix = todayStr.slice(0, 7)
  const prevMonthPrefix = shiftMonthPrefix(monthPrefix, -1)
  const yesterdayStr = shiftDateStr(todayStr, -1)

  const todayTotal = useMemo(
    () => expenses.filter((e) => e.spent_at === todayStr).reduce((s, e) => s + Number(e.amount ?? 0), 0),
    [expenses, todayStr],
  )
  const yesterdayTotal = useMemo(
    () => expenses.filter((e) => e.spent_at === yesterdayStr).reduce((s, e) => s + Number(e.amount ?? 0), 0),
    [expenses, yesterdayStr],
  )

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.spent_at.slice(0, 7) === monthPrefix),
    [expenses, monthPrefix],
  )
  const monthTotal = useMemo(
    () => monthExpenses.reduce((s, e) => s + Number(e.amount ?? 0), 0),
    [monthExpenses],
  )
  const prevMonthTotal = useMemo(
    () =>
      expenses
        .filter((e) => e.spent_at.slice(0, 7) === prevMonthPrefix)
        .reduce((s, e) => s + Number(e.amount ?? 0), 0),
    [expenses, prevMonthPrefix],
  )

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>()
    for (const e of monthExpenses) {
      totals.set(e.category, (totals.get(e.category) ?? 0) + Number(e.amount ?? 0))
    }
    return totals
  }, [monthExpenses])

  const categoryBreakdown = useMemo(
    () =>
      CATEGORY_META.map((meta) => {
        const amount = categoryTotals.get(meta.value) ?? 0
        const pct = monthTotal > 0 ? Math.round((amount / monthTotal) * 100) : 0
        return { ...meta, amount, pct }
      }),
    [categoryTotals, monthTotal],
  )

  const monthDelta = percentDelta(monthTotal, prevMonthTotal)
  const todayDelta = percentDelta(todayTotal, yesterdayTotal)

  const weekBars = useMemo(() => {
    const days = Array.from({ length: 6 }, (_, i) => shiftDateStr(todayStr, i - 5))
    const totals = days.map((dateStr) => ({
      dateStr,
      sum: expenses.filter((e) => e.spent_at === dateStr).reduce((s, e) => s + Number(e.amount ?? 0), 0),
    }))
    const max = Math.max(1, ...totals.map((t) => t.sum))
    return totals.map(({ dateStr, sum }) => {
      const dow = parseSpentAt(dateStr).getDay()
      return {
        key: dateStr,
        label: WEEKDAY_SHORT[dow],
        tooltip: `${formatDateLabel(parseSpentAt(dateStr))}: ${formatCompact(sum)}`,
        heightPct: Math.max(4, Math.round((sum / max) * 100)),
        active: dateStr === todayStr,
      }
    })
  }, [expenses, todayStr])

  const filteredExpenses = useMemo(() => {
    const term = search.trim().toLowerCase()
    return expenses.filter((e) => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false
      if (!term) return true
      const label = expenseCategoryLabel(e.category).toLowerCase()
      return label.includes(term) || (e.description ?? '').toLowerCase().includes(term)
    })
  }, [expenses, search, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pagedExpenses = filteredExpenses.slice(pageStart, pageStart + PAGE_SIZE)
  const pageWindow = getPageWindow(totalPages, currentPage)

  function openCreateForm() {
    setEditingExpense(null)
    setFormOpen(true)
  }

  function openEditForm(expense: Expense) {
    setEditingExpense(expense)
    setFormOpen(true)
  }

  async function handleFormSubmit(input: ExpenseInput) {
    if (editingExpense) {
      await updateExpense(editingExpense.id, input)
    } else {
      await createExpense(input, admin?.telegram_id != null ? Number(admin.telegram_id) : null)
    }
    setReloadToken((t) => t + 1)
  }

  async function handleDelete(expense: Expense) {
    if (!window.confirm("Rostdan o'chirasizmi?")) return
    setDeletingId(expense.id)
    try {
      await deleteExpense(expense)
      setReloadToken((t) => t + 1)
    } catch {
      window.alert("Harajatni o'chirib bo'lmadi. Qayta urinib ko'ring.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-outline-variant bg-surface px-4 py-4 md:hidden">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined cursor-pointer text-on-surface-variant transition-opacity active:opacity-70">
            arrow_back
          </span>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Harajatlar</h1>
        </div>
        <ThemeToggleButton className="cursor-pointer rounded-full p-2 text-on-surface-variant transition-opacity hover:bg-surface-container-low active:opacity-70" />
      </header>

      {/* Desktop header */}
      <header className="sticky top-0 z-30 hidden w-full items-center justify-between border-b border-outline-variant/30 bg-surface px-8 py-4 md:flex">
        <div>
          <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">
            Harajatlar
          </h2>
          <p className="mt-1 font-label-caps text-label-caps text-on-surface-variant">
            {formatDateLabel(new Date())}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggleButton />
          <button className="relative flex h-10 w-10 scale-95 items-center justify-center rounded-full text-on-surface-variant transition-transform hover:bg-surface-container-low active:scale-90">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
          </button>
          <button
            onClick={openCreateForm}
            className="ml-2 flex items-center gap-2 rounded-lg bg-primary-container px-4 py-2 text-on-primary-container shadow-sm transition-colors hover:bg-primary-container/90"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="font-body-md text-body-md font-medium">Yangi harajat</span>
          </button>
        </div>
      </header>

      {loadError && (
        <p className="mx-4 mt-4 rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container md:mx-8">
          {loadError}
        </p>
      )}

      {/* Mobile content */}
      <main className="px-4 py-6 md:hidden">
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1),_0px_1px_2px_rgba(0,0,0,0.06)]">
            <p className="mb-1 font-body-md text-sm text-on-surface-variant">Oylik harajat</p>
            <h2 className="font-title-sm text-title-sm text-on-surface">{formatCompact(monthTotal)}</h2>
          </div>
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1),_0px_1px_2px_rgba(0,0,0,0.06)]">
            <p className="mb-1 font-body-md text-sm text-on-surface-variant">Bugun</p>
            <h2 className="font-title-sm text-title-sm text-on-surface">{formatSum(todayTotal)}</h2>
          </div>
        </div>
        <button
          onClick={openCreateForm}
          className="mb-8 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-title-sm text-title-sm text-on-primary transition-colors hover:bg-primary-fixed-dim"
        >
          <span className="material-symbols-outlined">add</span>
          Yangi harajat
        </button>
        <div className="mb-8">
          <h3 className="mb-4 font-title-sm text-title-sm text-on-surface">
            Kategoriyalar bo'yicha
          </h3>
          <div className="flex flex-col gap-3">
            {CATEGORY_META.map((cat) => (
              <div
                key={cat.value}
                className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-lowest p-3"
              >
                <span className="font-body-md text-on-surface-variant">{cat.label}</span>
                <span className="font-title-sm text-title-sm">
                  {formatSum(categoryTotals.get(cat.value) ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-4 font-title-sm text-title-sm text-on-surface">So'nggi harajatlar</h3>
          {loading ? (
            <p className="py-6 text-center font-body-md text-body-md text-on-surface-variant">Yuklanmoqda...</p>
          ) : expenses.length === 0 ? (
            <p className="py-6 text-center font-body-md text-body-md text-on-surface-variant">
              Hozircha harajatlar yo'q
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {expenses.slice(0, 20).map((exp) => {
                const meta = categoryMeta(exp.category)
                return (
                  <div
                    key={exp.id}
                    className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1),_0px_1px_2px_rgba(0,0,0,0.06)]"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className={`rounded px-2 py-1 font-label-caps text-label-caps ${meta.badgeClass}`}>
                          {meta.label}
                        </span>
                        <p className="mt-2 truncate font-body-md text-on-surface">
                          {exp.description || meta.label}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-1">
                        <span className="font-title-sm text-title-sm text-error">
                          - {formatSum(exp.amount)}
                        </span>
                        <ExpenseActionsMenu
                          disabled={deletingId === exp.id}
                          onEdit={() => openEditForm(exp)}
                          onDelete={() => handleDelete(exp)}
                          triggerClassName="rounded p-1 text-outline transition-colors hover:bg-primary-container/10 hover:text-primary-container"
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-right font-body-md text-sm text-on-surface-variant">
                      {exp.spent_at === todayStr ? 'Bugun' : formatDateLabel(parseSpentAt(exp.spent_at))}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Desktop content */}
      <main className="hidden flex-1 flex-col gap-10 px-8 py-8 md:flex">
        {/* Summary cards */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)]">
            <div className="absolute -right-4 -top-4 z-0 h-24 w-24 rounded-full bg-error/5" />
            <div className="z-10 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
                <span className="material-symbols-outlined text-error">account_balance_wallet</span>
              </div>
              <span className="rounded bg-surface-variant px-2 py-1 font-label-caps text-label-caps text-on-surface-variant">
                OYLIK
              </span>
            </div>
            <div className="z-10 mt-4">
              <h3 className="mb-1 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                Oylik harajat
              </h3>
              <p className="font-display-lg text-display-lg font-bold text-on-surface">
                {formatNumber(monthTotal)}{' '}
                <span className="font-title-sm text-title-sm font-normal text-on-surface-variant">
                  so'm
                </span>
              </p>
            </div>
            <div className="z-10 mt-4 flex items-center gap-1">
              <span
                className={`material-symbols-outlined text-sm ${
                  monthDelta.up ? 'text-error' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {monthDelta.up ? 'trending_up' : 'trending_down'}
              </span>
              <span
                className={`rounded px-2 py-0.5 font-status-badge text-status-badge ${
                  monthDelta.up
                    ? 'bg-error/10 text-error'
                    : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                }`}
              >
                {monthDelta.up ? '+' : ''}
                {monthDelta.pct}%
              </span>
              <span className="ml-2 font-label-caps text-label-caps text-outline">
                o'tgan oyga nisbatan
              </span>
            </div>
          </div>

          <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)]">
            <div className="absolute -right-4 -top-4 z-0 h-24 w-24 rounded-full bg-primary-container/5" />
            <div className="z-10 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container/10">
                <span className="material-symbols-outlined text-primary-container">today</span>
              </div>
              <span className="rounded bg-surface-variant px-2 py-1 font-label-caps text-label-caps text-on-surface-variant">
                KUNLIK
              </span>
            </div>
            <div className="z-10 mt-4">
              <h3 className="mb-1 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                Bugun
              </h3>
              <p className="font-display-lg text-display-lg font-bold text-on-surface">
                {formatNumber(todayTotal)}{' '}
                <span className="font-title-sm text-title-sm font-normal text-on-surface-variant">
                  so'm
                </span>
              </p>
            </div>
            <div className="z-10 mt-4 flex items-center gap-1">
              <span
                className={`material-symbols-outlined text-sm ${
                  todayDelta.up ? 'text-error' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {todayDelta.up ? 'trending_up' : 'trending_down'}
              </span>
              <span
                className={`rounded px-2 py-0.5 font-status-badge text-status-badge ${
                  todayDelta.up
                    ? 'bg-error/10 text-error'
                    : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                }`}
              >
                {todayDelta.up ? '+' : ''}
                {todayDelta.pct}%
              </span>
              <span className="ml-2 font-label-caps text-label-caps text-outline">kechaga nisbatan</span>
            </div>
          </div>

          <div className="flex h-full flex-col justify-between rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)] lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-title-sm text-title-sm font-semibold text-on-surface">
                Harajatlar dinamikasi
              </h3>
            </div>
            <div className="relative mt-2 flex h-24 w-full flex-1 items-end justify-between gap-2 border-b border-outline-variant/20 pb-2">
              <div className="pointer-events-none absolute inset-0 z-0 flex flex-col justify-between">
                <div className="w-full border-t border-outline-variant/10" />
                <div className="w-full border-t border-outline-variant/10" />
                <div className="w-full border-t border-outline-variant/10" />
              </div>
              {weekBars.map((bar) => (
                <div
                  key={bar.key}
                  className={`group relative z-10 w-1/6 cursor-pointer rounded-t-sm transition-colors ${
                    bar.active ? 'bg-primary-container' : 'bg-primary-fixed-dim hover:bg-primary'
                  }`}
                  style={{ height: `${bar.heightPct}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-inverse-surface px-2 py-1 text-xs text-inverse-on-surface opacity-0 transition-opacity group-hover:opacity-100">
                    {bar.tooltip}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-medium text-outline">
              {weekBars.map((bar) => (
                <span key={bar.key}>{bar.label}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Breakdown */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)] lg:col-span-1">
            <h3 className="mb-6 font-title-sm text-title-sm font-semibold text-on-surface">
              Kategoriyalar bo'yicha
            </h3>
            <div className="relative mx-auto h-48 w-48 flex-shrink-0">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                {(() => {
                  let cursor = 0
                  return categoryBreakdown.map((cat) => {
                    const style = pieSegmentStyle(cursor, cat.pct)
                    cursor += cat.pct
                    return (
                      <circle
                        key={cat.value}
                        className={`stroke-current transition-all duration-300 hover:opacity-80 ${cat.colorClass}`}
                        cx="50"
                        cy="50"
                        fill="transparent"
                        r="40"
                        strokeWidth="20"
                        style={style}
                      />
                    )
                  })
                })()}
              </svg>
              <div className="absolute inset-0 m-auto flex h-24 w-24 flex-col items-center justify-center rounded-full bg-surface-container-lowest shadow-inner">
                <span className="font-label-caps text-label-caps text-outline">Jami</span>
                <span className="font-body-md text-body-md font-bold text-on-surface">
                  {formatCompact(monthTotal)}
                </span>
              </div>
            </div>
            <div className="mt-6 flex flex-1 flex-col justify-center space-y-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat.value} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${cat.legendDotClass}`} />
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      {cat.label}
                    </span>
                  </div>
                  <span className="font-medium">{cat.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-2">
            {categoryBreakdown.slice(0, 3).map((cat) => (
              <div
                key={cat.value}
                className="group cursor-pointer rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)] transition-colors hover:border-primary-container/30"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${cat.iconBgClass} ${cat.colorClass}`}
                  >
                    <span className="material-symbols-outlined">{cat.icon}</span>
                  </div>
                  <h4 className="font-title-sm text-title-sm font-medium text-on-surface">
                    {cat.label}
                  </h4>
                </div>
                <p className="font-display-lg text-display-lg font-bold text-on-surface">
                  {formatNumber(cat.amount)}{' '}
                  <span className="font-body-md text-body-md font-normal text-outline">so'm</span>
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-variant">
                  <div
                    className={cat.legendDotClass + ' h-full rounded-full'}
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="grid grid-rows-2 gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)]">
              {categoryBreakdown.slice(3, 5).map((cat, idx) => (
                <div key={cat.value}>
                  <div className="group -m-2 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-surface-container-low">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-md ${cat.iconBgClass} ${cat.colorClass}`}>
                        <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                      </div>
                      <span className="font-body-md text-body-md font-medium text-on-surface">
                        {cat.label}
                      </span>
                    </div>
                    <span className="font-body-md text-body-md font-semibold text-on-surface">
                      {formatCompact(cat.amount)} so'm
                    </span>
                  </div>
                  {idx === 0 && <div className="mt-4 border-t border-outline-variant/20" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Expenses table */}
        <section className="overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between border-b border-outline-variant/20 p-6">
            <h3 className="font-title-sm text-title-sm font-semibold text-on-surface">
              Barcha harajatlar
            </h3>
            <div className="flex gap-2">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-outline">
                  search
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-48 rounded-lg border border-outline-variant/40 bg-surface py-1.5 pl-9 pr-4 font-body-md text-body-md outline-none transition-all focus:border-primary-container focus:ring-2 focus:ring-primary-container"
                  placeholder="Qidirish..."
                  type="text"
                />
              </div>
              <CategoryFilterMenu value={categoryFilter} onChange={setCategoryFilter} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface/50 font-label-caps text-label-caps uppercase tracking-wider text-outline">
                  <th className="p-4 font-semibold">Sana</th>
                  <th className="p-4 font-semibold">Kategoriya</th>
                  <th className="p-4 font-semibold">Tavsif</th>
                  <th className="p-4 text-right font-semibold">Summa</th>
                  <th className="p-4 text-center font-semibold">Harakat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 font-body-md text-body-md text-on-surface">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                      Yuklanmoqda...
                    </td>
                  </tr>
                ) : pagedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                      Harajatlar topilmadi
                    </td>
                  </tr>
                ) : (
                  pagedExpenses.map((exp) => {
                    const meta = categoryMeta(exp.category)
                    return (
                      <tr key={exp.id} className="group transition-colors hover:bg-surface-container-low/50">
                        <td className="whitespace-nowrap p-4">
                          <span>{formatDateLabel(parseSpentAt(exp.spent_at))}</span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium ${meta.badgeClass}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.badgeDotClass}`} />
                            {meta.label}
                          </span>
                        </td>
                        <td className="p-4 text-on-surface-variant">{exp.description || '—'}</td>
                        <td className="p-4 text-right font-medium text-on-surface">{formatSum(exp.amount)}</td>
                        <td className="p-4 text-center">
                          <ExpenseActionsMenu
                            disabled={deletingId === exp.id}
                            onEdit={() => openEditForm(exp)}
                            onDelete={() => handleDelete(exp)}
                            triggerClassName="rounded p-1 text-outline opacity-0 transition-colors hover:bg-primary-container/10 hover:text-primary-container group-hover:opacity-100"
                          />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-outline-variant/20 p-4 text-sm text-outline">
            <span>
              {filteredExpenses.length === 0
                ? '0 ta natija'
                : `${pageStart + 1}-${Math.min(pageStart + PAGE_SIZE, filteredExpenses.length)} dan ${filteredExpenses.length} ta natija ko'rsatilmoqda`}
            </span>
            <div className="flex gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded hover:bg-surface-container-low disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              {pageWindow.map((p, idx) =>
                p === 'ellipsis' ? (
                  <span key={`e-${idx}`} className="flex h-8 w-8 items-center justify-center">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded font-medium ${
                      p === currentPage
                        ? 'bg-primary-container text-on-primary-container'
                        : 'text-on-surface hover:bg-surface-container-low'
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-8 w-8 items-center justify-center rounded hover:bg-surface-container-low disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <ExpenseFormModal
        open={formOpen}
        initial={editingExpense}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </>
  )
}
