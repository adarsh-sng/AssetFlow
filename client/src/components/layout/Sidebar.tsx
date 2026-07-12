import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Boxes,
  ArrowLeftRight,
  CalendarClock,
  Wrench,
  ClipboardCheck,
  ChartNoAxesCombined,
  Bell,
  Hexagon,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
  { label: 'Org Setup', icon: Building2, to: '/org-setup' },
  { label: 'Assets', icon: Boxes, to: '/assets' },
  { label: 'Allocation', icon: ArrowLeftRight, to: '/allocation' },
  { label: 'Booking', icon: CalendarClock, to: '/booking' },
  { label: 'Maintenance', icon: Wrench, to: '/maintenance' },
]

const systemItems = [
  { label: 'Audit', icon: ClipboardCheck, to: '/audit' },
  { label: 'Reports', icon: ChartNoAxesCombined, to: '/reports' },
  { label: 'Notifications', icon: Bell, to: '/notifications' },
]

export function Sidebar() {
  return (
    <aside className="flex flex-col gap-7 min-h-screen w-[240px] border-r border-border-subtle bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center border border-foreground bg-accent text-white">
          <Hexagon size={18} strokeWidth={2.5} />
        </div>
        <span className="text-sm font-bold tracking-wide uppercase">AssetFlow</span>
      </div>

      <nav className="flex flex-col gap-1" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-foreground text-background shadow-hard'
                  : 'text-foreground/60 hover:text-foreground'
              }`
            }
          >
            <item.icon size={17} strokeWidth={1.9} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <span className="mt-4 mb-1 text-2xs font-bold uppercase tracking-widest text-foreground/40 px-4">
          System
        </span>

        {systemItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-foreground text-background shadow-hard'
                  : 'text-foreground/60 hover:text-foreground'
              }`
            }
          >
            <item.icon size={17} strokeWidth={1.9} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-3 border border-border-subtle bg-background p-3">
        <div className="grid size-9 place-items-center rounded-full bg-foreground text-background text-xs font-bold">
          AS
        </div>
        <div className="leading-tight">
          <div className="text-xs font-bold">ADMIN USER</div>
          <div className="text-xs text-foreground/50">Super Administrator</div>
        </div>
      </div>
    </aside>
  )
}
