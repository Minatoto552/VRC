import { CircleAlert, Menu, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import type { PublicContent } from '../../shared/models';
import logoImage from '../assets/shikitsukika-logo.svg';
import { defaultSiteSubtitle } from '../lib/site-settings';

interface SiteLayoutProps {
  content: PublicContent;
  loading: boolean;
  runtimeNotice: string | null;
  children: ReactNode;
}

const navigationItems = [
  { to: '/', label: 'ホーム' },
  { to: '/concept', label: 'イベント紹介' },
  { to: '/schedule', label: '活動予定' },
  { to: '/members', label: '部員紹介' },
  { to: '/join', label: '入部案内' },
  { to: '/photos', label: '写真' },
  { to: '/faq', label: 'FAQ' },
];

export const SiteLayout = ({ content, loading, runtimeNotice, children }: SiteLayoutProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isHomeRoute = location.pathname === '/';

  return (
    <div className={`site-shell ${isHomeRoute ? 'is-home-route' : ''}`}>
      <div
        className={`site-panel ${isAdminRoute ? 'is-admin-route' : ''} ${
          menuOpen ? 'is-menu-open' : ''
        }`}
      >
        <header className={`site-header ${isAdminRoute ? 'is-admin-header' : ''}`}>
          <NavLink to="/" className="brand-mark" onClick={() => setMenuOpen(false)}>
            <img src={logoImage} alt="" className="brand-logo-image" />
            <span className="sr-only">
              {content.settings.siteName} {defaultSiteSubtitle}
            </span>
          </NavLink>

          {isAdminRoute ? (
            <NavLink to="/" className="secondary-button inline-button header-home-link">
              公開サイトへ戻る
            </NavLink>
          ) : (
            <>
              <button
                type="button"
                className="menu-toggle"
                aria-expanded={menuOpen}
                aria-controls="site-navigation"
                aria-label={menuOpen ? 'メニューを閉じる' : 'メニューを開く'}
                onClick={() => setMenuOpen((current) => !current)}
              >
                {menuOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
              </button>

              <nav
                id="site-navigation"
                className={`site-navigation ${menuOpen ? 'is-open' : ''}`}
                aria-label="メインナビゲーション"
              >
                {navigationItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </>
          )}
        </header>

        {loading ? (
          <div className="loading-banner" role="status" aria-live="polite">
            最新の公開情報を読み込んでいます。
          </div>
        ) : null}

        {!loading && runtimeNotice ? (
          <div className="runtime-banner" role="status" aria-live="polite">
            <CircleAlert size={18} aria-hidden="true" />
            <div>
              <strong>表示モードを切り替えました</strong>
              <p>{runtimeNotice}</p>
            </div>
          </div>
        ) : null}

        <main>{children}</main>

        <footer className="site-footer">
          <div>
            <strong>{content.settings.siteName}</strong>
            <p>
              2026年3月同期会キャスト部による非公式イベントです。VRChat Inc.が運営・協賛するものではありません。
            </p>
          </div>
          <div className="footer-links">
            <NavLink to="/admin" className="footer-admin-link">
              運営用ページ
            </NavLink>
            <small>Copyright © 2026 四季月家</small>
          </div>
        </footer>
      </div>
    </div>
  );
};
