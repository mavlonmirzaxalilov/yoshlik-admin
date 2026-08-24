import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import type { Expense } from '../types'
import { EXPENSE_CATEGORIES, todayDateStr, type ExpenseInput } from '../lib/expenses'

interface ExpenseFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (input: ExpenseInput) => Promise<void>
  initial?: Expense | null
}

export function ExpenseFormModal({ open, onClose, onSubmit, initial }: ExpenseFormModalProps) {
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].value)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [spentAt, setSpentAt] = useState(todayDateStr())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setCategory(initial?.category ?? EXPENSE_CATEGORIES[0].value)
    setAmount(initial ? String(initial.amount) : '')
    setDescription(initial?.description ?? '')
    setSpentAt(initial?.spent_at ?? todayDateStr())
    setError(null)
  }, [open, initial])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const amountValue = Number(amount)
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError("Summani to'g'ri kiriting")
      return
    }
    if (!spentAt) {
      setError('Sanani tanlang')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSubmit({
        category,
        amount: amountValue,
        description: description.trim() || null,
        spent_at: spentAt,
      })
      onClose()
    } catch {
      setError("Saqlashda xatolik yuz berdi. Qayta urinib ko'ring.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Harajatni tahrirlash' : "Yangi harajat qo'shish"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">
            {error}
          </p>
        )}
        <div>
          <label className="mb-1 block font-label-caps text-label-caps text-on-surface-variant">
            Kategoriya
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block font-label-caps text-label-caps text-on-surface-variant">
              Summa (so'm)
            </label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              autoFocus
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="150000"
              type="text"
            />
          </div>
          <div>
            <label className="mb-1 block font-label-caps text-label-caps text-on-surface-variant">
              Sana
            </label>
            <input
              value={spentAt}
              onChange={(e) => setSpentAt(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              type="date"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block font-label-caps text-label-caps text-on-surface-variant">
            Tavsif (ixtiyoriy)
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Masalan: Bozor harajati"
            type="text"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-outline-variant py-2.5 font-title-sm text-title-sm text-on-surface transition-colors hover:bg-surface-container-low"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-primary py-2.5 font-title-sm text-title-sm text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-60"
          >
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
