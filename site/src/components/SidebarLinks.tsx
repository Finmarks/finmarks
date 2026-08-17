import { useEffect, useState } from 'react';
import { Monitor, Sun, Moon } from 'lucide-react';

interface SidebarLinksProps {
  currentPath?: string;
}

export default function SidebarLinks({ currentPath = '' }: SidebarLinksProps) {
  const isActive = (path: string) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <div className="rail-header">
        <a className="brand" href="/" aria-label="Finmarks">
          <img src="/finmark_light.svg" alt="Finmarks" className="logo-light brand-logo" />
          <img src="/finmark_dark.svg" alt="Finmarks" className="logo-dark brand-logo" />
        </a>
      </div>
      <div className="rail-links">
        <a href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
          <span className="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          </span>
          Home
        </a>
        <a href="/browse" className={`nav-link ${isActive('/browse') ? 'active' : ''}`}>
          <span className="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>
          </span>
          Browse All
        </a>
        <a href="/categories" className={`nav-link ${isActive('/categories') ? 'active' : ''}`}>
          <span className="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
          </span>
          Categories
        </a>
        <a href="/docs" className={`nav-link ${isActive('/docs') ? 'active' : ''}`}>
          <span className="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
          </span>
          Documentation
        </a>
      </div>
    </>
  );
}

export function SidebarBottom() {
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bb-theme');
      if (saved === 'dark' || saved === 'system') {
        setThemeMode(saved);
      } else {
        setThemeMode('light');
      }
    } catch (e) {}

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'bb-theme') {
        const val = e.newValue;
        if (val === 'dark' || val === 'light') {
          setThemeMode(val);
          document.documentElement.setAttribute('data-theme', val);
        } else if (val === 'system') {
          setThemeMode('system');
          document.documentElement.removeAttribute('data-theme');
        } else {
          setThemeMode('light');
          document.documentElement.setAttribute('data-theme', 'light');
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleThemeChange = (mode: 'system' | 'light' | 'dark') => {
    setThemeMode(mode);
    try {
      if (mode === 'system') {
        localStorage.setItem('bb-theme', 'system');
        document.documentElement.removeAttribute('data-theme');
      } else {
        localStorage.setItem('bb-theme', mode);
        document.documentElement.setAttribute('data-theme', mode);
      }
    } catch (e) {}
  };

  return (
    <div className="rail-bottom">
      <div className="nav-link" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
        <span className="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
        </span>
        GitHub
        <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--line)', marginLeft: 'auto', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Soon</span>
      </div>
      <div className="nav-link" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
        <span className="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" /><path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" /><path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" /><path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" /><path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" /></svg>
        </span>
        Figma file
        <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--line)', marginLeft: 'auto', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Soon</span>
      </div>
      <div className="theme-segmented-control" role="group" aria-label="Theme selection">
        <button
          type="button"
          className={`theme-segmented-btn ${themeMode === 'system' ? 'active' : ''}`}
          aria-pressed={themeMode === 'system'}
          title="System preference"
          aria-label="System theme"
          onClick={() => handleThemeChange('system')}
        >
          <Monitor size={13} strokeWidth={2} />
        </button>
        <button
          type="button"
          className={`theme-segmented-btn ${themeMode === 'light' ? 'active' : ''}`}
          aria-pressed={themeMode === 'light'}
          title="Light theme"
          aria-label="Light theme"
          onClick={() => handleThemeChange('light')}
        >
          <Sun size={13} strokeWidth={2} />
        </button>
        <button
          type="button"
          className={`theme-segmented-btn ${themeMode === 'dark' ? 'active' : ''}`}
          aria-pressed={themeMode === 'dark'}
          title="Dark theme"
          aria-label="Dark theme"
          onClick={() => handleThemeChange('dark')}
        >
          <Moon size={13} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
