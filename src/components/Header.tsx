'use client';

import { Menu, Bell, LogOut, ChevronDown } from 'lucide-react';
import SearchBar from './SearchBar';
import { useEffect, useState, useRef } from 'react';
import { getOverdueTasks } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [overdueCount, setOverdueCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const timeStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  useEffect(() => {
    setOverdueCount(getOverdueTasks().length);
    const interval = setInterval(() => setOverdueCount(getOverdueTasks().length), 30000);
    return () => clearInterval(interval);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const roleColor: Record<string, string> = {
    Admin: 'var(--accent-rose)',
    Manager: 'var(--accent-amber)',
    Staff: 'var(--accent-blue)',
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="hamburger" onClick={onMenuClick}>
          <Menu size={22} />
        </button>
        <div className="header-greeting">
          <h2>{greeting} 👋</h2>
          <p>{timeStr}</p>
        </div>
      </div>
      <div className="header-right">
        <SearchBar />
        <div className="header-bell-wrap">
          <Bell size={20} style={{ color: 'var(--text-secondary)' }} />
          {overdueCount > 0 && (
            <span className="header-bell-badge">{overdueCount}</span>
          )}
        </div>

        {/* User Menu */}
        <div className="header-user-wrap" ref={menuRef}>
          <button
            className="header-user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div
              className="header-user-avatar"
              style={{ background: user?.color || 'var(--gradient-primary)' }}
            >
              {user?.initials || 'ML'}
            </div>
            <ChevronDown size={14} className={`header-chevron ${showUserMenu ? 'open' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="header-user-menu">
              <div className="header-user-info">
                <div
                  className="header-user-avatar-lg"
                  style={{ background: user?.color || '#6366f1' }}
                >
                  {user?.initials || 'ML'}
                </div>
                <div>
                  <div className="header-user-name">{user?.name || 'User'}</div>
                  <div className="header-user-email">{user?.email || ''}</div>
                  <span
                    className="header-user-role"
                    style={{
                      color: roleColor[user?.role || 'Staff'],
                      borderColor: roleColor[user?.role || 'Staff'],
                    }}
                  >
                    {user?.role}
                  </span>
                </div>
              </div>
              <div className="header-user-menu-divider" />
              <button className="header-user-menu-item logout" onClick={logout}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
