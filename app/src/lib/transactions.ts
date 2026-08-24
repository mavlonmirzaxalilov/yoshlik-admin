import { supabase } from './supabase'
import type { Transaction, TransactionType } from '../types'

export async function fetchTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Transaction[]
}

export interface TransactionInput {
  type: TransactionType
  amount: number
  account: string
  description: string
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...input, category: 'qolda' })
    .select('*')
    .single()
  if (error) throw error
  return data as Transaction
}
