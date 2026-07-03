import { CircleAlert, Menu, Sparkles } from 'lucide-react';
import { Suspense, lazy, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import type { PublicContent } from '../../shared/models';
import { runtimeMode } from '../lib/firebase';

const LazyCafeSceneCanvas = lazy(async () => ({
  default: (await import('./CafeSceneCanvas')).CafeSceneCanvas,
}));

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
  { to: '/faq', label: 'よくある質問' },
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
        {!isAdminRoute ? (
          <Suspense fallback={null}>
            <LazyCafeSceneCanvas content={content} />
          </Suspense>
        ) : null}

        <header className={`site-header ${isAdminRoute ? 'is-admin-header' : ''}`}>
          <NavLink to="/" className="brand-mark" onClick={() => setMenuOpen(false)}>
            <Sparkles size={18} />
            <span>{content.settings.siteName}</span>
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
                onClick={() => setMenuOpen((current) => !current)}
              >
                <Menu size={18} />
                <span>メニュー</span>
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
            <CircleAlert size={18} />
            <div>
              <strong>ローカル確認用の表示です。</strong>
              <p>{runtimeNotice}</p>
            </div>
          </div>
        ) : null}

        {!loading && !runtimeNotice && runtimeMode === 'sample' ? (
          <div className="runtime-banner" role="status" aria-live="polite">
            <CircleAlert size={18} />
            <div>
              <strong>現在はローカル管理モードです。</strong>
              <p>
                Firebase を使わず、このブラウザ内に保存された公開データと管理データを表示しています。管理画面で保存した内容は、この端末のブラウザへ直接反映されます。
              </p>
            </div>
          </div>
        ) : null}

        <main>{children}</main>

        <footer className="site-footer">
          <div>
            <strong>2026年3月同期会イベント部</strong>
            <p>当サイトおよびイベントは、VRChat Inc.が運営・協賛するものではありません。</p>
          </div>
          <div className="footer-links">
            <NavLink to="/admin" className="footer-admin-link">
              運営用ページ
            </NavLink>
            <small>Copyright © 2026 Event Cafe</small>
          </div>
        </footer>
      </div>
    </div>
  );
};
