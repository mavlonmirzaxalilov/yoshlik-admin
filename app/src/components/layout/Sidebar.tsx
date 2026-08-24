import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { mainNavItems } from './navItems'

export function Sidebar() {
  const { admin, logout } = useAuth()

  return (
    <aside className="pin-light-theme fixed left-0 top-0 z-40 hidden h-full w-sidebar-width flex-col bg-on-surface md:flex">
      <div className="flex items-center gap-3 border-b border-surface/10 p-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container">
          <span className="material-symbols-outlined filled text-[24px] text-on-primary-container">
            restaurant
          </span>
        </div>
        <div>
          <h1 className="text-title-sm font-title-sm font-bold text-surface-bright">
            Yoshlik
          </h1>
          <p className="text-label-caps font-label-caps text-outline-variant/60">
            Admin Panel
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 ease-in-out ${
                isActive
                  ? 'border-l-4 border-primary-container bg-surface-variant/10 font-bold text-primary-container dark:text-primary-fixed-dim'
                  : 'text-outline-variant/50 hover:bg-surface-variant/5 hover:text-surface-bright'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-surface/10 p-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-outline-variant/50 transition-all duration-200 ease-in-out hover:bg-surface-variant/5 hover:text-surface-bright"
        >
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-surface/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
          <span className="flex-1 truncate text-left font-medium">
            {admin?.full_name ?? 'Admin'}
          </span>
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </div>
    </aside>
  )
}
