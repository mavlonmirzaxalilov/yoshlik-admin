import { supabase } from './supabase'
import type { Order, OrderItem, OrderStatus } from '../types'

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Order[]
}

export async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
  if (error) throw error
  return (data ?? []) as OrderItem[]
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
  if (error) throw error
}

export async function deleteOrder(orderId: string): Promise<void> {
  const { error: itemsError } = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId)
  if (itemsError) throw itemsError

  const { error } = await supabase.from('orders').delete().eq('id', orderId)
  if (error) throw error
}

export const STATUS_FLOW: OrderStatus[] = ['new', 'accepted', 'preparing', 'ready']

export function nextStatus(current: OrderStatus): OrderStatus | null {
  const idx = STATUS_FLOW.indexOf(current)
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null
  return STATUS_FLOW[idx + 1]
}
