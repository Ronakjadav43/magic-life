'use client';

import { Menu, Bell } from 'lucide-react';
import SearchBar from './SearchBar';
import { useEffect, useState } from 'react';
import { getOverdueTasks } from '@/lib/store';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [overdueCount, setOverdueCount] = useState(0);

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
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          ML
        </div>
      </div>
    </header>
  );
}
