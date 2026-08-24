import { useEffect, useRef, useState } from 'react'
import { statusLabel } from './StatusBadge'
import type { OrderStatus } from '../types'

const ALL_STATUSES: OrderStatus[] = ['new', 'accepted', 'preparing', 'ready', 'cancelled']

interface StatusMenuProps {
  current: OrderStatus
  onChange: (status: OrderStatus) => void
  disabled?: boolean
  align?: 'left' | 'right'
}

export function StatusMenu({ current, onChange, disabled, align = 'right' }: StatusMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        title="Holatni o'zgartirish"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors hover:bg-inverse-surface hover:text-inverse-on-surface disabled:pointer-events-none disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-[18px]">more_vert</span>
      </button>
      {open && (
        <div
          className={`absolute z-20 mt-1 w-48 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-1 shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {ALL_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => {
                onChange(status)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-surface-container-low ${
                status === current ? 'font-semibold text-primary' : 'text-on-surface'
              }`}
            >
              {statusLabel(status)}
              {status === current && (
                <span className="material-symbols-outlined text-[16px]">check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
