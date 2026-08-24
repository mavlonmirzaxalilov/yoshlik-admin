export interface NavItem {
  to: string
  label: string
  icon: string
  mobileIcon?: string
  mobileLabel?: string
}

export const mainNavItems: NavItem[] = [
  { to: '/', label: 'Boshqaruv paneli', icon: 'dashboard', mobileIcon: 'home', mobileLabel: 'Asosiy' },
  { to: '/buyurtmalar', label: 'Buyurtmalar', icon: 'shopping_cart', mobileIcon: 'receipt_long' },
  { to: '/menyu', label: 'Menyu', icon: 'restaurant_menu', mobileIcon: 'restaurant' },
  { to: '/kassa', label: 'Kassa', icon: 'payments', mobileIcon: 'account_balance_wallet' },
  { to: '/harajatlar', label: 'Harajatlar', icon: 'account_balance_wallet' },
  { to: '/statistika', label: 'Statistika', icon: 'bar_chart' },
  { to: '/sozlamalar', label: 'Sozlamalar', icon: 'settings' },
]

export const mobileTabItems = mainNavItems.slice(0, 4)
export const mobileMoreItems = mainNavItems.slice(4)
