import { useEffect, useMemo, useState } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { ThemeToggleButton } from '../components/ThemeToggleButton'
import { Avatar } from '../components/Avatar'
import { StatusBadge } from '../components/StatusBadge'
import { StatusMenu } from '../components/StatusMenu'
import { Modal } from '../components/Modal'
import { orderTypeMeta, paymentMethodLabel } from '../lib/orderMeta'
import { formatDateLabel, formatOrderDateTime, formatSum } from '../lib/format'
import {
  deleteOrder,
  fetchOrderItems,
  fetchOrders,
  nextStatus,
  updateOrderStatus,
} from '../lib/orders'
import { playNewOrderChime } from '../lib/notifySound'
import type { Order, OrderItem, OrderStatus } from '../types'

const FILTER_DEFS: { key: 'all' | OrderStatus; label: string }[] = [
  { key: 'all', label: 'Hammasi' },
  { key: 'new', label: 'Yangi' },
  { key: 'accepted', label: 'Qabul qilindi' },
  { key: 'preparing', label: 'Tayyorlanmoqda' },
  { key: 'ready', label: 'Tayyor' },
  { key: 'cancelled', label: 'Bekor qilingan' },
]

const NEXT_ACTION_LABEL: Record<OrderStatus, string> = {
  new: 'Qabul qilish',
  accepted: 'Tayyorlashni boshlash',
  preparing: 'Tayyor deb belgilash',
  ready: '',
  cancelled: '',
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const [items, setItems] = useState<OrderItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const meta = orderTypeMeta(order.order_type)
  const { time, dayLabel } = formatOrderDateTime(order.created_at)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchOrderItems(order.id)
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [order.id])

  return (
    <Modal open onClose={onClose} title={`Buyurtma #${order.order_number}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-on-surface-variant">Mijoz</p>
            <p className="font-medium text-on-surface">{order.customer_name ?? "Noma'lum"}</p>
          </div>
          <div>
            <p className="text-on-surface-variant">Telefon</p>
            <p className="font-medium text-on-surface">{order.customer_phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-on-surface-variant">Turi</p>
            <p className="flex items-center gap-1 font-medium text-on-surface">
              <span className="material-symbols-outlined text-[16px]">{meta.icon}</span>
              {meta.label}
            </p>
          </div>
          <div>
            <p className="text-on-surface-variant">To'lov</p>
            <p className="font-medium text-on-surface">{paymentMethodLabel(order.payment_method)}</p>
          </div>
          {order.address && (
            <div className="col-span-2">
              <p className="text-on-surface-variant">Manzil</p>
              <p className="font-medium text-on-surface">{order.address}</p>
            </div>
          )}
          <div>
            <p className="text-on-surface-variant">Sana</p>
            <p className="font-medium text-on-surface">
              {dayLabel}, {time}
            </p>
          </div>
          <div>
            <p className="text-on-surface-variant">Holat</p>
            <StatusBadge status={order.status} variant="simple" />
          </div>
        </div>

        <div className="border-t border-outline-variant/30 pt-4">
          <h4 className="mb-2 font-label-caps text-label-caps uppercase text-on-surface-variant">
            Taomlar
          </h4>
          {loading && <p className="text-sm text-on-surface-variant">Yuklanmoqda...</p>}
          {!loading && (items?.length ?? 0) === 0 && (
            <p className="text-sm text-on-surface-variant">Taomlar topilmadi</p>
          )}
          <ul className="divide-y divide-outline-variant/20">
            {items?.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-on-surface">{item.product_name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {item.quantity} x {formatSum(item.price)}
                  </p>
                </div>
                <p className="font-medium text-on-surface">{formatSum(item.subtotal)}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-1 border-t border-outline-variant/30 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Taomlar summasi</span>
            <span>{formatSum(order.items_total)}</span>
          </div>
          {order.container_total > 0 && (
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Idish narxi</span>
              <span>{formatSum(order.container_total)}</span>
            </div>
          )}
          {order.delivery_total > 0 && (
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Yetkazish narxi</span>
              <span>{formatSum(order.delivery_total)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 font-title-sm text-title-sm text-primary">
            <span>Jami</span>
            <span>{formatSum(order.grand_total)}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export function OrdersPage() {
  const { admin } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | OrderStatus>('all')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchOrders()
      .then((data) => {
        if (!cancelled) setOrders(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Buyurtmalarni yuklab bo'lmadi")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: RealtimePostgresChangesPayload<Order>) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order
            setOrders((prev) =>
              prev.some((o) => o.id === newOrder.id) ? prev : [newOrder, ...prev],
            )
            playNewOrderChime()
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Order
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
            setSelectedOrder((prev) => (prev && prev.id === updated.id ? updated : prev))
          } else if (payload.eventType === 'DELETE') {
            const removedId = (payload.old as Partial<Order>).id
            setOrders((prev) => prev.filter((o) => o.id !== removedId))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length }
    for (const def of FILTER_DEFS) {
      if (def.key === 'all') continue
      c[def.key] = orders.filter((o) => o.status === def.key).length
    }
    return c
  }, [orders])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return orders.filter((o) => {
      if (activeFilter !== 'all' && o.status !== activeFilter) return false
      if (!term) return true
      return (
        String(o.order_number).includes(term) ||
        o.customer_name?.toLowerCase().includes(term) ||
        o.customer_phone?.toLowerCase().includes(term)
      )
    })
  }, [orders, activeFilter, search])

  async function handleStatusChange(order: Order, status: OrderStatus) {
    const previous = orders
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)))
    try {
      await updateOrderStatus(order.id, status)
    } catch {
      setOrders(previous)
      window.alert("Holatni yangilab bo'lmadi. Qayta urinib ko'ring.")
    }
  }

  async function handleDelete(order: Order) {
    if (!window.confirm(`Rostdan #${order.order_number} buyurtmasini o'chirasizmi?`)) return
    setDeletingId(order.id)
    try {
      await deleteOrder(order.id)
      setOrders((prev) => prev.filter((o) => o.id !== order.id))
      setSelectedOrder((prev) => (prev?.id === order.id ? null : prev))
    } catch {
      window.alert("Buyurtmani o'chirib bo'lmadi. Qayta urinib ko'ring.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-outline-variant bg-surface px-4 py-4 dark:border-outline dark:bg-surface-container-lowest md:hidden">
        <div className="flex items-center gap-3">
          <Avatar name={admin?.full_name} />
          <div>
            <h1 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed-dim">
              Xush kelibsiz!
            </h1>
            <p className="font-label-caps text-label-caps text-on-surface-variant">
              Admin profili
            </p>
          </div>
        </div>
        <ThemeToggleButton className="rounded-full p-2 text-on-surface-variant transition-opacity hover:bg-surface-container-low active:opacity-70 dark:hover:bg-surface-container-highest" />
      </header>

      {/* Desktop header */}
      <header className="sticky top-0 z-30 hidden w-full items-center justify-between border-b border-outline-variant/30 bg-surface/90 px-8 py-4 backdrop-blur-md md:flex">
        <div>
          <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">
            Buyurtmalar
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">Bugun, {formatDateLabel()}</p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggleButton />
          <div className="mx-2 h-8 w-px bg-outline-variant/50" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-on-surface">{admin?.full_name}</p>
              <p className="text-xs text-on-surface-variant">{admin?.role}</p>
            </div>
            <Avatar
              name={admin?.full_name}
              className="h-10 w-10 rounded-full border border-outline-variant/30 bg-primary-container flex items-center justify-center font-title-sm text-title-sm text-on-primary-container"
            />
          </div>
        </div>
      </header>

      {/* Mobile content */}
      <main className="flex flex-1 flex-col gap-4 px-4 pb-8 pt-4 md:hidden">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-4 text-body-md font-body-md text-on-surface shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Buyurtmani qidirish..."
            type="text"
          />
        </div>
        <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-2">
          {FILTER_DEFS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`whitespace-nowrap rounded-full px-4 py-2 font-status-badge text-status-badge transition-colors ${
                activeFilter === tab.key
                  ? 'bg-primary text-on-primary'
                  : 'border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
              }`}
            >
              {tab.label} ({counts[tab.key] ?? 0})
            </button>
          ))}
        </div>

        {loading && <p className="py-8 text-center text-on-surface-variant">Yuklanmoqda...</p>}
        {!loading && loadError && (
          <p className="py-8 text-center text-error">{loadError}</p>
        )}
        {!loading && !loadError && filtered.length === 0 && (
          <p className="py-8 text-center text-on-surface-variant">Buyurtmalar topilmadi</p>
        )}

        <div className="flex flex-col gap-4">
          {filtered.map((order) => {
            const meta = orderTypeMeta(order.order_type)
            const { time, dayLabel } = formatOrderDateTime(order.created_at)
            const next = nextStatus(order.status)
            return (
              <div
                key={order.id}
                className="flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.1),_0px_1px_2px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-title-sm text-title-sm text-on-surface">
                        #{order.order_number}
                      </h3>
                      <StatusBadge status={order.status} variant="flat" />
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      {order.customer_name ?? "Noma'lum"}
                    </p>
                    <p className="font-label-caps text-label-caps text-outline">
                      {order.customer_phone ?? '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-surface-container px-2 py-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">{meta.icon}</span>
                    <span className="font-label-caps text-label-caps">{meta.label}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-dashed border-outline-variant pb-2 pt-3">
                  <div>
                    <p className="font-label-caps text-label-caps uppercase tracking-wide text-outline">
                      Jami summa
                    </p>
                    <p className="font-title-sm text-title-sm text-primary">
                      {formatSum(order.grand_total)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="font-label-caps text-label-caps uppercase tracking-wide text-outline">
                      To'lov
                    </p>
                    <p className="font-body-md text-body-md text-on-surface">
                      {paymentMethodLabel(order.payment_method)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-outline">
                  {dayLabel}, {time}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-surface-container-high py-2.5 font-title-sm text-title-sm text-primary transition-colors hover:bg-surface-container-highest"
                  >
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                    Ko'rish
                  </button>
                  {next && (
                    <button
                      onClick={() => handleStatusChange(order, next)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-title-sm text-title-sm text-on-primary transition-colors hover:bg-primary-fixed"
                    >
                      {NEXT_ACTION_LABEL[order.status]}
                    </button>
                  )}
                  <StatusMenu
                    current={order.status}
                    onChange={(status) => handleStatusChange(order, status)}
                  />
                  <button
                    onClick={() => handleDelete(order)}
                    disabled={deletingId === order.id}
                    title="O'chirish"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-error-container text-error transition-colors hover:bg-error hover:text-on-error disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Desktop content */}
      <div className="mx-auto hidden w-full max-w-7xl flex-1 flex-col gap-6 p-8 md:flex">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-2 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)] xl:flex-row xl:items-center">
          <div className="hide-scrollbar flex w-full gap-1 overflow-x-auto p-1 xl:w-auto">
            {FILTER_DEFS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
                  activeFilter === tab.key
                    ? 'bg-primary-container/10 text-primary-container'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    activeFilter === tab.key
                      ? 'bg-primary-container text-white'
                      : 'bg-surface-variant text-on-surface-variant'
                  }`}
                >
                  {counts[tab.key] ?? 0}
                </span>
              </button>
            ))}
          </div>
          <div className="flex w-full items-center gap-3 px-2 pb-2 xl:w-auto xl:p-0 xl:pr-2">
            <div className="relative flex-1 xl:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border-none bg-surface-container-low py-2.5 pl-10 pr-4 text-sm outline-none transition-shadow placeholder:text-outline focus:ring-2 focus:ring-primary-container"
                placeholder="Buyurtma izlash..."
                type="text"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)]">
          <div className="table-container relative flex-1 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="sticky top-0 z-10 border-b border-outline-variant/30 bg-surface-container-lowest">
                <tr>
                  {['Raqam', 'Mijoz / Telefon', 'Turi', "To'lov / Summa", 'Holat', 'Sana'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant"
                    >
                      {h}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-right font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-sm">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-on-surface-variant">
                      Yuklanmoqda...
                    </td>
                  </tr>
                )}
                {!loading && loadError && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-error">
                      {loadError}
                    </td>
                  </tr>
                )}
                {!loading && !loadError && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-on-surface-variant">
                      Buyurtmalar topilmadi
                    </td>
                  </tr>
                )}
                {filtered.map((order) => {
                  const meta = orderTypeMeta(order.order_type)
                  const { time, dayLabel } = formatOrderDateTime(order.created_at)
                  return (
                    <tr
                      key={order.id}
                      className={`group transition-colors hover:bg-surface-container-low/50 ${
                        order.status === 'cancelled' ? 'opacity-70' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-on-surface">
                        #{order.order_number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-on-surface">
                          {order.customer_name ?? "Noma'lum"}
                        </div>
                        <div className="mt-0.5 text-xs text-on-surface-variant">
                          {order.customer_phone ?? '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                          <span className="material-symbols-outlined text-[16px]">{meta.icon}</span>
                          <span>{meta.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-on-surface">
                          {formatSum(order.grand_total)}
                        </div>
                        <div className="mt-0.5 text-xs text-on-surface-variant">
                          {paymentMethodLabel(order.payment_method)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} variant="dotted" />
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {time}
                        <br />
                        <span className="text-xs text-outline">{dayLabel}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            title="Ko'rish"
                            onClick={() => setSelectedOrder(order)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-primary-container transition-colors hover:bg-primary-container hover:text-white"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <StatusMenu
                            current={order.status}
                            onChange={(status) => handleStatusChange(order, status)}
                          />
                          <button
                            title="O'chirish"
                            onClick={() => handleDelete(order)}
                            disabled={deletingId === order.id}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-error transition-colors hover:bg-error hover:text-on-error disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-outline-variant/20 bg-surface-container-lowest p-4">
            <p className="text-sm text-on-surface-variant">Jami {filtered.length} ta buyurtma</p>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </>
  )
}
