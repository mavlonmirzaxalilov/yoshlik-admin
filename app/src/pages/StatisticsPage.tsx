import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ThemeToggleButton } from '../components/ThemeToggleButton'
import { formatCompact, formatSum } from '../lib/format'
import {
  addDays,
  aggregateOrderCountsByDay,
  fetchDailySales,
  fetchExpensesByCategory,
  fetchOrdersInRange,
  fetchPopularItemsForOrders,
  fetchRangeTotals,
  percentDelta,
  previousRange,
  rangeForCustom,
  rangeForQuickPeriod,
  shortDateLabel,
  sumTransactionsByType,
  type CategorySlice,
  type DailyPoint,
  type DateRange,
  type PopularItem,
  type QuickPeriod,
  type RangeTotals,
} from '../lib/statistics'

const QUICK_PERIODS: { key: Exclude<QuickPeriod, 'custom'>; label: string }[] = [
  { key: 'today', label: 'Bugun' },
  { key: 'week', label: 'Hafta' },
  { key: 'month', label: 'Oy' },
]

const EMPTY_TOTALS: RangeTotals = { income: 0, expense: 0, ordersCount: 0 }

const CATEGORY_COLORS: Record<string, string> = {
  mahsulot: 'rgb(var(--color-primary-container))',
  oylik: 'rgb(var(--color-tertiary-container))',
  ijara: 'rgb(var(--color-secondary))',
  kommunal: 'rgb(var(--color-outline-variant))',
  boshqa: 'rgb(var(--color-success))',
}
const FALLBACK_CATEGORY_COLOR = 'rgb(var(--color-surface-variant))'

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: 'rgb(var(--color-inverse-surface))',
    border: 'none',
    borderRadius: 8,
    padding: '8px 12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  labelStyle: { color: 'rgb(var(--color-inverse-on-surface))', fontSize: 12, marginBottom: 4 },
  itemStyle: { color: 'rgb(var(--color-inverse-on-surface))', fontSize: 12, fontWeight: 600 },
} as const

