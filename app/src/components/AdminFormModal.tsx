import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { ADMIN_ROLES, type AdminInput } from '../lib/admins'

interface AdminFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (input: AdminInput) => Promise<void>
}

export function AdminFormModal({ open, onClose, onSubmit }: AdminFormModalProps) {
  const [fullName, setFullName] = useState('')
  const [telegramId, setTelegramId] = useState('')
  const [role, setRole] = useState(ADMIN_ROLES[0].value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFullName('')
    setTelegramId('')
    setRole(ADMIN_ROLES[0].value)
    setError(null)
  }, [open])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const telegramIdValue = Number(telegramId)
    if (!fullName.trim()) {
      setError("Ismini kiriting")
      return
    }
    if (!telegramId || !Number.isFinite(telegramIdValue) || telegramIdValue <= 0) {
      setError("Telegram ID ni to'g'ri kiriting")
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSubmit({
        full_name: fullName.trim(),
        telegram_id: telegramIdValue,
        role,
      })
      onClose()
    } catch {
      setError("Saqlashda xatolik yuz berdi. Qayta urinib ko'ring.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Yangi admin">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">
            {error}
          </p>
        )}
        <div>
          <label className="mb-1 block font-label-caps text-label-caps text-on-surface-variant">
            To'liq ismi
          </label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Masalan: Aziz Karimov"
            type="text"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block font-label-caps text-label-caps text-on-surface-variant">
              Telegram ID
            </label>
            <input
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="123456789"
              type="text"
            />
          </div>
          <div>
            <label className="mb-1 block font-label-caps text-label-caps text-on-surface-variant">
              Roli
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {ADMIN_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
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
