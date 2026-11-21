import {
  Activity,
  Bell,
  BookOpen,
  CloudSun,
  Database,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Leaf,
  MapPin,
  MessageCircleQuestion,
  ShieldCheck,
  Sprout,
  Store,
  Users,
  UserRound,
  UserCog,
  type LucideIcon,
} from 'lucide-react'
import type { UserRole } from './user'

export type DashboardRole = UserRole

export interface NavigationItem {
  label: string
  href: string
  icon: LucideIcon
}

interface DashboardNavigation {
  label: string
  basePath: string
  items: NavigationItem[]
}

export const dashboardNavigation: Record<DashboardRole, DashboardNavigation> = {
  farmer: {
    label: 'Farmer',
    basePath: '/farmer/dashboard',
    items: [
      { label: 'Overview', href: '/farmer/dashboard', icon: LayoutDashboard },
      { label: 'Profile', href: '/farmer/profile', icon: UserRound },
      { label: 'Farms', href: '/farmer/farms', icon: MapPin },
      { label: 'Crop information', href: '/farmer/crops', icon: Leaf },
      { label: 'Soil tests', href: '/farmer/soil-tests', icon: FlaskConical },
      { label: 'Recommendations', href: '/farmer/recommendations', icon: Sprout },
      { label: 'Questions', href: '/farmer/questions', icon: MessageCircleQuestion },
      { label: 'Weather', href: '/farmer/weather', icon: CloudSun },
      { label: 'Market prices', href: '/farmer/markets/prices', icon: Store },
      { label: 'Notifications', href: '/farmer/notifications', icon: Bell },
    ],
  },
  expert: {
    label: 'Agricultural Expert',
    basePath: '/expert/dashboard',
    items: [
      { label: 'Overview', href: '/expert/dashboard', icon: LayoutDashboard },
      { label: 'Question inbox', href: '/expert/questions', icon: MessageCircleQuestion },
      { label: 'Recommendations', href: '/expert/recommendations', icon: Sprout },
      { label: 'Soil records', href: '/expert/soil-tests', icon: FlaskConical },
      { label: 'Notifications', href: '/expert/notifications', icon: Bell },
    ],
  },
  dataManager: {
    label: 'Agricultural Data Manager',
    basePath: '/data/dashboard',
    items: [
      { label: 'Overview', href: '/data/dashboard', icon: LayoutDashboard },
      { label: 'Markets', href: '/data/markets', icon: Store },
      { label: 'Products', href: '/data/products', icon: Sprout },
      { label: 'Market prices', href: '/data/prices', icon: Database },
      { label: 'Reports', href: '/data/reports', icon: FileText },
    ],
  },
  admin: {
    label: 'Administrator',
    basePath: '/admin/dashboard',
    items: [
      { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Crop information', href: '/admin/crops', icon: Leaf },
      { label: 'Soil tests', href: '/admin/soil-tests', icon: FlaskConical },
      { label: 'Fertilizers', href: '/admin/fertilizers', icon: Sprout },
      { label: 'Public content', href: '/admin/content', icon: BookOpen },
      { label: 'Activity log', href: '/admin/activity', icon: Activity },
      { label: 'Reports', href: '/admin/reports', icon: FileText },
      { label: 'System access', href: '/admin/access', icon: ShieldCheck },
    ],
  },
  superadmin: {
    label: 'Superadministrator',
    basePath: '/superadmin/dashboard',
    items: [
      { label: 'Overview', href: '/superadmin/dashboard', icon: LayoutDashboard },
      { label: 'User management', href: '/superadmin/users', icon: UserCog },
    ],
  },
}
