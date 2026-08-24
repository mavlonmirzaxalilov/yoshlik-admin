import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { ThemeToggleButton } from '../components/ThemeToggleButton'
import { Avatar } from '../components/Avatar'
import { TransactionFormModal } from '../components/TransactionFormModal'
import { formatDateLabel, formatOrderDateTime, formatSum, isToday } from '../lib/format'
import { accountIcon, accountLabel, isIncome } from '../lib/transactionMeta'
import { createTransaction, fetchTransactions, type TransactionInput } from '../lib/transactions'
import type { Transaction, TransactionType } from '../types'

const TYPE_FILTERS: { key: 'all' | TransactionType; label: string }[] = [
  { key: 'all', label: 'Hammasi' },
  { key: 'kirim', label: 'Kirim' },
  { key: 'chiqim', label: 'Chiqim' },
]

export function CashierPage() {
  const { admin } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formType, setFormType] = useState<TransactionType | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchTransactions()
      .then((data) => {
        if (!cancelled) setTransactions(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Tranzaksiyalarni yuklab bo'lmadi")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const totalBalance = useMemo(
    () =>
      transactions.reduce((sum, t) => sum + (isIncome(t.type) ? t.amount : -t.amount), 0),
    [transactions],
  )
  const todayIncome = useMemo(
    () =>
      transactions
        .filter((t) => isIncome(t.type) && isToday(t.created_at))
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions],
  )
  const todayExpense = useMemo(
    () =>
      transactions
        .filter((t) => !isIncome(t.type) && isToday(t.created_at))
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions],
  )

  const filteredTransactions = useMemo(() => {
    const term = search.trim().toLowerCase()
    return transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (term && !(t.description ?? '').toLowerCase().includes(term)) return false
      return true
    })
  }, [transactions, search, typeFilter])

  async function handleFormSubmit(input: TransactionInput) {
    const created = await createTransaction(input)
    setTransactions((prev) => [created, ...prev])
  }

  return (
    <>
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-outline-variant bg-surface px-4 py-4 dark:border-outline dark:bg-surface-container-lowest md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-surface-container-high">
            <span className="material-symbols-outlined text-primary">person</span>
          </div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Kassa</h1>
        </div>
        <ThemeToggleButton className="rounded-full p-2 text-on-surface-variant transition-opacity hover:bg-surface-container-low active:opacity-70" />
      </header>

      {/* Desktop header */}
      <header className="sticky top-0 z-30 hidden w-full items-center justify-between border-b border-outline-variant/30 bg-surface px-8 py-4 dark:bg-background md:flex">
        <div>
          <h1 className="font-headline-md text-headline-md font-semibold text-on-surface dark:text-on-background">
            Kassa
          </h1>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            {formatDateLabel()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggleButton />
          <Avatar
            name={admin?.full_name}
            className="ml-2 h-10 w-10 cursor-pointer overflow-hidden rounded-full border border-outline-variant/30 bg-primary-container flex items-center justify-center font-title-sm text-title-sm text-on-primary-container"
          />
        </div>
      </header>

      {loading && <p className="p-8 text-center text-on-surface-variant">Yuklanmoqda...</p>}
      {!loading && loadError && <p className="p-8 text-center text-error">{loadError}</p>}

      {!loading && !loadError && (
        <>
          {/* Mobile content */}
          <main className="flex flex-col gap-6 px-4 py-6 md:hidden">
            <section className="space-y-4">
              <div className="relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-[0px_1px_3px_rgba(0,0,0,0.1)]">
                <div className="absolute -right-4 -top-4 opacity-10">
                  <span
                    className="material-symbols-outlined text-[100px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    account_balance_wallet
                  </span>
                </div>
                <p className="mb-1 font-status-badge text-status-badge text-on-surface-variant">
                  Umumiy qoldiq
                </p>
                <h2 className="font-display-lg text-display-lg text-primary">
                  {formatSum(totalBalance)}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1)]">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-container">
                      <span className="material-symbols-outlined text-success">arrow_downward</span>
                    </div>
                    <p className="font-status-badge text-status-badge text-on-surface-variant">
                      Bugungi kirim
                    </p>
                  </div>
                  <p className="font-title-sm text-title-sm text-success">
                    +{formatSum(todayIncome)}
                  </p>
                </div>
                <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1)]">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-error-container">
                      <span className="material-symbols-outlined text-error">arrow_upward</span>
                    </div>
                    <p className="font-status-badge text-status-badge text-on-surface-variant">
                      Bugungi chiqim
                    </p>
                  </div>
                  <p className="font-title-sm text-title-sm text-error">
                    -{formatSum(todayExpense)}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setFormType('kirim')}
                className="flex items-center justify-center gap-2 rounded-lg bg-success px-4 py-3 font-title-sm text-title-sm text-on-primary shadow-sm transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined">add</span>
                Kirim
              </button>
              <button
                onClick={() => setFormType('chiqim')}
                className="flex items-center justify-center gap-2 rounded-lg bg-error px-4 py-3 font-title-sm text-title-sm text-on-error shadow-sm transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined">remove</span>
                Chiqim
              </button>
            </section>

            <section>
              <h3 className="mb-4 font-title-sm text-title-sm text-on-surface">Tarix</h3>
              {transactions.length === 0 && (
                <p className="py-8 text-center text-on-surface-variant">Tranzaksiyalar yo'q</p>
              )}
              <div className="space-y-2">
                {transactions.map((tx) => {
                  const income = isIncome(tx.type)
                  const { time, dayLabel } = formatOrderDateTime(tx.created_at)
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1)]"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            income ? 'bg-success-container' : 'bg-error-container'
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined ${income ? 'text-success' : 'text-error'}`}
                          >
                            {income ? 'arrow_downward' : 'arrow_upward'}
                          </span>
                        </div>
                        <div>
                          <p className="font-status-badge text-status-badge text-on-surface">
                            {tx.description ?? 'Tranzaksiya'}
                          </p>
                          <p className="font-label-caps text-label-caps text-on-surface-variant">
                            {dayLabel} {time} • {accountLabel(tx.account)}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`font-title-sm text-title-sm ${income ? 'text-success' : 'text-error'}`}
                      >
                        {income ? '+' : '-'}
                        {formatSum(tx.amount)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </section>
          </main>

          {/* Desktop content */}
          <div className="hidden flex-col gap-10 p-8 md:flex">
            <div className="flex flex-col gap-6">
              <div className="flex w-full justify-end gap-4">
                <button
                  onClick={() => setFormType('kirim')}
                  className="flex items-center gap-2 rounded-full border border-success-text/20 bg-success-bg px-6 py-2.5 font-title-sm text-title-sm text-success-text transition-colors hover:bg-success-bg/80"
                >
                  <span className="material-symbols-outlined text-sm font-bold">add</span>
                  Kirim
                </button>
                <button
                  onClick={() => setFormType('chiqim')}
                  className="flex items-center gap-2 rounded-full border border-error-text/20 bg-error-bg px-6 py-2.5 font-title-sm text-title-sm text-error-text transition-colors hover:bg-error-bg/80"
                >
                  <span className="material-symbols-outlined text-sm font-bold">remove</span>
                  Chiqim
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="relative flex flex-col gap-4 overflow-hidden rounded-card border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
                  <div className="absolute -z-10 right-0 top-0 h-32 w-32 rounded-bl-full bg-primary-container/5" />
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container/10 text-primary-container">
                      <span className="material-symbols-outlined">account_balance</span>
                    </div>
                    <h3 className="font-body-md text-body-md text-on-surface-variant">
                      Umumiy qoldiq
                    </h3>
                  </div>
                  <p className="font-display-lg text-display-lg text-primary-container">
                    {formatSum(totalBalance)}
                  </p>
                </div>

                <div className="flex flex-col gap-4 rounded-card border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-bg text-success-text">
                      <span className="material-symbols-outlined">arrow_downward</span>
                    </div>
                    <h3 className="font-body-md text-body-md text-on-surface-variant">
                      Bugungi kirim
                    </h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="font-display-lg text-display-lg text-on-surface">
                      +{formatSum(todayIncome)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 rounded-card border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error-bg text-error-text">
                      <span className="material-symbols-outlined">arrow_upward</span>
                    </div>
                    <h3 className="font-body-md text-body-md text-on-surface-variant">
                      Bugungi chiqim
                    </h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="font-display-lg text-display-lg text-on-surface">
                      -{formatSum(todayExpense)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-card border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
              <div className="flex items-center justify-between border-b border-outline-variant/30 p-6">
                <h2 className="font-title-sm text-title-sm text-on-surface">Tranzaksiyalar tarixi</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-outline-variant/70">
                      search
                    </span>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="rounded-full border border-outline-variant/30 bg-surface-bright py-2 pl-9 pr-4 font-body-md text-body-md transition-all focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container"
                      placeholder="Qidirish..."
                      type="text"
                    />
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setFilterMenuOpen((v) => !v)}
                      className="flex items-center gap-2 rounded-full border border-outline-variant/30 px-4 py-2 font-body-md text-body-md text-on-surface-variant transition-colors hover:bg-surface-container-low"
                    >
                      <span className="material-symbols-outlined text-sm">filter_list</span>
                      {TYPE_FILTERS.find((f) => f.key === typeFilter)?.label ?? 'Filtr'}
                    </button>
                    {filterMenuOpen && (
                      <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-1 shadow-lg">
                        {TYPE_FILTERS.map((f) => (
                          <button
                            key={f.key}
                            onClick={() => {
                              setTypeFilter(f.key)
                              setFilterMenuOpen(false)
                            }}
                            className={`flex w-full items-center px-4 py-2 text-left text-sm transition-colors hover:bg-surface-container-low ${
                              typeFilter === f.key ? 'font-semibold text-primary' : 'text-on-surface'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/30 bg-surface-container-low/50">
                      {['Sana', 'Tavsif', 'Turi', 'Hisob'].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-4 font-label-caps text-label-caps uppercase tracking-wider text-outline"
                        >
                          {h}
                        </th>
                      ))}
                      <th className="px-6 py-4 text-right font-label-caps text-label-caps uppercase tracking-wider text-outline">
                        Summa
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                          Tranzaksiyalar topilmadi
                        </td>
                      </tr>
                    )}
                    {filteredTransactions.map((tx) => {
                      const income = isIncome(tx.type)
                      const { time, dayLabel } = formatOrderDateTime(tx.created_at)
                      return (
                        <tr key={tx.id} className="group transition-colors hover:bg-surface-container-low/30">
                          <td className="px-6 py-4 font-body-md text-body-md text-on-surface">
                            {dayLabel}, {time}
                          </td>
                          <td className="px-6 py-4 font-body-md text-body-md font-medium text-on-surface">
                            {tx.description ?? 'Tranzaksiya'}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 font-status-badge text-status-badge ${
                                income ? 'bg-success-bg text-success-text' : 'bg-error-bg text-error-text'
                              }`}
                            >
                              {income ? 'Kirim' : 'Chiqim'}
                            </span>
                          </td>
                          <td className="flex items-center gap-2 px-6 py-4 font-body-md text-body-md text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm">
                              {accountIcon(tx.account)}
                            </span>
                            {accountLabel(tx.account)}
                          </td>
                          <td
                            className={`px-6 py-4 text-right font-body-md text-body-md font-medium ${
                              income ? 'text-success-text' : 'text-error-text'
                            }`}
                          >
                            {income ? '+' : '-'} {formatSum(tx.amount)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-outline-variant/30 p-4 font-body-md text-body-md text-on-surface-variant">
                <span>Jami {filteredTransactions.length} ta tranzaksiya</span>
              </div>
            </div>
          </div>
        </>
      )}

      <TransactionFormModal
        open={formType !== null}
        type={formType ?? 'kirim'}
        onClose={() => setFormType(null)}
        onSubmit={handleFormSubmit}
      />
    </>
  )
}
