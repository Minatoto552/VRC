import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NextActivity } from '../components/NextActivity';
import { getPublicActivities } from '../lib/dataService';
import type { Activity } from '../lib/types';

export function Home() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    void getPublicActivities().then(setActivities);
  }, []);

  return (
    <>
      <section className="hero">
        <div className="pill">夜カフェBar in VRChat</div>
        <h1>同期のみんなでつくる、少し特別なカフェ時間。</h1>
        <p>2026年3月同期会イベント部では、VRChat上でカフェ風のBarイベントを企画・運営しています。</p>
        <div className="hero-actions">
          <a href="#next" className="button">
            次回の活動を見る
          </a>
          <Link to="/lottery" className="button primary">
            抽選に参加する
          </Link>
          <Link to="/join" className="button">
            入部方法を見る
          </Link>
        </div>
        <div className="floating-tags" aria-label="イベントの雰囲気">
          <span>☕ Friendly</span>
          <span>🪵 Cafe mood</span>
          <span>💡 Soft light</span>
        </div>
      </section>
      <NextActivity activities={activities} />
      <section className="grid">
        <div className="card">
          <h2>カフェ風の接客</h2>
          <p>初めての方も入りやすい、あたたかな案内を大切にします。</p>
        </div>
        <div className="card">
          <h2>部員募集中</h2>
          <p>説明会から気軽に参加できます。詳細は運営へ確認してください。</p>
        </div>
      </section>
    </>
  );
}
