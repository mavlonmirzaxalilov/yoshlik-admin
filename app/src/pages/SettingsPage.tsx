import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { ThemeToggleButton } from '../components/ThemeToggleButton'
import { Avatar } from '../components/Avatar'
import { AdminFormModal } from '../components/AdminFormModal'
import { formatSum } from '../lib/format'
import {
  SETTINGS_KEYS,
  fetchSettings,
  settingBool,
  settingNumber,
  upsertSettings,
  type SettingsMap,
} from '../lib/settings'
import {
  createAdmin,
  deleteAdmin,
  fetchAdmins,
  roleLabel,
  setAdminActive,
  type AdminInput,
} from '../lib/admins'
import type { Admin } from '../types'

type TabId = 'kafe' | 'buyurtma' | 'vaqt' | 'chek' | 'adminlar' | 'profil'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'kafe', label: 'Kafe ma\'lumotlari', icon: 'storefront' },
  { id: 'buyurtma', label: 'Buyurtma sozlamalari', icon: 'payments' },
  { id: 'vaqt', label: 'Ish vaqti', icon: 'schedule' },
  { id: 'chek', label: 'Chek sozlamalari', icon: 'receipt_long' },
  { id: 'adminlar', label: 'Adminlar', icon: 'group' },
  { id: 'profil', label: 'Profil', icon: 'person' },
]

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block font-label-caps text-label-caps text-on-surface-variant">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary'

function SaveButton({ saving, saved }: { saving: boolean; saved: boolean }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-title-sm text-title-sm text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-60"
    >
      {saving && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary" />
      )}
      {saving ? 'Saqlanmoqda...' : saved ? 'Saqlandi' : 'Saqlash'}
    </button>
  )
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.06)]">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <h3 className="font-title-sm text-title-sm font-semibold text-on-surface">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function useSectionSave(reload: () => void) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(entries: Record<string, string>) {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await upsertSettings(entries)
      setSaved(true)
      reload()
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError("Saqlashda xatolik yuz berdi. Qayta urinib ko'ring.")
    } finally {
      setSaving(false)
    }
  }

  return { saving, saved, error, save }
}

function CafeInfoSection({ settings, reload }: { settings: SettingsMap; reload: () => void }) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [telegram, setTelegram] = useState('')
  const [instagram, setInstagram] = useState('')
  const { saving, saved, error, save } = useSectionSave(reload)

  useEffect(() => {
    setName(settings[SETTINGS_KEYS.cafeName] ?? '')
    setAddress(settings[SETTINGS_KEYS.cafeAddress] ?? '')
    setPhone(settings[SETTINGS_KEYS.cafePhone] ?? '')
    setTelegram(settings[SETTINGS_KEYS.cafeTelegram] ?? '')
    setInstagram(settings[SETTINGS_KEYS.cafeInstagram] ?? '')
  }, [settings])

  return (
    <SectionCard title="Kafe ma'lumotlari" icon="storefront">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save({
            [SETTINGS_KEYS.cafeName]: name.trim(),
            [SETTINGS_KEYS.cafeAddress]: address.trim(),
            [SETTINGS_KEYS.cafePhone]: phone.trim(),
            [SETTINGS_KEYS.cafeTelegram]: telegram.trim(),
            [SETTINGS_KEYS.cafeInstagram]: instagram.trim(),
          })
        }}
        className="flex flex-col gap-4"
      >
        {error && (
          <p className="rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">{error}</p>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Kafe nomi">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} type="text" />
          </Field>
          <Field label="Manzil">
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} type="text" />
          </Field>
          <Field label="Telefon">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} type="text" placeholder="+998 90 123 45 67" />
          </Field>
          <Field label="Telegram">
            <input value={telegram} onChange={(e) => setTelegram(e.target.value)} className={inputClass} type="text" placeholder="@username" />
          </Field>
          <Field label="Instagram">
            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className={inputClass} type="text" placeholder="@username" />
          </Field>
        </div>
        <div className="pt-2">
          <SaveButton saving={saving} saved={saved} />
        </div>
      </form>
    </SectionCard>
  )
}

