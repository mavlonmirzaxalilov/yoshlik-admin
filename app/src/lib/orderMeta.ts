import type { OrderType } from '../types'

export const ORDER_TYPE_META: Record<OrderType, { label: string; icon: string }> = {
  delivery: { label: 'Yetkazish', icon: 'directions_bike' },
  pickup: { label: "Olib ketish", icon: 'local_mall' },
  dine_in: { label: 'Joyida', icon: 'restaurant' },
}

export function orderTypeMeta(type: OrderType) {
  return ORDER_TYPE_META[type] ?? { label: type, icon: 'receipt_long' }
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Naqd',
  online: 'Onlayn (Click/Payme)',
  click: 'Click',
  payme: 'Payme',
}

export function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "Noma'lum"
  return PAYMENT_METHOD_LABELS[method.toLowerCase()] ?? method
}
