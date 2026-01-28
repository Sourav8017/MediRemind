'use client';

import { useState } from 'react';
import {
  Pill,
  Activity,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Heart,
  History,
  User,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { icon: LayoutDashboard, name: 'Dashboard', href: '/' },
  { icon: Pill, name: 'Medications', href: '/medications' },
  { icon: History, name: 'History', href: '/history' },
  { icon: Activity, name: 'Health Logs', href: '/health' },
  { icon: User, name: 'Profile', href: '/profile' },
  { icon: Bell, name: 'Reminders', href: '/reminders' },
  { icon: Settings, name: 'Settings', href: '/settings' },
];

const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Hide sidebar on auth pages
  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[var(--surface)] rounded-md shadow-md"
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar Container */}
      <aside className={`
                fixed md:static inset-y-0 left-0 z-40
                w-64 bg-[var(--surface)] border-r border-[var(--border)]
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
        <div className="h-full flex flex-col">
          {/* Logo area */}
          <div className="p-6 border-b border-[var(--border)]">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              <Heart className="text-blue-600 fill-blue-600" size={24} />
              MediRemind
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                        ${isActive
                      ? 'bg-[var(--primary)] text-white shadow-lg shadow-blue-500/20'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                    }
                                    `}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={20} className={isActive ? 'text-white' : ''} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--surface-hover)] mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {user?.email?.[0].toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate text-[var(--text-primary)]">
                  {user?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {user?.email || 'Guest'}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
