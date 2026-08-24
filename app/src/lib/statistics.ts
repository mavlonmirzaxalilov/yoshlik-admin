import { supabase } from './supabase'

export interface DateRange {
  start: Date
  end: Date
}

export type QuickPeriod = 'today' | 'week' | 'month' | 'custom'

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}

export function rangeForQuickPeriod(period: 'today' | 'week' | 'month'): DateRange {
  const today = startOfDay(new Date())
  const end = addDays(today, 1)
  if (period === 'today') return { start: today, end }
  if (period === 'week') return { start: addDays(today, -6), end }
  return { start: addDays(today, -29), end }
}

export function rangeForCustom(startStr: string, endStr: string): DateRange | null {
  if (!startStr || !endStr) return null
  const start = startOfDay(new Date(startStr))
  const end = addDays(startOfDay(new Date(endStr)), 1)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null
  return { start, end }
}

export function previousRange(range: DateRange): DateRange {
  const durationMs = range.end.getTime() - range.start.getTime()
  return { start: new Date(range.start.getTime() - durationMs), end: new Date(range.start.getTime()) }
}

function localDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const MONTHS_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek']

export function shortDateLabel(d: Date): string {
  return `${d.getDate()}-${MONTHS_SHORT[d.getMonth()]}`
}

function enumerateDays(range: DateRange): Date[] {
  const days: Date[] = []
  let cur = startOfDay(range.start)
  const end = startOfDay(range.end)
  while (cur < end) {
    days.push(cur)
    cur = addDays(cur, 1)
  }
  return days
}

export interface DailyPoint {
  key: string
  label: string
  value: number
}

export async function fetchDailySales(range: DateRange): Promise<DailyPoint[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, created_at')
    .eq('type', 'kirim')
    .gte('created_at', range.start.toISOString())
    .lt('created_at', range.end.toISOString())
  if (error) throw error

  const totals = new Map<string, number>()
  for (const row of data ?? []) {
    const key = localDateKey(new Date(row.created_at))
    totals.set(key, (totals.get(key) ?? 0) + Number(row.amount ?? 0))
  }

  return enumerateDays(range).map((d) => {
    const key = localDateKey(d)
    return { key, label: shortDateLabel(d), value: totals.get(key) ?? 0 }
  })
}

export interface OrderRow {
  id: string
  created_at: string
}

// Bitta so'rov bilan tanlangan davrdagi buyurtmalarni oladi — shu ma'lumot
// kunlik grafik, jami son va ommabop taomlar uchun ham qayta ishlatiladi
// (avval bu uchtasi alohida-alohida 'orders' jadvaliga so'rov yuborardi).
export async function fetchOrdersInRange(range: DateRange): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at')
    .gte('created_at', range.start.toISOString())
    .lt('created_at', range.end.toISOString())
  if (error) throw error
  return (data ?? []) as OrderRow[]
}

export function aggregateOrderCountsByDay(orders: OrderRow[], range: DateRange): DailyPoint[] {
  const totals = new Map<string, number>()
  for (const row of orders) {
    const key = localDateKey(new Date(row.created_at))
    totals.set(key, (totals.get(key) ?? 0) + 1)
  }

  return enumerateDays(range).map((d) => {
    const key = localDateKey(d)
    return { key, label: shortDateLabel(d), value: totals.get(key) ?? 0 }
  })
}

export interface PopularItem {
  product_name: string
  totalQuantity: number
}

export async function fetchPopularItemsForOrders(orderIds: string[], limit = 10): Promise<PopularItem[]> {
  if (orderIds.length === 0) return []

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('product_name, quantity')
    .in('order_id', orderIds)
  if (itemsError) throw itemsError

  const totals = new Map<string, number>()
  for (const row of items ?? []) {
    totals.set(row.product_name, (totals.get(row.product_name) ?? 0) + Number(row.quantity ?? 0))
  }

  return Array.from(totals.entries())
    .map(([product_name, totalQuantity]) => ({ product_name, totalQuantity }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit)
}

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  ijara: 'Ijara',
  oylik: 'Oylik',
  mahsulot: 'Mahsulot',
  kommunal: 'Kommunal',
  boshqa: 'Boshqa',
}

export function expenseCategoryLabel(category: string): string {
  return EXPENSE_CATEGORY_LABELS[category] ?? category
}

export interface CategorySlice {
  category: string
  label: string
  amount: number
  pct: number
}

export async function fetchExpensesByCategory(range: DateRange): Promise<CategorySlice[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('category, amount')
    .gte('spent_at', range.start.toISOString())
    .lt('spent_at', range.end.toISOString())
  if (error) throw error

  const totals = new Map<string, number>()
  for (const row of data ?? []) {
    const cat = row.category ?? 'boshqa'
    totals.set(cat, (totals.get(cat) ?? 0) + Number(row.amount ?? 0))
  }

  const total = Array.from(totals.values()).reduce((s, v) => s + v, 0)

  return Array.from(totals.entries())
    .map(([category, amount]) => ({
      category,
      label: expenseCategoryLabel(category),
      amount,
      pct: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export interface RangeTotals {
  income: number
  expense: number
  ordersCount: number
}

export async function sumTransactionsByType(type: 'kirim' | 'chiqim', range: DateRange): Promise<number> {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('type', type)
    .gte('created_at', range.start.toISOString())
    .lt('created_at', range.end.toISOString())
  if (error) throw error
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
}

async function countOrdersInRange(range: DateRange): Promise<number> {
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', range.start.toISOString())
    .lt('created_at', range.end.toISOString())
  if (error) throw error
  return count ?? 0
}

export async function fetchRangeTotals(range: DateRange): Promise<RangeTotals> {
  const [income, expense, ordersCount] = await Promise.all([
    sumTransactionsByType('kirim', range),
    sumTransactionsByType('chiqim', range),
    countOrdersInRange(range),
  ])
  return { income, expense, ordersCount }
}

export function percentDelta(current: number, previous: number): { pct: number; up: boolean } {
  if (previous === 0) {
    return { pct: current === 0 ? 0 : 100, up: current >= 0 }
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100
  return { pct: Math.round(pct), up: pct >= 0 }
}
