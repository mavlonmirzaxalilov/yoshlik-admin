import { supabase } from './supabase'
import type { Setting } from '../types'

export type SettingsMap = Record<string, string>

export const SETTINGS_KEYS = {
  cafeName: 'cafe_name',
  cafeAddress: 'cafe_address',
  cafePhone: 'cafe_phone',
  cafeTelegram: 'cafe_telegram',
  cafeInstagram: 'cafe_instagram',
  containerPrice: 'container_price',
  deliveryPrice: 'delivery_price',
  workTimeOpen: 'work_time_open',
  workTimeClose: 'work_time_close',
  receiptFooter: 'receipt_footer',
  receiptShowPersonSplit: 'receipt_show_person_split',
} as const

export async function fetchSettings(): Promise<SettingsMap> {
  const { data, error } = await supabase.from('settings').select('key, value')
  if (error) throw error
  const map: SettingsMap = {}
  for (const row of (data ?? []) as Pick<Setting, 'key' | 'value'>[]) {
    map[row.key] = row.value ?? ''
  }
  return map
}

export async function upsertSettings(entries: Record<string, string>): Promise<void> {
  const rows = Object.entries(entries).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' })
  if (error) throw error
}

export function settingNumber(map: SettingsMap, key: string, fallback = 0): number {
  const raw = map[key]
  const n = Number(raw)
  return raw != null && Number.isFinite(n) ? n : fallback
}

export function settingBool(map: SettingsMap, key: string, fallback = false): boolean {
  const raw = map[key]
  if (raw == null || raw === '') return fallback
  return raw === 'true' || raw === '1'
}
