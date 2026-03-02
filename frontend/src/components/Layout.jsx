import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  Receipt,
  Zap,
  Fuel,
  Droplet,
  Truck,
  FileText,
  AlertTriangle,
  Wrench,
  Navigation,
  User,
  AlertCircle,
  BarChart3,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/properties', icon: Building2, label: 'Properties' },
  { path: '/property-taxes', icon: Receipt, label: 'Property Taxes' },
  { path: '/electricity', icon: Zap, label: 'Electricity' },
  { path: '/gas', icon: Fuel, label: 'Gas' },
  { path: '/water', icon: Droplet, label: 'Water' },
  { path: '/vehicles', icon: Truck, label: 'Fleet' },
  { path: '/documents', icon: FileText, label: 'Documents' },
  { path: '/challans', icon: AlertTriangle, label: 'Challans' },
  { path: '/service', icon: Wrench, label: 'Service' },
  { path: '/gps', icon: Navigation, label: 'GPS & Trips' },
  { path: '/drivers', icon: User, label: 'Drivers' },
  { path: '/accidents', icon: AlertCircle, label: 'Accidents' },
  { path: '/alerts', icon: AlertCircle, label: 'Alerts' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' }
];

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: 0 }}
        animate={{ width: sidebarOpen ? '16rem' : '4rem' }}
        className="fixed left-0 top-0 h-full bg-slate-900 text-white border-r border-slate-700 z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              ERP System
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded transition-colors"
            data-testid="sidebar-toggle"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.path.replace('/', '')}`}
                className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-800 text-white border-l-4 border-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Logged in as</p>
              <p className="text-sm font-semibold truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-400">{user?.role}</p>
            </div>
          )}
          <button
            onClick={logout}
            data-testid="logout-button"
            className="w-full flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main
        className="flex-1 overflow-y-auto transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? '16rem' : '4rem' }}
      >
        {children}
      </main>
    </div>
  );
};
