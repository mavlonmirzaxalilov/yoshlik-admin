import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { ThemeToggleButton } from '../components/ThemeToggleButton'
import { Avatar } from '../components/Avatar'
import { StatusBadge } from '../components/StatusBadge'
import { formatDateLabel, formatSum } from '../lib/format'
import {
  fetchPopularItems,
  fetchRecentOrders,
  fetchStatsForRange,
  getDayRange,
  percentDelta,
  type DashboardStats,
  type PopularItem,
  type RecentOrder,
} from '../lib/dashboard'

const POPULAR_EMOJI = ['🍲', '🍜', '🥟', '🫖', '🥐']

interface StatCardData {
  key: string
  label: string
  value: string
  icon: string
  pct: number
  up: boolean
}

export function DashboardPage() {
  const { admin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [yesterday, setYesterday] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [popularItems, setPopularItems] = useState<PopularItem[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [today, prev, orders, popular] = await Promise.all([
          fetchStatsForRange(getDayRange(0)),
          fetchStatsForRange(getDayRange(1)),
          fetchRecentOrders(10),
          fetchPopularItems(5),
        ])
        if (cancelled) return
        setStats(today)
        setYesterday(prev)
        setRecentOrders(orders)
        setPopularItems(popular)
      } catch (err) {
        console.error('Dashboard maʼlumotlarini yuklab bo\'lmadi:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const s = stats ?? { todaySales: 0, ordersCount: 0, netProfit: 0, expensesTotal: 0 }
  const y = yesterday ?? { todaySales: 0, ordersCount: 0, netProfit: 0, expensesTotal: 0 }

  const cards: StatCardData[] = [
    {
      key: 'sales',
      label: 'Bugungi savdo',
      value: formatSum(s.todaySales),
      icon: 'monitoring',
      ...percentDelta(s.todaySales, y.todaySales),
    },
    {
      key: 'orders',
      label: 'Buyurtmalar',
      value: String(s.ordersCount),
      icon: 'receipt_long',
      ...percentDelta(s.ordersCount, y.ordersCount),
    },
    {
      key: 'profit',
      label: 'Sof foyda',
      value: formatSum(s.netProfit),
      icon: 'account_balance_wallet',
      ...percentDelta(s.netProfit, y.netProfit),
    },
    {
      key: 'expenses',
      label: 'Harajatlar',
      value: formatSum(s.expensesTotal),
      icon: 'payments',
      ...percentDelta(s.expensesTotal, y.expensesTotal),
    },
  ]

  const desktopCardStyle: Record<string, { iconBg: string; iconColor: string; badgeBg: string; badgeColor: string }> = {
    sales: {
      iconBg: 'bg-emerald-50 dark:bg-emerald-950',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950',
      badgeColor: 'text-emerald-600 dark:text-emerald-400',
    },
    orders: {
      iconBg: 'bg-blue-50 dark:bg-blue-950',
      iconColor: 'text-primary-container',
      badgeBg: 'bg-blue-50 dark:bg-blue-950',
      badgeColor: 'text-primary-container',
    },
    profit: {
      iconBg: 'bg-purple-50 dark:bg-purple-950',
      iconColor: 'text-purple-600 dark:text-purple-400',
      badgeBg: 'bg-purple-50 dark:bg-purple-950',
      badgeColor: 'text-purple-600 dark:text-purple-400',
    },
    expenses: {
      iconBg: 'bg-orange-50 dark:bg-orange-950',
      iconColor: 'text-orange-600 dark:text-orange-400',
      badgeBg: 'bg-orange-50 dark:bg-orange-950',
      badgeColor: 'text-orange-600 dark:text-orange-400',
    },
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-outline-variant bg-surface px-4 py-4 dark:bg-surface-container-lowest md:hidden">
        <div className="flex items-center gap-3">
          <Avatar
            name={admin?.full_name}
            className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-primary-container flex items-center justify-center font-title-sm text-title-sm text-on-primary-container"
          />
          <div>
            <h1 className="font-title-sm text-title-sm text-on-surface">
              Xush kelibsiz, {admin?.full_name ?? 'Admin'}!
            </h1>
            <p className="font-label-caps text-label-caps text-on-surface-variant">
              {formatDateLabel()}
            </p>
          </div>
        </div>
        <ThemeToggleButton className="rounded-full p-2 text-on-surface-variant transition-opacity hover:bg-surface-container-low active:opacity-70 dark:hover:bg-surface-container-highest" />
      </header>

      {/* Desktop Top Bar */}
      <header className="sticky top-0 z-30 hidden w-full items-center justify-between border-b border-outline-variant/30 bg-surface px-8 py-4 dark:bg-background md:flex">
        <div>
          <h2 className="font-headline-md text-headline-md font-semibold text-on-surface dark:text-on-background">
            Boshqaruv paneli
          </h2>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant dark:text-outline">
            Bugungi ko'rsatkichlar • {formatDateLabel()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggleButton className="rounded-full p-2 text-primary transition-transform scale-95 active:scale-90 hover:bg-surface-container-low dark:text-primary-fixed-dim dark:hover:bg-surface-container-highest" />
          <button className="rounded-full p-2 text-primary transition-transform scale-95 active:scale-90 hover:bg-surface-container-low dark:text-primary-fixed-dim dark:hover:bg-surface-container-highest">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <Avatar
            name={admin?.full_name}
            className="h-10 w-10 cursor-pointer rounded-full border border-outline-variant/30 bg-primary-container flex items-center justify-center font-title-sm text-title-sm text-on-primary-container"
          />
        </div>
      </header>

      <div className="flex-1 space-y-6 p-4 md:space-y-10 md:p-8">
        {/* Mobile stats 2x2 */}
        <section className="md:hidden">
          <h2 className="mb-4 font-title-sm text-title-sm text-on-surface">
            Umumiy ko'rsatkichlar
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {cards.map((c) => (
              <div
                key={c.key}
                className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      c.up ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {c.icon}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                    {c.label}
                  </p>
                  <p className="mt-1 font-title-sm text-title-sm text-on-surface">{c.value}</p>
                </div>
                <div
                  className={`flex items-center gap-1 font-label-caps text-label-caps ${
                    c.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-error'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {c.up ? 'trending_up' : 'trending_down'}
                  </span>
                  <span>
                    {c.up ? '+' : ''}
                    {c.pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Desktop stat card grid */}
        <div className="hidden grid-cols-2 gap-6 md:grid lg:grid-cols-4">
          {cards.map((c) => {
            const style = desktopCardStyle[c.key]
            return (
              <div
                key={c.key}
                className="flex flex-col gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className={`rounded-full p-3 ${style.iconBg} ${style.iconColor}`}>
                    <span className="material-symbols-outlined">{c.icon}</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-label-caps font-label-caps ${style.badgeBg} ${style.badgeColor}`}
                  >
                    {c.up ? '+' : ''}
                    {c.pct}% {c.up ? '↑' : '↓'}
                  </span>
                </div>
                <div>
                  <p className="mb-1 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                    {c.label}
                  </p>
                  <h3 className="font-display-lg text-display-lg text-on-surface">{c.value}</h3>
                </div>
              </div>
            )
          })}
        </div>

        {/* Mobile recent orders */}
        <section className="md:hidden">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-title-sm text-title-sm text-on-surface">So'nggi buyurtmalar</h2>
          </div>
          <div className="flex flex-col gap-3">
            {loading && (
              <p className="text-body-md text-on-surface-variant">Yuklanmoqda...</p>
            )}
            {!loading && recentOrders.length === 0 && (
              <p className="text-body-md text-on-surface-variant">Buyurtmalar topilmadi</p>
            )}
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-label-caps text-label-caps text-on-surface-variant">
                      #{order.order_number}
                    </span>
                    <h3 className="font-title-sm text-title-sm text-on-surface">
                      {order.customer_name ?? "Noma'lum mijoz"}
                    </h3>
                  </div>
                  <StatusBadge status={order.status} variant="flat" />
                </div>
                <div className="text-sm text-body-md text-on-surface-variant">
                  {order.itemsSummary || '—'}
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-outline-variant/30 pt-3">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">
                    Jami summa:
                  </span>
                  <span className="font-title-sm text-title-sm text-on-surface">
                    {formatSum(order.grand_total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Desktop bento: table + popular items */}
        <div className="hidden grid-cols-3 gap-6 md:grid">
          <div className="col-span-2 flex flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between border-b border-outline-variant/30 bg-white/50 p-6 backdrop-blur-sm dark:bg-surface-container/50">
              <h3 className="font-title-sm text-title-sm text-on-surface">So'nggi buyurtmalar</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface-container-low">
                    <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">
                      Raqam
                    </th>
                    <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">
                      Mijoz
                    </th>
                    <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">
                      Taomlar
                    </th>
                    <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">
                      Summa
                    </th>
                    <th className="px-6 py-4 font-label-caps text-label-caps uppercase text-on-surface-variant">
                      Holat
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {loading && (
                    <tr>
                      <td colSpan={5} className="px-6 py-6 text-center text-on-surface-variant">
                        Yuklanmoqda...
                      </td>
                    </tr>
                  )}
                  {!loading && recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-6 text-center text-on-surface-variant">
                        Buyurtmalar topilmadi
                      </td>
                    </tr>
                  )}
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-surface-container-low/50">
                      <td className="px-6 py-4 font-medium text-on-surface">
                        #{order.order_number}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">
                        {order.customer_name ?? "Noma'lum"}
                      </td>
                      <td className="max-w-[220px] truncate px-6 py-4 text-on-surface-variant">
                        {order.itemsSummary || '—'}
                      </td>
                      <td className="px-6 py-4 font-medium text-on-surface">
                        {formatSum(order.grand_total)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} variant="simple" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="relative col-span-1 flex flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)]">
            <div className="relative z-10 mb-6 flex items-center justify-between">
              <h3 className="font-title-sm text-title-sm text-on-surface">Ommabop taomlar</h3>
              <span className="material-symbols-outlined text-on-surface-variant">
                local_fire_department
              </span>
            </div>
            <ul className="relative z-10 space-y-4">
              {loading && <li className="text-on-surface-variant">Yuklanmoqda...</li>}
              {!loading && popularItems.length === 0 && (
                <li className="text-on-surface-variant">Ma'lumot yo'q</li>
              )}
              {popularItems.map((item, idx) => (
                <li
                  key={item.product_name}
                  className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-surface-container-low"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-4 font-label-caps font-bold text-on-surface-variant">
                      {idx + 1}
                    </span>
                    <span className="text-xl">{POPULAR_EMOJI[idx % POPULAR_EMOJI.length]}</span>
                    <span className="font-medium text-on-surface">{item.product_name}</span>
                  </div>
                  <span className="font-medium text-primary-container">
                    {item.totalQuantity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
