import type { ComponentType } from 'react'
import type { Role } from '../context/AuthContext'
import { ClipboardListIcon, ShoppingCartIcon, WalletIcon, TrendingUpIcon } from '../components/Icons/Icons'

export interface NavItem {
  label: string
  path: string
  icon: ComponentType<{ className?: string }>
  description: string
  requiredRole?: Role
}

export const projectNavItems: NavItem[] = [
  {
    label: 'Task Management Dashboard',
    path: '/task-management-dashboard',
    icon: ClipboardListIcon,
    description: 'Plan, assign, and track tasks across your team.',
    requiredRole: 'admin',
  },
  {
    label: 'E-commerce Admin Dashboard',
    path: '/ecommerce-admin-dashboard',
    icon: ShoppingCartIcon,
    description: 'Manage orders, inventory, and storefront settings.',
  },
  {
    label: 'Expense Tracker',
    path: '/expense-tracker',
    icon: WalletIcon,
    description: 'Log expenses and monitor spending across categories.',
  },
  {
    label: 'Investment Portfolio Dashboard',
    path: '/investment-portfolio-dashboard',
    icon: TrendingUpIcon,
    description: 'Track holdings, performance, and portfolio allocation.',
  },
]
