import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { ThemeToggleButton } from '../components/ThemeToggleButton'
import { Avatar } from '../components/Avatar'
import { ProductFormModal } from '../components/ProductFormModal'
import { formatSum } from '../lib/format'
import {
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchProducts,
  setProductAvailability,
  updateProduct,
  type ProductInput,
} from '../lib/menu'
import type { Category, Product } from '../types'

function ProductImage({ available }: { available: boolean }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-surface-container-high text-3xl text-outline ${!available ? 'grayscale-[30%]' : ''}`}
    >
      <span className="material-symbols-outlined text-[32px]">restaurant</span>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input readOnly checked={checked} onClick={onChange} className="peer sr-only" type="checkbox" />
      <div className="peer h-5 w-9 rounded-full bg-outline-variant peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
    </label>
  )
}

export function MenuPage() {
  const { admin } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<'all' | string>('all')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchCategories(), fetchProducts()])
      .then(([cats, prods]) => {
        if (cancelled) return
        setCategories(cats)
        setProducts(prods)
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Menyuni yuklab bo'lmadi")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products.filter((p) => !term || p.name.toLowerCase().includes(term))
  }, [products, search])

  const sections = useMemo(() => {
    const cats = activeCategory === 'all' ? categories : categories.filter((c) => c.id === activeCategory)
    return cats
      .map((cat) => ({
        category: cat,
        items: filteredProducts
          .filter((p) => p.category_id === cat.id)
          .sort((a, b) => a.sort_order - b.sort_order),
      }))
      .filter((section) => section.items.length > 0)
  }, [categories, filteredProducts, activeCategory])

  function openCreateForm() {
    setEditingProduct(null)
    setFormOpen(true)
  }

  function openEditForm(product: Product) {
    setEditingProduct(product)
    setFormOpen(true)
  }

  async function handleFormSubmit(input: ProductInput) {
    if (editingProduct) {
      const updated = await updateProduct(editingProduct.id, input)
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } else {
      const created = await createProduct(input)
      setProducts((prev) => [...prev, created])
    }
  }

  async function handleToggleAvailability(product: Product) {
    const nextValue = !product.is_available
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_available: nextValue } : p)),
    )
    try {
      await setProductAvailability(product.id, nextValue)
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_available: product.is_available } : p)),
      )
      window.alert("Mavjudlikni yangilab bo'lmadi. Qayta urinib ko'ring.")
    }
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`Rostdan "${product.name}" taomini o'chirasizmi?`)) return
    setDeletingId(product.id)
    try {
      await deleteProduct(product.id)
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
    } catch {
      window.alert("Taomni o'chirib bo'lmadi. Qayta urinib ko'ring.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-outline-variant bg-surface px-4 py-4 dark:border-outline dark:bg-surface-container-lowest md:hidden">
        <div className="flex items-center gap-3">
          <Avatar name={admin?.full_name} />
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed-dim">
              Xush kelibsiz!
            </h1>
            <p className="font-label-caps text-label-caps text-on-surface-variant">
              Admin profili
            </p>
          </div>
        </div>
        <ThemeToggleButton className="rounded-full p-2 text-on-surface-variant transition-opacity hover:bg-surface-container-low active:opacity-70 dark:hover:bg-surface-container-highest" />
      </header>

      {/* Desktop header */}
      <header className="sticky top-0 z-30 hidden w-full items-center justify-between border-b border-outline-variant/30 bg-surface px-8 py-4 md:flex">
        <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">Menyu</h2>
        <div className="flex items-center gap-4">
          <ThemeToggleButton />
          <button className="rounded-full p-2 text-on-surface-variant transition-transform scale-95 active:scale-90 hover:bg-surface-container-low">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <Avatar
            name={admin?.full_name}
            className="ml-2 h-10 w-10 overflow-hidden rounded-full border border-outline-variant/30 bg-primary-container flex items-center justify-center font-title-sm text-title-sm text-on-primary-container"
          />
        </div>
      </header>

      {loading && <p className="p-8 text-center text-on-surface-variant">Yuklanmoqda...</p>}
      {!loading && loadError && <p className="p-8 text-center text-error">{loadError}</p>}

      {!loading && !loadError && (
        <>
          {/* Mobile content */}
          <main className="flex flex-col gap-4 p-4 md:hidden">
            <div className="flex items-center justify-between">
              <h2 className="font-title-sm text-title-sm">Menyu</h2>
              <button
                onClick={openCreateForm}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-body-md text-body-md text-on-primary transition-colors hover:bg-on-primary-fixed-variant"
              >
                <span className="material-symbols-outlined">add</span>
                Yangi taom
              </button>
            </div>
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-4 font-body-md text-body-md focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Qidirish..."
                type="text"
              />
            </div>
            <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={`whitespace-nowrap rounded-full px-4 py-2 font-label-caps text-label-caps ${
                  activeCategory === 'all'
                    ? 'bg-primary-container text-on-primary-container'
                    : 'border border-outline-variant bg-surface-container text-on-surface'
                }`}
              >
                Hammasi
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 font-label-caps text-label-caps ${
                    activeCategory === cat.id
                      ? 'bg-primary-container text-on-primary-container'
                      : 'border border-outline-variant bg-surface-container text-on-surface'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {sections.length === 0 && (
              <p className="py-8 text-center text-on-surface-variant">Taomlar topilmadi</p>
            )}

            <div className="flex flex-col gap-6">
              {sections.map(({ category, items }) => (
                <div key={category.id} className="flex flex-col gap-3">
                  {activeCategory === 'all' && (
                    <h3 className="font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant">
                      {category.name}
                    </h3>
                  )}
                  <div className="flex flex-col gap-4">
                    {items.map((product) => (
                      <div
                        key={product.id}
                        className={`flex gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] ${
                          !product.is_available ? 'opacity-70' : ''
                        }`}
                      >
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                          <ProductImage available={product.is_available} />
                        </div>
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between">
                              <h3 className="font-title-sm text-title-sm">{product.name}</h3>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => openEditForm(product)}
                                  className="text-outline hover:text-primary"
                                >
                                  <span className="material-symbols-outlined text-[20px]">edit</span>
                                </button>
                                <button
                                  onClick={() => handleDelete(product)}
                                  disabled={deletingId === product.id}
                                  className="text-outline hover:text-error disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                              </div>
                            </div>
                            {product.description && (
                              <p className="mt-0.5 line-clamp-1 text-xs text-on-surface-variant">
                                {product.description}
                              </p>
                            )}
                            <span className="mt-1 inline-block rounded-md bg-surface-container px-2 py-0.5 font-label-caps text-label-caps text-on-surface-variant">
                              {category.name}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-title-sm text-title-sm text-primary">
                              {formatSum(product.price)}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-label-caps text-label-caps ${
                                  product.is_available ? 'text-success' : 'text-error'
                                }`}
                              >
                                {product.is_available ? 'Mavjud' : 'Tugadi'}
                              </span>
                              <Toggle
                                checked={product.is_available}
                                onChange={() => handleToggleAvailability(product)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </main>

          {/* Desktop content */}
          <div className="hidden flex-1 flex-col gap-6 p-8 md:flex">
            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm md:flex-row md:items-center">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={openCreateForm}
                  className="rounded-full bg-primary-container px-4 py-2 text-status-badge font-status-badge text-on-primary-container shadow-sm transition-shadow hover:shadow-md"
                >
                  + Yangi taom qo'shish
                </button>
                <div className="mx-2 hidden h-8 w-px bg-outline-variant/40 md:block" />
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`rounded-full border px-4 py-2 font-label-caps text-label-caps transition-colors ${
                    activeCategory === 'all'
                      ? 'border-outline-variant/30 bg-surface-variant text-on-surface'
                      : 'border-outline-variant/30 bg-surface text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  Hammasi
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`rounded-full border px-4 py-2 font-label-caps text-label-caps transition-colors ${
                      activeCategory === cat.id
                        ? 'border-outline-variant/30 bg-surface-variant text-on-surface'
                        : 'border-outline-variant/30 bg-surface text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              <div className="relative w-full md:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                  search
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-full border border-outline-variant/50 bg-surface py-2 pl-10 pr-4 font-body-md text-body-md transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Qidirish..."
                  type="text"
                />
              </div>
            </div>

            {sections.length === 0 && (
              <p className="py-8 text-center text-on-surface-variant">Taomlar topilmadi</p>
            )}

            <div className="flex flex-col gap-8">
              {sections.map(({ category, items }) => (
                <div key={category.id} className="flex flex-col gap-4">
                  {activeCategory === 'all' && (
                    <h3 className="font-title-sm text-title-sm text-on-surface">{category.name}</h3>
                  )}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map((product) => (
                      <div
                        key={product.id}
                        className={`group flex flex-col overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-sm transition-shadow hover:shadow-md ${
                          !product.is_available ? 'opacity-75' : ''
                        }`}
                      >
                        <div className="relative h-48 overflow-hidden bg-surface-container-high">
                          <div className="h-full w-full transition-transform duration-300 group-hover:scale-105">
                            <ProductImage available={product.is_available} />
                          </div>
                          <div className="absolute left-3 top-3 rounded bg-surface-container-lowest/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface backdrop-blur-sm">
                            {category.name}
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col gap-2 p-4">
                          <h3 className="truncate font-title-sm text-title-sm text-on-surface">
                            {product.name}
                          </h3>
                          {product.description && (
                            <p className="line-clamp-2 text-sm text-on-surface-variant">
                              {product.description}
                            </p>
                          )}
                          <p
                            className={`font-headline-md text-headline-md ${
                              product.is_available ? 'text-primary-container' : 'text-outline'
                            }`}
                          >
                            {formatSum(product.price)}
                          </p>
                          <div className="mt-auto flex items-center justify-between border-t border-outline-variant/20 pt-4">
                            <div className="flex items-center gap-2">
                              <Toggle
                                checked={product.is_available}
                                onChange={() => handleToggleAvailability(product)}
                              />
                              <span
                                className={`font-label-caps text-label-caps ${
                                  product.is_available ? 'text-success' : 'text-error'
                                }`}
                              >
                                {product.is_available ? 'Mavjud' : 'Tugadi'}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => openEditForm(product)}
                                className="rounded-lg p-2 text-outline transition-colors hover:bg-surface-container-low hover:text-primary"
                              >
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleDelete(product)}
                                disabled={deletingId === product.id}
                                className="rounded-lg p-2 text-outline transition-colors hover:bg-error-container/50 hover:text-error disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <ProductFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        categories={categories}
        initial={editingProduct}
      />
    </>
  )
}
