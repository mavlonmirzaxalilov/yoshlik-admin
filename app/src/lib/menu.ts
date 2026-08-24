import { supabase } from './supabase'
import type { Category, Product } from '../types'

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Category[]
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as Product[]
}

export interface ProductInput {
  name: string
  description: string | null
  price: number
  category_id: string
  is_available: boolean
}

export async function getNextSortOrder(categoryId: string): Promise<number> {
  const { data, error } = await supabase
    .from('products')
    .select('sort_order')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return ((data?.sort_order as number | undefined) ?? -1) + 1
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const sort_order = await getNextSortOrder(input.category_id)
  const { data, error } = await supabase
    .from('products')
    .insert({ ...input, image_url: null, sort_order })
    .select('*')
    .single()
  if (error) throw error
  return data as Product
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as Product
}

export async function setProductAvailability(id: string, is_available: boolean): Promise<void> {
  const { error } = await supabase.from('products').update({ is_available }).eq('id', id)
  if (error) throw error
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}
