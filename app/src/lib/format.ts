export function formatSum(value: number | null | undefined): string {
  const n = Math.round(value ?? 0)
  return `${n.toLocaleString('ru-RU').replace(/,/g, ' ')} so'm`
}

export function formatNumber(value: number | null | undefined): string {
  const n = Math.round(value ?? 0)
  return n.toLocaleString('ru-RU').replace(/,/g, ' ')
}

export function formatCompact(value: number | null | undefined): string {
  const n = value ?? 0
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(Math.round(n))
}

export function formatDateLabel(date: Date = new Date()): string {
  const months = [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
  ]
  return `${date.getDate()}-${months[date.getMonth()]}, ${date.getFullYear()}`
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatOrderDateTime(dateStr: string): { time: string; dayLabel: string } {
  const d = new Date(dateStr)
  return {
    time: formatTime(dateStr),
    dayLabel: isToday(dateStr) ? 'Bugun' : formatDateLabel(d),
  }
}

export function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}
