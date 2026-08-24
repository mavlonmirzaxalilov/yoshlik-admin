import { supabase } from './supabase'
import type { Admin, AdminRole } from '../types'

export interface AdminInput {
  full_name: string
  telegram_id: number
  role: AdminRole
}

export const ADMIN_ROLES: { value: AdminRole; label: string }[] = [
  { value: 'menejer', label: 'Menejer' },
  { value: 'kassir', label: 'Kassir' },
  { value: 'oshpaz', label: 'Oshpaz' },
]

export function roleLabel(role: AdminRole): string {
  return ADMIN_ROLES.find((r) => r.value === role)?.label ?? role
}

export async function fetchAdmins(): Promise<Admin[]> {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .order('full_name', { ascending: true })
  if (error) throw error
  return (data ?? []) as Admin[]
}

export async function createAdmin(input: AdminInput): Promise<Admin> {
  const { data, error } = await supabase
    .from('admins')
    .insert({ ...input, is_active: true })
    .select('*')
    .single()
  if (error) throw error
  return data as Admin
}

export async function setAdminActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('admins').update({ is_active: isActive }).eq('id', id)
  if (error) throw error
}

export async function deleteAdmin(id: string): Promise<void> {
  const { error } = await supabase.from('admins').delete().eq('id', id)
  if (error) throw error
}
