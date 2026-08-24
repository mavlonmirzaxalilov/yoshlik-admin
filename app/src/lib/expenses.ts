import { supabase } from './supabase'
import type { Expense } from '../types'

export interface ExpenseInput {
  category: string
  amount: number
  description: string | null
  spent_at: string
}

export const EXPENSE_CATEGORIES: { value: string; label: string }[] = [
  { value: 'ijara', label: 'Ijara' },
  { value: 'oylik', label: 'Oyliklar' },
  { value: 'mahsulot', label: 'Mahsulot xaridi' },
  { value: 'kommunal', label: 'Kommunal' },
  { value: 'boshqa', label: 'Boshqa' },
]

export function expenseCategoryLabel(category: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === category)?.label ?? category
}

export function dateToStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayDateStr(): string {
  return dateToStr(new Date())
}

export function shiftDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, (m || 1) - 1, d || 1)
  dt.setDate(dt.getDate() + days)
  return dateToStr(dt)
}

export function shiftMonthPrefix(monthPrefix: string, delta: number): string {
  const [y, m] = monthPrefix.split('-').map(Number)
  const total = y * 12 + (m - 1) + delta
  const ny = Math.floor(total / 12)
  const nm = ((total % 12) + 12) % 12
  return `${ny}-${String(nm + 1).padStart(2, '0')}`
}

export function percentDelta(current: number, previous: number): { pct: number; up: boolean } {
  if (previous === 0) {
    return { pct: current === 0 ? 0 : 100, up: current >= 0 }
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100
  return { pct: Math.round(pct), up: pct >= 0 }
}

export async function fetchExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('spent_at', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Expense[]
}

// Harajat kassaga ham chiqim sifatida yozilishi kerak (talab: "MUHIM — KASSA
// BILAN BOG'LIQLIK"). Buni topish uchun aniq bog'lovchi ustun yo'q, shu sabab
// o'chirishda transactions'dan mos yozuvni shu bir xil belgilar bo'yicha
// (turi/kategoriyasi/summasi/tavsifi) qidirib, eng so'nggisini o'chiramiz.
const EXPENSE_TX_CATEGORY = 'harajat'

function expenseTransactionDescription(input: { category: string; description: string | null }): string {
  return input.description?.trim() || expenseCategoryLabel(input.category)
}

async function recordExpenseTransaction(input: ExpenseInput): Promise<void> {
  const { error } = await supabase.from('transactions').insert({
    type: 'chiqim',
    amount: input.amount,
    account: 'naqd',
    description: expenseTransactionDescription(input),
    category: EXPENSE_TX_CATEGORY,
  })
  if (error) {
    console.error("Harajat kassaga chiqim sifatida yozilmadi:", error)
  }
}

export async function createExpense(input: ExpenseInput, createdBy: number | null): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...input, created_by: createdBy })
    .select('*')
    .single()
  if (error) throw error

  await recordExpenseTransaction(input)

  return data as Expense
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as Expense
}

export async function deleteExpense(expense: Expense): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', expense.id)
  if (error) throw error

  try {
    const { data: matches } = await supabase
      .from('transactions')
      .select('id')
      .eq('type', 'chiqim')
      .eq('category', EXPENSE_TX_CATEGORY)
      .eq('amount', expense.amount)
      .eq('description', expenseTransactionDescription(expense))
      .order('created_at', { ascending: false })
      .limit(1)
    const match = matches?.[0] as { id: string } | undefined
    if (match) {
      await supabase.from('transactions').delete().eq('id', match.id)
    }
  } catch (err) {
    console.error("Bog'liq kassa yozuvini o'chirib bo'lmadi:", err)
  }
}
