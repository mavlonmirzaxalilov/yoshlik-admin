import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import type { Category, Product } from '../types'
import type { ProductInput } from '../lib/menu'

interface ProductFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (input: ProductInput) => Promise<void>
  categories: Category[]
  initial?: Product | null
}

export function ProductFormModal({
  open,
  onClose,
  onSubmit,
  categories,
  initial,
}: ProductFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setDescription(initial?.description ?? '')
    setPrice(initial ? String(initial.price) : '')
    setCategoryId(initial?.category_id ?? categories[0]?.id ?? '')
    setIsAvailable(initial?.is_available ?? true)
    setError(null)
  }, [open, initial, categories])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const priceValue = Number(price)
    if (!name.trim()) {
      setError('Taom nomini kiriting')
      return
    }
    if (!categoryId) {
      setError('Kategoriyani tanlang')
      return
    }
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setError("Narxni to'g'ri kiriting")
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        price: priceValue,
        category_id: categoryId,
        is_available: isAvailable,
      })
      onClose()
    } catch {
      setError("Saqlashda xatolik yuz berdi. Qayta urinib ko'ring.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Taomni tahrirlash" : "Yangi taom qo'shish"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">
            {error}
          </p>
        )}
        <div>
          <label className="mb-1 block font-label-caps text-label-caps text-on-surface-variant">
            Nomi
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Masalan: Osh"
            type="text"
          />
        </div>
        <div>
          <label className="mb-1 block font-label-caps text-label-caps text-on-surface-variant">
            Tavsif (ixtiyoriy)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Qisqa tavsif..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block font-label-caps text-label-caps text-on-surface-variant">
              Narx (so'm)
            </label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="35000"
              type="text"
            />
          </div>
          <div>
            <label className="mb-1 block font-label-caps text-label-caps text-on-surface-variant">
              Kategoriya
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-outline-variant px-3 py-2">
          <span className="font-body-md text-body-md text-on-surface">Mavjudligi</span>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="peer sr-only"
              type="checkbox"
            />
            <div className="peer h-5 w-9 rounded-full bg-outline-variant peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
          </label>
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
