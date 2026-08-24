const ACCOUNT_LABELS: Record<string, string> = {
  naqd: 'Naqd',
  karta: 'Karta',
}

const ACCOUNT_ICONS: Record<string, string> = {
  naqd: 'payments',
  karta: 'credit_card',
}

export function accountLabel(account: string | null | undefined): string {
  if (!account) return "Noma'lum"
  return ACCOUNT_LABELS[account.toLowerCase()] ?? account
}

export function accountIcon(account: string | null | undefined): string {
  return ACCOUNT_ICONS[(account ?? '').toLowerCase()] ?? 'account_balance'
}

export function isIncome(type: string): boolean {
  return type === 'kirim'
}
