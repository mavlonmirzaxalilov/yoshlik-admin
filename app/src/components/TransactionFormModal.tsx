import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import type { TransactionType } from '../types'
import type { TransactionInput } from '../lib/transactions'

interface TransactionFormModalProps {
  open: boolean
  type: TransactionType
  onClose: () => void
  onSubmit: (input: TransactionInput) => Promise<void>
}

export function TransactionFormModal({ open, type, onClose, onSubmit }: TransactionFormModalProps) {
  const [amount, setAmount] = useState('')
  const [account, setAccount] = useState('naqd')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isIncome = type === 'kirim'

  useEffect(() => {
    if (!open) return
    setAmount('')
    setAccount('naqd')
    setDescription('')
    setError(null)
  }, [open])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const amountValue = Number(amount)
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError("Summani to'g'ri kiriting")
      return
    }
    if (!description.trim()) {
      setError('Tavsifni kiriting')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSubmit({
        type,
        amount: amountValue,
        account,
        description: description.trim(),
      })
      onClose()
    } catch {
      setError("Saqlashda xatolik yuz berdi. Qayta urinib ko'ring.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isIncome ? 'Kirim qo\'shish' : "Chiqim qo'shish"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">
            {error}
          </p>
        )}
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
            placeholder="50000"
            type="text"
          />
        </div>
        <div>
          <label className="mb-1 block font-label-caps text-label-caps text-on-surface-variant">
            Hisob
          </label>
          <select
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="naqd">Naqd</option>
            <option value="karta">Karta</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block font-label-caps text-label-caps text-on-surface-variant">
            Tavsif
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder={isIncome ? 'Masalan: Naqd kirim' : 'Masalan: Bozor harajati'}
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
            className={`flex-1 rounded-lg py-2.5 font-title-sm text-title-sm text-on-primary transition-colors disabled:opacity-60 ${
              isIncome ? 'bg-success hover:bg-success/90' : 'bg-error hover:bg-error/90'
            }`}
          >
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
