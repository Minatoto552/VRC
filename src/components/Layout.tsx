import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const navigationItems = [
  ['/', 'ホーム'],
  ['/calendar', '活動予定'],
  ['/members', '部員紹介'],
  ['/join', '入部案内'],
  ['/lottery', '抽選受付'],
  ['/faq', 'よくある質問'],
] as const;

export function Layout() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="site-header">
        <NavLink to="/" className="brand">
          ☕ 2026 Event Café
        </NavLink>
        <button className="menu" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
          メニュー
        </button>
        <nav className={isOpen ? 'open' : ''} aria-label="公開サイトのナビゲーション">
          {navigationItems.map(([to, label]) => (
            <NavLink key={to} to={to} onClick={() => setIsOpen(false)}>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <p>2026年3月同期会イベント部</p>
        <p>当サイトおよびイベントは、VRChat Inc.が運営・協賛するものではありません。</p>
        <NavLink to="/admin">運営用ページ</NavLink>
        <small>© 2026 Event Café</small>
      </footer>
    </>
  );
}
