import {
  Activity,
  Bell,
  Boxes,
  Building2,
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardCheck,
  LayoutDashboard,
  LogIn,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Sun,
  Wrench,
} from 'lucide-react'
import { useMemo, useState } from 'react'

type Theme = 'dark' | 'light'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Organization', icon: Building2 },
  { label: 'Assets', icon: Boxes },
  { label: 'Allocation', icon: ShieldCheck },
  { label: 'Bookings', icon: CalendarClock },
  { label: 'Maintenance', icon: Wrench },
  { label: 'Audit', icon: ClipboardCheck },
  { label: 'Reports', icon: ChartNoAxesCombined },
  { label: 'Notifications', icon: Bell },
]

const kpis = [
  { label: 'Available', value: '128', delta: '+8 this week' },
  { label: 'Allocated', value: '76', delta: '12 due soon' },
  { label: 'Maintenance', value: '4', delta: '2 high priority' },
  { label: 'Bookings', value: '9', delta: '3 active now' },
]

const activity = [
  'Laptop AF-0114 allocated to Priya Shah',
  'Room B2 booking confirmed, 2:00 to 3:00 PM',
  'Projector AF-0062 maintenance resolved',
]

export function App() {
  const [theme, setTheme] = useState<Theme>('dark')
  const ThemeIcon = theme === 'dark' ? Sun : Moon
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  const shellClassName = useMemo(() => `app-shell ${theme}`, [theme])

  return (
    <main className={shellClassName}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">AF</div>
          <div>
            <strong>AssetFlow</strong>
            <span>Enterprise assets</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {navItems.map((item) => (
            <button className={`nav-item ${item.active ? 'active' : ''}`} key={item.label}>
              <item.icon size={17} strokeWidth={1.9} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <span className="eyebrow">Signed in as</span>
          <strong>Admin Demo</strong>
          <span>Full access preview</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Today&apos;s overview</span>
            <h1>Asset operations</h1>
          </div>
          <div className="topbar-actions">
            <label className="search">
              <Search size={16} />
              <input placeholder="Search tag, serial, QR..." />
            </label>
            <button className="icon-button" onClick={() => setTheme(nextTheme)} aria-label="Toggle theme">
              <ThemeIcon size={17} />
            </button>
            <button className="primary-button">
              <Plus size={16} />
              Register asset
            </button>
          </div>
        </header>

        <section className="alert-strip">
          <Activity size={17} />
          <span>3 assets are overdue for return and need follow-up today.</span>
        </section>

        <section className="kpi-grid" aria-label="Operational KPIs">
          {kpis.map((kpi) => (
            <article className="panel kpi" key={kpi.label}>
              <span>{kpi.label}</span>
              <strong>{kpi.value}</strong>
              <small>{kpi.delta}</small>
            </article>
          ))}
        </section>

        <section className="content-grid">
          <article className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Allocation guardrail</span>
                <h2>AF-0114 is already assigned</h2>
              </div>
              <span className="status danger">Blocked</span>
            </div>
            <p className="muted">
              Direct re-allocation is blocked because Priya Shah currently holds this laptop. Submit a
              transfer request instead.
            </p>
            <div className="transfer-card">
              <span>From</span>
              <strong>Priya Shah</strong>
              <span>To</span>
              <strong>Raj Mehta</strong>
            </div>
            <button className="secondary-button">Submit transfer request</button>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Recent activity</span>
                <h2>Live system log</h2>
              </div>
              <span className="status">Synced</span>
            </div>
            <ul className="activity-list">
              {activity.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>
      </section>
    </main>
  )
}
