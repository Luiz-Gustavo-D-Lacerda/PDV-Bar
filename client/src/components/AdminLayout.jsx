import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Monitor, UtensilsCrossed, Grid2X2,
  Package, LogOut, Beer, Users, Palette
} from 'lucide-react';
import useAuthStore from '../store/auth';

const nav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/terminais', icon: Monitor, label: 'Terminais' },
  { to: '/admin/cardapio', icon: UtensilsCrossed, label: 'Cardápio' },
  { to: '/admin/mesas', icon: Grid2X2, label: 'Mesas' },
  { to: '/admin/estoque', icon: Package, label: 'Estoque' },
  { to: '/admin/garcons', icon: Users, label: 'Garçons' },
  { to: '/admin/aparencia', icon: Palette, label: 'Aparência' },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 text-white flex flex-col">
        <div className="p-5 flex items-center gap-3 border-b border-gray-700">
          <Beer className="text-green-400" size={24} />
          <span className="font-bold text-lg">PDV Bar</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2">{user?.nome}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
