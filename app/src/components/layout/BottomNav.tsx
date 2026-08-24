import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { mobileMoreItems, mobileTabItems } from './navItems'

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const isMoreActive = mobileMoreItems.some((item) => item.to === location.pathname)

  return (
    <>
      {moreOpen && (
        <button
          aria-label="Yopish"
          onClick={() => setMoreOpen(false)}
          className="fixed inset-0 z-40 bg-on-background/30 md:hidden"
        />
      )}
      <nav className="fixed bottom-0 z-50 flex w-full items-center justify-around bg-surface px-4 py-2 shadow-[0px_-1px_3px_rgba(0,0,0,0.1)] dark:bg-surface-container-lowest md:hidden pb-safe">
        {moreOpen && (
          <div className="absolute bottom-full right-4 mb-2 w-56 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-lg">
            {mobileMoreItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-body-md font-body-md transition-colors ${
                    isActive
                      ? 'bg-surface-container-low text-primary font-semibold'
                      : 'text-on-surface hover:bg-surface-container-low'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
        {mobileTabItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex w-16 scale-95 flex-col items-center justify-center rounded-lg p-2 transition-transform transition-colors active:scale-90 hover:bg-surface-container-high ${
                isActive
                  ? 'font-bold text-primary dark:text-primary-fixed-dim'
                  : 'text-outline dark:text-outline-variant'
              }`
            }
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              {item.mobileIcon}
            </span>
            <span className="mt-1 font-label-caps text-label-caps">
              {item.mobileLabel ?? item.label}
            </span>
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className={`flex w-16 scale-95 flex-col items-center justify-center rounded-lg p-2 transition-transform transition-colors active:scale-90 hover:bg-surface-container-high ${
            isMoreActive || moreOpen
              ? 'font-bold text-primary dark:text-primary-fixed-dim'
              : 'text-outline dark:text-outline-variant'
          }`}
        >
          <span className="material-symbols-outlined">menu</span>
          <span className="mt-1 font-label-caps text-label-caps">Yana</span>
        </button>
      </nav>
    </>
  )
}
