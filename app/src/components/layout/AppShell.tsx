import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-body-md text-body-md text-on-background">
      <Sidebar />
      <div className="flex min-h-screen flex-col pb-24 md:ml-sidebar-width md:pb-0">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
