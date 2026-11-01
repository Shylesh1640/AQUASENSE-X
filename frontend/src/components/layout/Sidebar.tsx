import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Cpu,
  Droplets,
  Filter,
  Brain,
  Recycle,
  Bell,
  BarChart3,
  Settings,
  Info,
  ChevronLeft,
  ChevronRight,
  Waves,
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/monitoring', label: 'Live Monitoring', icon: Activity },
  { path: '/simulator', label: 'Sensor Simulator', icon: Cpu },
  { path: '/quality', label: 'Water Quality', icon: Droplets },
  { path: '/treatment', label: 'Treatment Control', icon: Filter },
  { path: '/filters', label: 'Filter Intelligence', icon: Brain },
  { path: '/recovery', label: 'RO Recovery', icon: Recycle },
  { path: '/alerts', label: 'Alerts & Events', icon: Bell },
  { path: '/analytics', label: 'Historical Analytics', icon: BarChart3 },
  { path: '/settings', label: 'System Settings', icon: Settings },
  { path: '/about', label: 'About', icon: Info },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen bg-[#101D2D] text-white flex flex-col z-40 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex items-center h-16 px-4 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#1677C8] to-[#27B8D5] flex items-center justify-center">
            <Waves className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-wide truncate">AQUASENSE-X</h1>
              <p className="text-[10px] text-white/50 truncate">Water Intelligence</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )
                }
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-2 border-t border-white/10">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
