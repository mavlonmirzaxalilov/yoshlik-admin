import { supabase } from './supabase'
import type { Order, OrderItem } from '../types'

export interface DayRange {
  startISO: string
  endISO: string
}

export function getDayRange(daysAgo = 0): DayRange {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { startISO: start.toISOString(), endISO: end.toISOString() }
}

export interface DashboardStats {
  todaySales: number
  ordersCount: number
  netProfit: number
  expensesTotal: number
}

async function sumTransactions(type: 'kirim' | 'chiqim', range: DayRange) {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('type', type)
    .gte('created_at', range.startISO)
    .lt('created_at', range.endISO)
  if (error) throw error
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
}

async function countOrders(range: DayRange) {
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', range.startISO)
    .lt('created_at', range.endISO)
  if (error) throw error
  return count ?? 0
}

async function sumExpenses(range: DayRange) {
  const { data, error } = await supabase
    .from('expenses')
    .select('amount')
    .gte('spent_at', range.startISO)
    .lt('spent_at', range.endISO)
  if (error) throw error
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
}

export async function fetchStatsForRange(range: DayRange): Promise<DashboardStats> {
  const [income, expenseTx, ordersCount, expensesTotal] = await Promise.all([
    sumTransactions('kirim', range),
    sumTransactions('chiqim', range),
    countOrders(range),
    sumExpenses(range),
  ])
  return {
    todaySales: income,
    ordersCount,
    netProfit: income - expenseTx,
    expensesTotal,
  }
}

export function percentDelta(today: number, yesterday: number): { pct: number; up: boolean } {
  if (yesterday === 0) {
    return { pct: today === 0 ? 0 : 100, up: today >= 0 }
  }
  const pct = ((today - yesterday) / Math.abs(yesterday)) * 100
  return { pct: Math.round(pct), up: pct >= 0 }
}

export interface RecentOrder extends Order {
  itemsSummary: string
}

export async function fetchRecentOrders(limit = 10): Promise<RecentOrder[]> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  const list = (orders ?? []) as Order[]
  if (list.length === 0) return []

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .in(
      'order_id',
      list.map((o) => o.id),
    )
  if (itemsError) throw itemsError

  const grouped = new Map<string, OrderItem[]>()
  for (const item of (items ?? []) as OrderItem[]) {
    const arr = grouped.get(item.order_id) ?? []
    arr.push(item)
    grouped.set(item.order_id, arr)
  }

  return list.map((order) => {
    const orderItems = grouped.get(order.id) ?? []
    const itemsSummary = orderItems
      .map((i) => `${i.product_name} (${i.quantity})`)
      .join(', ')
    return { ...order, itemsSummary }
  })
}

export interface PopularItem {
  product_name: string
  totalQuantity: number
}

export async function fetchPopularItems(limit = 5): Promise<PopularItem[]> {
  const { data, error } = await supabase
    .from('order_items')
    .select('product_name, quantity')
  if (error) throw error

  const totals = new Map<string, number>()
  for (const row of data ?? []) {
    totals.set(
      row.product_name,
      (totals.get(row.product_name) ?? 0) + Number(row.quantity ?? 0),
    )
  }

  return Array.from(totals.entries())
    .map(([product_name, totalQuantity]) => ({ product_name, totalQuantity }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit)
}
