export type AdminRole = 'menejer' | 'kassir' | 'oshpaz' | string

export interface Admin {
  id: string
  telegram_id: number | string
  full_name: string
  role: AdminRole
  is_active: boolean
  auth_user_id: string | null
}

export interface Setting {
  key: string
  value: string | null
  updated_at: string
}

export type OrderType = 'delivery' | 'pickup' | 'dine_in'

export type OrderStatus =
  | 'new'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'cancelled'

export interface Order {
  id: string
  order_number: number
  customer_name: string | null
  customer_phone: string | null
  order_type: OrderType
  address: string | null
  payment_method: string | null
  items_total: number
  container_total: number
  delivery_total: number
  grand_total: number
  status: OrderStatus
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  price: number
  quantity: number
  subtotal: number
}

export interface Product {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  sort_order: number
}

export interface Category {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

export type TransactionType = 'kirim' | 'chiqim' | string

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  account: string | null
  description: string | null
  category: string | null
  order_id: string | null
  created_by: string | null
  created_at: string
}

export interface Expense {
  id: string
  category: string
  amount: number
  description: string | null
  spent_at: string
  created_by: number | null
  created_at: string
}