function SalesLineChart({ data, height }: { data: DailyPoint[]; height: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="statSalesGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--color-primary-container))" stopOpacity={0.25} />
            <stop offset="100%" stopColor="rgb(var(--color-primary-container))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgb(var(--color-outline-variant))" strokeOpacity={0.4} vertical={false} strokeDasharray="4 4" />
        <XAxis
          dataKey="label"
          tick={{ fill: 'rgb(var(--color-outline))', fontSize: 11 }}
          axisLine={{ stroke: 'rgb(var(--color-outline-variant))' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: 'rgb(var(--color-outline))', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => formatCompact(v)}
          width={44}
        />
        <Tooltip formatter={(value) => [formatSum(Number(value ?? 0)), 'Savdo']} {...TOOLTIP_STYLE} />
        <Area type="monotone" dataKey="value" stroke="none" fill="url(#statSalesGradient)" />
        <Line
          type="monotone"
          dataKey="value"
          stroke="rgb(var(--color-primary-container))"
          strokeWidth={2.5}
          dot={{ r: 3, fill: 'rgb(var(--color-primary-container))', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

function OrdersBarChart({ data, height }: { data: DailyPoint[]; height: number }) {
  const maxVal = Math.max(0, ...data.map((d) => d.value))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="rgb(var(--color-outline-variant))" strokeOpacity={0.4} vertical={false} strokeDasharray="4 4" />
        <XAxis
          dataKey="label"
          tick={{ fill: 'rgb(var(--color-outline))', fontSize: 11 }}
          axisLine={{ stroke: 'rgb(var(--color-outline-variant))' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: 'rgb(var(--color-outline))', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <Tooltip
          formatter={(value) => [`${Number(value ?? 0)} ta`, 'Buyurtmalar']}
          cursor={{ fill: 'rgb(var(--color-outline-variant))', opacity: 0.15 }}
          {...TOOLTIP_STYLE}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((d) => (
            <Cell
              key={d.key}
              fill={maxVal > 0 && d.value === maxVal ? 'rgb(var(--color-primary-container))' : 'rgb(var(--color-secondary-container))'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function ExpensesDonutChart({ data, height }: { data: CategorySlice[]; height: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius="62%"
          outerRadius="95%"
          paddingAngle={data.length > 1 ? 2 : 0}
          stroke="none"
        >
          {data.map((c) => (
            <Cell key={c.category} fill={CATEGORY_COLORS[c.category] ?? FALLBACK_CATEGORY_COLOR} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name, item) => [formatSum(Number(value ?? 0)), item?.payload?.label ?? name]}
          {...TOOLTIP_STYLE}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

function PopularItemsList({ items, loading }: { items: PopularItem[]; loading: boolean }) {
  if (loading) {
    return <p className="py-6 text-center font-body-md text-body-md text-on-surface-variant">Yuklanmoqda...</p>
  }
  if (items.length === 0) {
    return <p className="py-6 text-center font-body-md text-body-md text-on-surface-variant">Ma'lumot yo'q</p>
  }
  const maxQty = items[0].totalQuantity || 1
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, idx) => {
        const pct = Math.max(4, Math.round((item.totalQuantity / maxQty) * 100))
        return (
          <div key={item.product_name} className="flex items-center gap-3">
            <span
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-label-caps text-[11px] font-bold ${
                idx === 0
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-variant text-on-surface-variant'
              }`}
            >
              {idx + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate font-body-md text-body-md text-on-surface">
                  {item.product_name}
                </span>
                <span className="flex-shrink-0 font-title-sm text-title-sm text-on-surface">
                  {item.totalQuantity} ta
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-variant">
                <div
                  className="h-full rounded-full bg-primary-container"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function StatisticsPage() {
  const [quickPeriod, setQuickPeriod] = useState<QuickPeriod>('week')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [showMobileCustomRange, setShowMobileCustomRange] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  // Sana kiritish tugagach so'rov yubormoqchimiz — har harf/klik uchun
  // qayta so'rov yubormaslik uchun 400ms debounce.
  const [debouncedCustomStart, setDebouncedCustomStart] = useState('')
  const [debouncedCustomEnd, setDebouncedCustomEnd] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCustomStart(customStart)
      setDebouncedCustomEnd(customEnd)
    }, 400)
    return () => clearTimeout(timer)
  }, [customStart, customEnd])

  const range = useMemo<DateRange>(() => {
    if (quickPeriod === 'custom') {
      const custom = rangeForCustom(debouncedCustomStart, debouncedCustomEnd)
      if (custom) return custom
    }
    return rangeForQuickPeriod(quickPeriod === 'custom' ? 'week' : quickPeriod)
  }, [quickPeriod, debouncedCustomStart, debouncedCustomEnd])

  const [loading, setLoading] = useState(true)
  const [dailySales, setDailySales] = useState<DailyPoint[]>([])
  const [dailyOrders, setDailyOrders] = useState<DailyPoint[]>([])
  const [popularItems, setPopularItems] = useState<PopularItem[]>([])
  const [expenseCategories, setExpenseCategories] = useState<CategorySlice[]>([])
  const [totals, setTotals] = useState<RangeTotals>(EMPTY_TOTALS)
  const [prevTotals, setPrevTotals] = useState<RangeTotals>(EMPTY_TOTALS)
  const [prevExpensesTotal, setPrevExpensesTotal] = useState(0)

  const rangeStartMs = range.start.getTime()
  const rangeEndMs = range.end.getTime()

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const activeRange: DateRange = { start: new Date(rangeStartMs), end: new Date(rangeEndMs) }
      const prevRange = previousRange(activeRange)
      try {
        // 'orders' jadvali shu range uchun faqat bitta marta so'raladi —
        // undan kunlik grafik, jami buyurtmalar soni va ommabop taomlar
        // (order_items) uchun ID'lar birgalikda qayta ishlatiladi.
        const ordersPromise = fetchOrdersInRange(activeRange)
        const popularPromise = ordersPromise.then((rows) =>
          fetchPopularItemsForOrders(
            rows.map((r) => r.id),
            10,
          ),
        )

        const [sales, orders, popular, expCats, prevExpCats, expenseTotal, prevTot] = await Promise.all([
          fetchDailySales(activeRange),
          ordersPromise,
          popularPromise,
          fetchExpensesByCategory(activeRange),
          fetchExpensesByCategory(prevRange),
          sumTransactionsByType('chiqim', activeRange),
          fetchRangeTotals(prevRange),
        ])
        if (cancelled) return

        // Jami savdo va buyurtmalar soni allaqachon yuklangan kunlik
        // ma'lumotdan hisoblanadi — 'transactions' va 'orders' jadvallariga
        // qo'shimcha so'rov yubormaydi.
        const income = sales.reduce((sum, p) => sum + p.value, 0)
        const dailyOrdersPoints = aggregateOrderCountsByDay(orders, activeRange)

        setDailySales(sales)
        setDailyOrders(dailyOrdersPoints)
        setPopularItems(popular)
        setExpenseCategories(expCats)
        setPrevExpensesTotal(prevExpCats.reduce((sum, c) => sum + c.amount, 0))
        setTotals({ income, expense: expenseTotal, ordersCount: orders.length })
        setPrevTotals(prevTot)
      } catch (err) {
        console.error("Statistikani yuklab bo'lmadi:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [rangeStartMs, rangeEndMs, reloadToken])

  const totalExpenses = useMemo(
    () => expenseCategories.reduce((sum, c) => sum + c.amount, 0),
    [expenseCategories],
  )
  const netProfit = totals.income - totals.expense
  const prevNetProfit = prevTotals.income - prevTotals.expense

  const summary = useMemo(() => {
    const salesDelta = percentDelta(totals.income, prevTotals.income)
    const ordersDelta = percentDelta(totals.ordersCount, prevTotals.ordersCount)
    const profitDelta = percentDelta(netProfit, prevNetProfit)
    const expensesDelta = percentDelta(totalExpenses, prevExpensesTotal)

    return [
      {
        key: 'sales',
        label: 'Jami savdo',
        value: formatSum(totals.income),
        icon: 'payments',
        iconBg: 'bg-primary-container/10',
        iconColor: 'text-primary-container',
        blobBg: 'bg-primary-container/5',
        ...salesDelta,
      },
      {
        key: 'orders',
        label: 'Jami buyurtmalar',
        value: `${totals.ordersCount} ta`,
        icon: 'receipt_long',
        iconBg: 'bg-secondary-container/50',
        iconColor: 'text-primary',
        blobBg: 'bg-secondary-container/20',
        ...ordersDelta,
      },
      {
        key: 'profit',
        label: 'Sof foyda',
        value: formatSum(netProfit),
        icon: 'account_balance_wallet',
        iconBg: 'bg-tertiary-container/10',
        iconColor: 'text-tertiary-container',
        blobBg: 'bg-tertiary-container/5',
        ...profitDelta,
      },
      {
        key: 'expenses',
        label: 'Jami harajat',
        value: formatSum(totalExpenses),
        icon: 'account_balance',
        iconBg: 'bg-surface-variant',
        iconColor: 'text-primary-container',
        blobBg: 'bg-surface-variant',
        ...expensesDelta,
      },
    ]
  }, [totals, prevTotals, netProfit, prevNetProfit, totalExpenses, prevExpensesTotal])

  const rangeLabel = useMemo(
    () => `${shortDateLabel(range.start)} — ${shortDateLabel(addDays(range.end, -1))}`,
    [range],
  )

  const handleQuickPeriod = (period: Exclude<QuickPeriod, 'custom'>) => {
    setQuickPeriod(period)
  }

  const handleCustomStart = (value: string) => {
    setCustomStart(value)
    setQuickPeriod('custom')
  }

  const handleCustomEnd = (value: string) => {
    setCustomEnd(value)
    setQuickPeriod('custom')
  }

  return (
    <>
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex w-full items-center justify-between bg-surface px-4 py-4 shadow-sm md:hidden">
        <div className="flex items-center gap-3">
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            Statistika
          </h1>
        </div>
        <button
          onClick={() => setShowMobileCustomRange((v) => !v)}
          className="flex items-center justify-center rounded-full p-2 transition-opacity hover:bg-surface-container-low active:opacity-70"
        >
          <span className="material-symbols-outlined text-on-surface-variant">filter_list</span>
        </button>
      </header>

      {/* Desktop header */}
      <header className="sticky top-0 z-30 hidden w-full items-center justify-between border-b border-outline-variant/30 bg-surface px-8 py-4 md:flex">
        <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">
          Statistika
        </h2>
        <div className="flex items-center gap-3">
          <ThemeToggleButton className="rounded-full p-2 text-on-surface-variant transition-transform scale-95 active:scale-90 hover:bg-surface-container-low" />
          <button className="relative rounded-full p-2 text-on-surface-variant transition-transform scale-95 active:scale-90 hover:bg-surface-container-low">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-surface bg-error" />
          </button>
        </div>
      </header>

      {/* Mobile content */}
      <main className="flex flex-col gap-6 px-4 py-4 md:hidden">
        <section className="flex flex-col gap-3 rounded-lg border border-outline-variant/30 bg-surface-container-low p-1 shadow-[0px_1px_3px_rgba(0,0,0,0.1),_0px_1px_2px_rgba(0,0,0,0.06)]">
          <div className="flex">
            {QUICK_PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => handleQuickPeriod(p.key)}
                className={`flex-1 rounded-md py-2 text-center font-status-badge text-status-badge transition-colors ${
                  quickPeriod === p.key
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {showMobileCustomRange && (
            <div className="flex items-center gap-2 px-2 pb-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => handleCustomStart(e.target.value)}
                className="w-full rounded-md border border-outline-variant/50 bg-surface px-2 py-1.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <span className="text-on-surface-variant">—</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => handleCustomEnd(e.target.value)}
                className="w-full rounded-md border border-outline-variant/50 bg-surface px-2 py-1.5 font-body-md text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
        </section>

        <p className="-mt-3 text-center font-label-caps text-label-caps text-on-surface-variant">
          Tanlangan davr: {rangeLabel}
        </p>

        <section className="grid grid-cols-2 gap-4">
          {summary.map((card) => (
            <div
              key={card.key}
              className="flex flex-col gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1),_0px_1px_2px_rgba(0,0,0,0.06)]"
            >
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container/50">
                  <span className="material-symbols-outlined text-sm text-on-surface-variant">
                    {card.icon}
                  </span>
                </div>
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                  {card.label}
                </span>
              </div>
              <h3 className="font-title-sm text-title-sm text-on-surface">{card.value}</h3>
              <div className="mt-auto flex items-center gap-1">
                <span
                  className={`material-symbols-outlined text-[14px] ${card.up ? 'text-success' : 'text-error'}`}
                >
                  {card.up ? 'trending_up' : 'trending_down'}
                </span>
                <span
                  className={`font-status-badge text-status-badge ${card.up ? 'text-success' : 'text-error'}`}
                >
                  {card.up ? '+' : ''}
                  {card.pct}%
                </span>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1),_0px_1px_2px_rgba(0,0,0,0.06)]">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-title-sm text-title-sm text-on-surface">Savdo dinamikasi</h2>
          </div>
          <p className="mb-2 font-label-caps text-label-caps text-on-surface-variant">
            Jami savdo: <span className="font-bold text-on-surface">{formatSum(totals.income)}</span>
          </p>
          {loading ? (
            <p className="py-10 text-center font-body-md text-body-md text-on-surface-variant">Yuklanmoqda...</p>
          ) : (
            <SalesLineChart data={dailySales} height={200} />
          )}
        </section>

        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1),_0px_1px_2px_rgba(0,0,0,0.06)]">
          <h2 className="mb-1 font-title-sm text-title-sm text-on-surface">
            Kunlik buyurtmalar
          </h2>
          <p className="mb-2 font-label-caps text-label-caps text-on-surface-variant">
            Jami buyurtmalar: <span className="font-bold text-on-surface">{totals.ordersCount} ta</span>
          </p>
          {loading ? (
            <p className="py-10 text-center font-body-md text-body-md text-on-surface-variant">Yuklanmoqda...</p>
          ) : (
            <OrdersBarChart data={dailyOrders} height={180} />
          )}
        </section>

        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1),_0px_1px_2px_rgba(0,0,0,0.06)]">
          <h2 className="mb-4 font-title-sm text-title-sm text-on-surface">Ommabop taomlar</h2>
          <PopularItemsList items={popularItems} loading={loading} />
        </section>

        <section className="flex flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1),_0px_1px_2px_rgba(0,0,0,0.06)]">
          <h2 className="mb-2 font-title-sm text-title-sm text-on-surface">
            Harajatlar tahlili
          </h2>
          <p className="mb-2 font-label-caps text-label-caps text-on-surface-variant">
            Jami harajat: <span className="font-bold text-on-surface">{formatSum(totalExpenses)}</span>
          </p>
          {loading ? (
            <p className="py-10 text-center font-body-md text-body-md text-on-surface-variant">Yuklanmoqda...</p>
          ) : expenseCategories.length === 0 ? (
            <p className="py-10 text-center font-body-md text-body-md text-on-surface-variant">Ma'lumot yo'q</p>
          ) : (
            <div className="flex flex-1 items-center justify-center gap-4 py-2">
              <div className="relative h-24 w-24 flex-shrink-0">
                <ExpensesDonutChart data={expenseCategories} height={96} />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-label-caps text-[10px] text-outline">Jami</span>
                  <span className="font-title-sm text-sm font-bold text-on-surface">
                    {formatCompact(totalExpenses)}
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {expenseCategories.map((c) => (
                  <div key={c.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[c.category] ?? FALLBACK_CATEGORY_COLOR }}
                      />
                      <span className="font-status-badge text-[11px] text-on-surface-variant">
                        {c.label}
                      </span>
                    </div>
                    <span className="font-status-badge text-[11px] font-bold text-on-surface">
                      {c.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Desktop content */}
      <main className="hidden flex-1 flex-col gap-10 px-8 py-8 md:flex">
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:flex-wrap">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-outline-variant/50 bg-surface p-1">
              {QUICK_PERIODS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => handleQuickPeriod(p.key)}
                  className={`rounded-md px-4 py-1.5 font-body-md text-body-md font-medium transition-colors ${
                    quickPeriod === p.key
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                calendar_today
              </span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => handleCustomStart(e.target.value)}
                className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-1.5 font-body-md text-body-md text-on-surface outline-none focus:border-transparent focus:ring-2 focus:ring-primary-container"
              />
              <span className="text-on-surface-variant">—</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => handleCustomEnd(e.target.value)}
                className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-1.5 font-body-md text-body-md text-on-surface outline-none focus:border-transparent focus:ring-2 focus:ring-primary-container"
              />
            </div>
            <span className="font-label-caps text-label-caps text-on-surface-variant">
              {rangeLabel}
            </span>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-outline-variant/50 bg-surface px-4 py-2 font-body-md text-body-md font-medium text-on-surface transition-colors hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-[20px]">download</span>
              Eksport
            </button>
            <button
              onClick={() => setReloadToken((t) => t + 1)}
              className="flex items-center gap-2 rounded-lg bg-primary-container px-4 py-2 font-body-md text-body-md font-medium text-on-primary-container shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)] transition-colors hover:bg-primary"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              Yangilash
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-card-gap md:grid-cols-2 lg:grid-cols-4">
          {summary.map((card) => (
            <div
              key={card.key}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)] transition-colors hover:border-primary-container/30"
            >
              <div
                className={`absolute -mr-4 -mt-4 right-0 top-0 h-24 w-24 rounded-bl-full transition-transform group-hover:scale-110 ${card.blobBg}`}
              />
              <div className="flex items-start justify-between">
                <p className="font-body-md text-body-md font-medium text-on-surface-variant">
                  {card.label}
                </p>
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${card.iconBg}`}>
                  <span className={`material-symbols-outlined ${card.iconColor}`}>{card.icon}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-display-lg text-display-lg text-on-surface">{card.value}</h3>
              </div>
              <div className="mt-2 flex items-center gap-2 border-t border-outline-variant/20 pt-4">
                <span
                  className={`flex items-center rounded-full px-2 py-0.5 font-status-badge text-status-badge ${
                    card.up ? 'text-success bg-success/10' : 'bg-error/10 text-error'
                  }`}
                >
                  <span className="material-symbols-outlined mr-1 text-[16px]">
                    {card.up ? 'trending_up' : 'trending_down'}
                  </span>
                  {card.up ? '+' : ''}
                  {card.pct}%
                </span>
                <span className="font-label-caps text-label-caps text-on-surface-variant">
                  oldingi davrga nisbatan
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-card-gap lg:grid-cols-3">
          <div className="flex flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)] lg:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-title-sm text-title-sm text-on-surface">Savdo dinamikasi</h3>
            </div>
            <p className="mb-4 font-body-md text-body-md text-on-surface-variant">
              Jami savdo: <span className="font-semibold text-on-surface">{formatSum(totals.income)}</span>
            </p>
            <div className="relative w-full flex-1">
              {loading ? (
                <p className="flex h-[260px] items-center justify-center font-body-md text-body-md text-on-surface-variant">
                  Yuklanmoqda...
                </p>
              ) : (
                <SalesLineChart data={dailySales} height={280} />
              )}
            </div>
          </div>

          <div className="flex flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)]">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-title-sm text-title-sm text-on-surface">Harajatlar tahlili</h3>
            </div>
            <p className="mb-2 font-body-md text-body-md text-on-surface-variant">
              Jami harajat: <span className="font-semibold text-on-surface">{formatSum(totalExpenses)}</span>
            </p>
            {loading ? (
              <p className="flex flex-1 items-center justify-center font-body-md text-body-md text-on-surface-variant">
                Yuklanmoqda...
              </p>
            ) : expenseCategories.length === 0 ? (
              <p className="flex flex-1 items-center justify-center font-body-md text-body-md text-on-surface-variant">
                Ma'lumot yo'q
              </p>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-6">
                <div className="relative h-48 w-48 flex-shrink-0">
                  <ExpensesDonutChart data={expenseCategories} height={192} />
                  <div className="absolute inset-0 m-auto flex h-24 w-24 flex-col items-center justify-center rounded-full bg-surface-container-lowest shadow-sm">
                    <span className="font-label-caps text-label-caps text-on-surface-variant">Jami</span>
                    <span className="font-title-sm text-title-sm font-bold text-on-surface">
                      {formatCompact(totalExpenses)}
                    </span>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-3">
                  {expenseCategories.map((c) => (
                    <div key={c.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[c.category] ?? FALLBACK_CATEGORY_COLOR }}
                        />
                        <span className="font-body-md text-body-md text-on-surface-variant">
                          {c.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-caps text-label-caps text-on-surface-variant">
                          {formatSum(c.amount)}
                        </span>
                        <span className="w-10 text-right font-medium text-on-surface">{c.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-card-gap lg:grid-cols-3">
          <div className="flex flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)] lg:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-title-sm text-title-sm text-on-surface">
                Kunlik buyurtmalar soni
              </h3>
            </div>
            <p className="mb-4 font-body-md text-body-md text-on-surface-variant">
              Jami buyurtmalar:{' '}
              <span className="font-semibold text-on-surface">{totals.ordersCount} ta</span>
            </p>
            {loading ? (
              <p className="flex h-[220px] items-center justify-center font-body-md text-body-md text-on-surface-variant">
                Yuklanmoqda...
              </p>
            ) : (
              <OrdersBarChart data={dailyOrders} height={250} />
            )}
          </div>

          <div className="flex flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-title-sm text-title-sm text-on-surface">Ommabop taomlar</h3>
              <span className="material-symbols-outlined text-on-surface-variant">
                local_fire_department
              </span>
            </div>
            <PopularItemsList items={popularItems} loading={loading} />
          </div>
        </div>
      </main>
    </>
  )
}