function OrderSettingsSection({ settings, reload }: { settings: SettingsMap; reload: () => void }) {
  const [containerPrice, setContainerPrice] = useState('')
  const [deliveryPrice, setDeliveryPrice] = useState('')
  const { saving, saved, error, save } = useSectionSave(reload)

  useEffect(() => {
    setContainerPrice(String(settingNumber(settings, SETTINGS_KEYS.containerPrice, 0)))
    setDeliveryPrice(String(settingNumber(settings, SETTINGS_KEYS.deliveryPrice, 0)))
  }, [settings])

  return (
    <SectionCard title="Buyurtma sozlamalari" icon="payments">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save({
            [SETTINGS_KEYS.containerPrice]: String(Number(containerPrice) || 0),
            [SETTINGS_KEYS.deliveryPrice]: String(Number(deliveryPrice) || 0),
          })
        }}
        className="flex flex-col gap-4"
      >
        {error && (
          <p className="rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">{error}</p>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Idish narxi (so'm)">
            <input
              value={containerPrice}
              onChange={(e) => setContainerPrice(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              className={inputClass}
              type="text"
              placeholder="3000"
            />
          </Field>
          <Field label="Yetkazish narxi (so'm)">
            <input
              value={deliveryPrice}
              onChange={(e) => setDeliveryPrice(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              className={inputClass}
              type="text"
              placeholder="15000"
            />
          </Field>
        </div>
        <div className="pt-2">
          <SaveButton saving={saving} saved={saved} />
        </div>
      </form>
    </SectionCard>
  )
}

function WorkTimeSection({ settings, reload }: { settings: SettingsMap; reload: () => void }) {
  const [open, setOpen] = useState('')
  const [close, setClose] = useState('')
  const { saving, saved, error, save } = useSectionSave(reload)

  useEffect(() => {
    setOpen(settings[SETTINGS_KEYS.workTimeOpen] ?? '')
    setClose(settings[SETTINGS_KEYS.workTimeClose] ?? '')
  }, [settings])

  return (
    <SectionCard title="Ish vaqti" icon="schedule">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save({
            [SETTINGS_KEYS.workTimeOpen]: open,
            [SETTINGS_KEYS.workTimeClose]: close,
          })
        }}
        className="flex flex-col gap-4"
      >
        {error && (
          <p className="rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">{error}</p>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Ochilish vaqti">
            <input value={open} onChange={(e) => setOpen(e.target.value)} className={inputClass} type="time" />
          </Field>
          <Field label="Yopilish vaqti">
            <input value={close} onChange={(e) => setClose(e.target.value)} className={inputClass} type="time" />
          </Field>
        </div>
        <div className="pt-2">
          <SaveButton saving={saving} saved={saved} />
        </div>
      </form>
    </SectionCard>
  )
}

function ReceiptSection({ settings, reload }: { settings: SettingsMap; reload: () => void }) {
  const [footer, setFooter] = useState('')
  const [showSplit, setShowSplit] = useState(false)
  const { saving, saved, error, save } = useSectionSave(reload)

  useEffect(() => {
    setFooter(settings[SETTINGS_KEYS.receiptFooter] ?? '')
    setShowSplit(settingBool(settings, SETTINGS_KEYS.receiptShowPersonSplit, false))
  }, [settings])

  return (
    <SectionCard title="Chek sozlamalari" icon="receipt_long">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save({
            [SETTINGS_KEYS.receiptFooter]: footer,
            [SETTINGS_KEYS.receiptShowPersonSplit]: showSplit ? 'true' : 'false',
          })
        }}
        className="flex flex-col gap-4"
      >
        {error && (
          <p className="rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">{error}</p>
        )}
        <Field label="Chek pastki matni">
          <textarea
            value={footer}
            onChange={(e) => setFooter(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
            placeholder="Xaridingiz uchun rahmat!"
          />
        </Field>
        <div className="flex items-center justify-between rounded-lg border border-outline-variant px-4 py-3">
          <div>
            <p className="font-body-md text-body-md text-on-surface">Kishi boshiga hisob ko'rsatilsinmi</p>
            <p className="mt-0.5 font-label-caps text-label-caps text-on-surface-variant">
              Chekda summani odamlar soniga bo'lib ko'rsatish
            </p>
          </div>
          <label className="relative inline-flex shrink-0 cursor-pointer items-center">
            <input
              checked={showSplit}
              onChange={(e) => setShowSplit(e.target.checked)}
              className="peer sr-only"
              type="checkbox"
            />
            <div className="peer h-5 w-9 rounded-full bg-outline-variant peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
          </label>
        </div>
        <div className="pt-2">
          <SaveButton saving={saving} saved={saved} />
        </div>
      </form>
    </SectionCard>
  )
}

function AdminsSection({
  admins,
  loading,
  reload,
  currentAdminId,
}: {
  admins: Admin[]
  loading: boolean
  reload: () => void
  currentAdminId: string | undefined
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleCreate(input: AdminInput) {
    await createAdmin(input)
    reload()
  }

  async function handleToggleActive(admin: Admin) {
    setBusyId(admin.id)
    setActionError(null)
    try {
      await setAdminActive(admin.id, !admin.is_active)
      reload()
    } catch {
      setActionError("Holatni yangilab bo'lmadi. Qayta urinib ko'ring.")
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(admin: Admin) {
    if (admin.id === currentAdminId) return
    if (!window.confirm(`Rostdan "${admin.full_name}" ni o'chirasizmi?`)) return
    setBusyId(admin.id)
    setActionError(null)
    try {
      await deleteAdmin(admin.id)
      reload()
    } catch {
      setActionError("Adminni o'chirib bo'lmadi. Qayta urinib ko'ring.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <SectionCard title="Adminlarni boshqarish" icon="group">
      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-container px-4 py-2 text-on-primary-container shadow-sm transition-colors hover:bg-primary-container/90"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          <span className="font-body-md text-body-md font-medium">Yangi admin</span>
        </button>
      </div>

      {actionError && (
        <p className="mb-4 rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container">
          {actionError}
        </p>
      )}

      {loading ? (
        <p className="py-6 text-center font-body-md text-body-md text-on-surface-variant">Yuklanmoqda...</p>
      ) : admins.length === 0 ? (
        <p className="py-6 text-center font-body-md text-body-md text-on-surface-variant">
          Hozircha adminlar yo'q
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/20 font-label-caps text-label-caps uppercase tracking-wider text-outline">
                <th className="p-3 font-semibold">Ism</th>
                <th className="p-3 font-semibold">Telegram ID</th>
                <th className="p-3 font-semibold">Roli</th>
                <th className="p-3 font-semibold">Holat</th>
                <th className="p-3 text-center font-semibold">Harakat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 font-body-md text-body-md text-on-surface">
              {admins.map((admin) => {
                const isSelf = admin.id === currentAdminId
                const busy = busyId === admin.id
                return (
                  <tr key={admin.id}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={admin.full_name} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container font-label-caps text-label-caps text-on-primary-container" />
                        <span>{admin.full_name}</span>
                        {isSelf && (
                          <span className="rounded bg-surface-variant px-1.5 py-0.5 font-label-caps text-label-caps text-on-surface-variant">
                            Siz
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-on-surface-variant">{admin.telegram_id}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-sm font-medium text-secondary">
                        {roleLabel(admin.role)}
                      </span>
                    </td>
                    <td className="p-3">
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          checked={admin.is_active}
                          disabled={busy}
                          onChange={() => handleToggleActive(admin)}
                          className="peer sr-only"
                          type="checkbox"
                        />
                        <div className="peer h-5 w-9 rounded-full bg-outline-variant peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
                      </label>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        disabled={isSelf || busy}
                        onClick={() => handleDelete(admin)}
                        title={isSelf ? "O'zingizni o'chira olmaysiz" : "O'chirish"}
                        className="rounded p-1 text-outline transition-colors hover:bg-error-container/30 hover:text-error disabled:pointer-events-none disabled:opacity-30"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <AdminFormModal open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreate} />
    </SectionCard>
  )
}

function ProfileSection() {
  const { admin, logout } = useAuth()

  return (
    <SectionCard title="Profil" icon="person">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar
            name={admin?.full_name}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-container font-title-sm text-title-sm text-on-primary-container"
          />
          <div>
            <p className="font-title-sm text-title-sm font-semibold text-on-surface">
              {admin?.full_name ?? '—'}
            </p>
            <p className="mt-0.5 font-body-md text-body-md text-on-surface-variant">
              Telegram ID: {admin?.telegram_id ?? '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-outline-variant px-4 py-3">
          <span className="font-body-md text-body-md text-on-surface-variant">Roli</span>
          <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-sm font-medium text-secondary">
            {admin ? roleLabel(admin.role) : '—'}
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 rounded-lg border border-error/30 py-2.5 font-title-sm text-title-sm text-error transition-colors hover:bg-error-container/30"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Chiqish
        </button>
      </div>
    </SectionCard>
  )
}

export function SettingsPage() {
  const { admin } = useAuth()
  const [tab, setTab] = useState<TabId>('kafe')

  const [settings, setSettings] = useState<SettingsMap>({})
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [settingsReloadToken, setSettingsReloadToken] = useState(0)

  const [admins, setAdmins] = useState<Admin[]>([])
  const [adminsLoading, setAdminsLoading] = useState(true)
  const [adminsReloadToken, setAdminsReloadToken] = useState(0)

  useEffect(() => {
    let active = true
    setSettingsLoading(true)
    fetchSettings()
      .then((data) => {
        if (active) {
          setSettings(data)
          setSettingsError(null)
        }
      })
      .catch((err) => {
        if (active) setSettingsError(err instanceof Error ? err.message : "Sozlamalarni yuklab bo'lmadi")
      })
      .finally(() => {
        if (active) setSettingsLoading(false)
      })
    return () => {
      active = false
    }
  }, [settingsReloadToken])

  useEffect(() => {
    let active = true
    setAdminsLoading(true)
    fetchAdmins()
      .then((data) => {
        if (active) setAdmins(data)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setAdminsLoading(false)
      })
    return () => {
      active = false
    }
  }, [adminsReloadToken])

  const reloadSettings = () => setSettingsReloadToken((t) => t + 1)
  const reloadAdmins = () => setAdminsReloadToken((t) => t + 1)

  const preview = useMemo(
    () => ({
      containerPrice: settingNumber(settings, SETTINGS_KEYS.containerPrice, 0),
      deliveryPrice: settingNumber(settings, SETTINGS_KEYS.deliveryPrice, 0),
    }),
    [settings],
  )

  return (
    <>
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-outline-variant bg-surface px-4 py-4 md:hidden">
        <h1 className="font-headline-md text-headline-md font-bold text-primary">Sozlamalar</h1>
        <ThemeToggleButton className="cursor-pointer rounded-full p-2 text-on-surface-variant transition-opacity hover:bg-surface-container-low active:opacity-70" />
      </header>

      {/* Desktop header */}
      <header className="sticky top-0 z-30 hidden w-full items-center justify-between border-b border-outline-variant/30 bg-surface px-8 py-4 md:flex">
        <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">Sozlamalar</h2>
        <div className="flex items-center gap-4">
          <ThemeToggleButton />
          <Avatar
            name={admin?.full_name}
            className="ml-2 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-outline-variant/30 bg-primary-container font-title-sm text-title-sm text-on-primary-container"
          />
        </div>
      </header>

      {settingsError && (
        <p className="mx-4 mt-4 rounded-lg bg-error-container px-4 py-2 text-sm text-on-error-container md:mx-8">
          {settingsError}
        </p>
      )}

      <main className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 font-label-caps text-label-caps transition-colors ${
                tab === t.id
                  ? 'bg-primary-container text-on-primary-container'
                  : 'border border-outline-variant bg-surface-container text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {settingsLoading && tab !== 'adminlar' && tab !== 'profil' ? (
          <p className="py-10 text-center font-body-md text-body-md text-on-surface-variant">Yuklanmoqda...</p>
        ) : (
          <div className={tab === 'adminlar' ? 'max-w-4xl' : 'max-w-2xl'}>
            {tab === 'kafe' && <CafeInfoSection settings={settings} reload={reloadSettings} />}
            {tab === 'buyurtma' && (
              <>
                <OrderSettingsSection settings={settings} reload={reloadSettings} />
                <p className="mt-3 font-label-caps text-label-caps text-on-surface-variant">
                  Joriy: idish {formatSum(preview.containerPrice)}, yetkazish {formatSum(preview.deliveryPrice)}
                </p>
              </>
            )}
            {tab === 'vaqt' && <WorkTimeSection settings={settings} reload={reloadSettings} />}
            {tab === 'chek' && <ReceiptSection settings={settings} reload={reloadSettings} />}
            {tab === 'adminlar' && (
              <AdminsSection
                admins={admins}
                loading={adminsLoading}
                reload={reloadAdmins}
                currentAdminId={admin?.id}
              />
            )}
            {tab === 'profil' && <ProfileSection />}
          </div>
        )}
      </main>
    </>
  )
}
