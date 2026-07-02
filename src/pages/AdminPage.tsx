import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

import type { Activity, LotteryDraw, MemberProfile, SiteSettings } from '../../shared/models';
import { AdminGuard } from '../components/AdminGuard';
import { buildAvatarImage } from '../lib/avatar';
import {
  deleteActivity,
  deleteLotteryDraw,
  deleteLotteryEntry,
  deleteMember,
  loadAdminContent,
  loginAsAdmin,
  logoutAdmin,
  resetLotteryEntries,
  runLottery,
  updateLotteryEntryEligibility,
  updateSiteSettings,
  upsertActivity,
  upsertMember,
} from '../lib/api';
import { activityKindLabels, formatDateTime, lotteryStatusLabels } from '../lib/format';
import { useAuth } from '../auth/AuthContext';

const adminTabs = [
  'dashboard',
  'entries',
  'lottery',
  'activities',
  'members',
  'settings',
] as const;

const quickWinnerCounts = [1, 2, 3] as const;

type AdminTab = (typeof adminTabs)[number];
type EntrySort = 'newest' | 'oldest';
type AdminContent = Awaited<ReturnType<typeof loadAdminContent>>;

interface LotteryPresentationState {
  phase: 'idle' | 'revealing' | 'revealed';
  draw: LotteryDraw | null;
  previewNames: string[];
}

const nowIso = (): string => new Date().toISOString();

const blankActivity = (): Activity => ({
  id: `activity-${crypto.randomUUID()}`,
  title: '',
  kind: 'public-event',
  date: '2026-03-01',
  startTime: '21:00',
  endTime: '22:00',
  description: '',
  meetingPoint: '',
  targetAudience: '',
  notes: '',
  isPublic: true,
  createdAt: nowIso(),
  updatedAt: nowIso(),
});

const blankMember = (): MemberProfile => ({
  id: `member-${crypto.randomUUID()}`,
  vrcName: '',
  avatarLabel: '00',
  avatarImageUrl: '',
  role: 'キャスト',
  duties: '',
  bio: '',
  favoriteDrink: '',
  status: '在籍中',
  isPublic: true,
  sortOrder: 10,
  isLeadership: false,
  createdAt: nowIso(),
  updatedAt: nowIso(),
});

const buildPreviewNames = (
  eligibleNames: string[],
  winnerCount: number,
  shift: number,
): string[] => {
  if (eligibleNames.length === 0) {
    return [];
  }

  return Array.from({ length: winnerCount }, (_, index) => {
    const name = eligibleNames[(shift + index) % eligibleNames.length];
    return name ?? eligibleNames[0] ?? '候補者';
  }).filter((name): name is string => Boolean(name));
};

export const AdminPage = () => {
  const { authReady, isAdminSignedIn, runtimeMode } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [runningLottery, setRunningLottery] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [entrySort, setEntrySort] = useState<EntrySort>('newest');
  const deferredSearchText = useDeferredValue(searchText);
  const [winnerCount, setWinnerCount] = useState(1);
  const [adminData, setAdminData] = useState<AdminContent | null>(null);
  const [activityDraft, setActivityDraft] = useState<Activity>(blankActivity());
  const [memberDraft, setMemberDraft] = useState<MemberProfile>(blankMember());
  const [settingsDraft, setSettingsDraft] = useState<SiteSettings | null>(null);
  const [presentation, setPresentation] = useState<LotteryPresentationState>({
    phase: 'idle',
    draw: null,
    previewNames: [],
  });
  const revealTimeoutRef = useRef<number | null>(null);
  const revealIntervalRef = useRef<number | null>(null);

  const clearPresentationTimers = () => {
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }

    if (revealIntervalRef.current !== null) {
      window.clearInterval(revealIntervalRef.current);
      revealIntervalRef.current = null;
    }
  };

  const refreshAdminData = async () => {
    const data = await loadAdminContent();
    setAdminData(data);
    setSettingsDraft(data.settings);
  };

  useEffect(() => {
    if (isAdminSignedIn) {
      void refreshAdminData().catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : '管理データの取得に失敗しました。');
      });
    }
  }, [isAdminSignedIn]);

  useEffect(() => () => clearPresentationTimers(), []);

  const eligibleEntries = useMemo(
    () => adminData?.entries.filter((entry) => entry.eligible) ?? [],
    [adminData],
  );

  const filteredEntries = useMemo(() => {
    if (!adminData) {
      return [];
    }

    const normalizedSearch = deferredSearchText.toLocaleLowerCase('ja-JP');
    const matchingEntries = adminData.entries.filter((entry) =>
      entry.displayName.toLocaleLowerCase('ja-JP').includes(normalizedSearch),
    );

    return matchingEntries.toSorted((left, right) =>
      entrySort === 'newest'
        ? right.createdAt.localeCompare(left.createdAt)
        : left.createdAt.localeCompare(right.createdAt),
    );
  }, [adminData, deferredSearchText, entrySort]);

  const finalizePresentation = (draw: LotteryDraw | null) => {
    if (!draw) {
      clearPresentationTimers();
      setPresentation({ phase: 'idle', draw: null, previewNames: [] });
      return;
    }

    clearPresentationTimers();
    setPresentation({
      phase: 'revealed',
      draw,
      previewNames: draw.winners,
    });
    setInfoMessage('当選結果を表示しました。');
    void refreshAdminData().catch((error) => {
      setErrorMessage(error instanceof Error ? error.message : '抽選結果の更新に失敗しました。');
    });
  };

  const startPresentation = (draw: LotteryDraw, eligibleNames: string[]) => {
    clearPresentationTimers();
    let shift = 0;

    setPresentation({
      phase: 'revealing',
      draw,
      previewNames: buildPreviewNames(eligibleNames, draw.winnerCount, shift),
    });

    revealIntervalRef.current = window.setInterval(() => {
      shift += 1;
      setPresentation((current) =>
        current.draw
          ? {
              ...current,
              previewNames: buildPreviewNames(eligibleNames, draw.winnerCount, shift),
            }
          : current,
      );
    }, 220);

    revealTimeoutRef.current = window.setTimeout(() => {
      finalizePresentation(draw);
    }, 3000);
  };

  const handleLogin = async () => {
    setLoggingIn(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      await loginAsAdmin(password);
      setPassword('');
      setInfoMessage('管理者としてログインしました。');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'ログインに失敗しました。');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleRunLottery = async () => {
    if (!adminData || eligibleEntries.length === 0) {
      setErrorMessage('抽選対象者がいません。');
      return;
    }

    setRunningLottery(true);
    setErrorMessage('');
    setInfoMessage('抽選演出を準備しています…');
    setPresentation({ phase: 'idle', draw: null, previewNames: [] });

    try {
      const draw = await runLottery(winnerCount);
      startPresentation(
        draw,
        eligibleEntries.map((entry) => entry.displayName),
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '抽選に失敗しました。');
      setInfoMessage('');
    } finally {
      setRunningLottery(false);
    }
  };

  const guardFallback = (
    <section className="section-card admin-login-card admin-console-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Admin Access</span>
          <h1>運営用管理サイト</h1>
        </div>
      </div>

      <p>
        Cloud Functions経由でパスワード認証し、カスタムトークンで管理者ログインします。
        {runtimeMode === 'sample'
          ? ' 現在はサンプルモードです。Firebase設定またはエミュレータ起動後にログインできます。'
          : ''}
      </p>

      <label className="field-label" htmlFor="admin-password">
        管理用パスワード
      </label>
      <input
        id="admin-password"
        type="password"
        className="text-input"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <div className="form-actions">
        <button
          type="button"
          className="primary-button inline-button"
          disabled={!authReady || loggingIn}
          onClick={() => void handleLogin()}
        >
          {loggingIn ? '認証中…' : 'ログイン'}
        </button>
      </div>

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      {infoMessage ? <p className="success-text">{infoMessage}</p> : null}
    </section>
  );

  return (
    <AdminGuard allowed={isAdminSignedIn} fallback={guardFallback}>
      <div className="page-stack">
        <section className="section-card admin-console-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Operations Console</span>
              <h1>運営用管理サイト</h1>
            </div>
            <button
              type="button"
              className="secondary-button inline-button"
              onClick={() => void logoutAdmin()}
            >
              ログアウト
            </button>
          </div>

          <div className="admin-tabs" role="tablist" aria-label="管理メニュー">
            {adminTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                className={`admin-tab ${activeTab === tab ? 'is-active' : ''}`}
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'dashboard'
                  ? 'ダッシュボード'
                  : tab === 'entries'
                    ? '抽選候補者'
                    : tab === 'lottery'
                      ? '抽選実行'
                      : tab === 'activities'
                        ? '活動予定'
                        : tab === 'members'
                          ? '部員管理'
                          : 'サイト設定'}
              </button>
            ))}
          </div>

          {!adminData ? (
            <p className="empty-message">管理データを読み込んでいます…</p>
          ) : (
            <>
              {activeTab === 'dashboard' ? (
                <div className="dashboard-grid">
                  <article className="metric-card">
                    <span>候補者数</span>
                    <strong>{adminData.entries.length}</strong>
                  </article>
                  <article className="metric-card">
                    <span>抽選対象者数</span>
                    <strong>{eligibleEntries.length}</strong>
                  </article>
                  <article className="metric-card">
                    <span>公開中活動</span>
                    <strong>{adminData.activities.filter((activity) => activity.isPublic).length}</strong>
                  </article>
                  <article className="metric-card">
                    <span>受付状態</span>
                    <strong>{lotteryStatusLabels[adminData.settings.lotteryStatus]}</strong>
                  </article>
                  <article className="detail-card full-span">
                    <h2>直近の監査ログ</h2>
                    {adminData.audits.length === 0 ? (
                      <p className="empty-message">監査ログはまだありません。</p>
                    ) : (
                      <ul className="audit-list">
                        {adminData.audits.map((log) => (
                          <li key={log.id}>
                            <strong>{log.action}</strong>
                            <span>{log.message}</span>
                            <small>{formatDateTime(log.createdAt)}</small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                </div>
              ) : null}

              {activeTab === 'entries' ? (
                <div className="admin-grid">
                  <article className="metric-card">
                    <span>候補者数</span>
                    <strong>{adminData.entries.length}</strong>
                  </article>
                  <article className="metric-card">
                    <span>抽選対象者数</span>
                    <strong>{eligibleEntries.length}</strong>
                  </article>
                  <div className="detail-card">
                    <label className="field-label" htmlFor="entry-search">
                      VRC名検索
                    </label>
                    <input
                      id="entry-search"
                      className="text-input"
                      type="search"
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                    />
                  </div>
                  <div className="detail-card">
                    <label className="field-label" htmlFor="entry-sort">
                      並び順
                    </label>
                    <select
                      id="entry-sort"
                      className="text-input"
                      value={entrySort}
                      onChange={(event) => setEntrySort(event.target.value as EntrySort)}
                    >
                      <option value="newest">登録日時が新しい順</option>
                      <option value="oldest">登録順</option>
                    </select>
                  </div>
                  <div className="detail-card full-span">
                    <div className="section-heading compact-heading">
                      <h2>抽選候補者一覧</h2>
                      <div className="inline-actions">
                        <button
                          type="button"
                          className="secondary-button inline-button"
                          onClick={() => void refreshAdminData()}
                        >
                          一覧更新
                        </button>
                        <button
                          type="button"
                          className="danger-button inline-button"
                          onClick={() => {
                            const confirmed = window.confirm(
                              `候補者一覧をすべて削除します。この操作は元に戻せません。\n削除対象: ${adminData.entries.length}件`,
                            );

                            if (confirmed) {
                              void resetLotteryEntries()
                                .then(async () => {
                                  setInfoMessage(`${adminData.entries.length}件の候補者を削除しました。`);
                                  await refreshAdminData();
                                })
                                .catch((error) => {
                                  setErrorMessage(
                                    error instanceof Error ? error.message : '削除に失敗しました。',
                                  );
                                });
                            }
                          }}
                        >
                          候補者全削除
                        </button>
                      </div>
                    </div>

                    {filteredEntries.length === 0 ? (
                      <p className="empty-message">条件に一致する候補者はいません。</p>
                    ) : (
                      <div className="table-scroll">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>通し番号</th>
                              <th>VRC名</th>
                              <th>登録日時</th>
                              <th>抽選対象</th>
                              <th>操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredEntries.map((entry, index) => (
                              <tr key={entry.id}>
                                <td>{index + 1}</td>
                                <td className="breakable-cell">{entry.displayName}</td>
                                <td>{formatDateTime(entry.createdAt)}</td>
                                <td>{entry.eligible ? '対象' : '対象外'}</td>
                                <td>
                                  <div className="inline-actions">
                                    <button
                                      type="button"
                                      className="secondary-button inline-button"
                                      onClick={() =>
                                        void updateLotteryEntryEligibility(entry.id, !entry.eligible)
                                          .then(async () => {
                                            setInfoMessage(
                                              entry.eligible
                                                ? '候補者を抽選対象外にしました。'
                                                : '候補者を抽選対象に戻しました。',
                                            );
                                            await refreshAdminData();
                                          })
                                          .catch((error) => {
                                            setErrorMessage(
                                              error instanceof Error
                                                ? error.message
                                                : '更新に失敗しました。',
                                            );
                                          })
                                      }
                                    >
                                      {entry.eligible ? '除外' : '除外解除'}
                                    </button>
                                    <button
                                      type="button"
                                      className="danger-button inline-button"
                                      onClick={() => {
                                        const confirmed = window.confirm(
                                          `候補者「${entry.displayName}」を削除しますか？`,
                                        );

                                        if (confirmed) {
                                          void deleteLotteryEntry(entry.id)
                                            .then(async () => {
                                              setInfoMessage('候補者を削除しました。');
                                              await refreshAdminData();
                                            })
                                            .catch((error) => {
                                              setErrorMessage(
                                                error instanceof Error
                                                  ? error.message
                                                  : '削除に失敗しました。',
                                              );
                                            });
                                        }
                                      }}
                                    >
                                      削除
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {activeTab === 'lottery' ? (
                <div className="admin-grid">
                  <article className="detail-card">
                    <h2>抽選実行</h2>
                    <p>結果はサーバー側で確定し、その後に約3秒のカフェ風演出を表示します。</p>
                    <div className="quick-button-row">
                      {quickWinnerCounts.map((count) => (
                        <button
                          key={count}
                          type="button"
                          className={`secondary-button inline-button ${
                            winnerCount === count ? 'is-selected-button' : ''
                          }`}
                          disabled={count > eligibleEntries.length}
                          onClick={() => setWinnerCount(count)}
                        >
                          {count}名
                        </button>
                      ))}
                    </div>
                    <label className="field-label" htmlFor="winner-count">
                      当選人数
                    </label>
                    <input
                      id="winner-count"
                      className="text-input"
                      type="number"
                      min={1}
                      max={Math.max(eligibleEntries.length, 1)}
                      value={winnerCount}
                      onChange={(event) => setWinnerCount(Number(event.target.value))}
                    />
                    <div className="form-actions">
                      <button
                        type="button"
                        className="primary-button inline-button"
                        disabled={runningLottery || eligibleEntries.length === 0}
                        onClick={() => void handleRunLottery()}
                      >
                        {runningLottery ? '抽選中…' : '抽選開始'}
                      </button>
                    </div>
                  </article>

                  <article className="detail-card">
                    <h2>現在の候補者数</h2>
                    <p>候補者数: {adminData.entries.length}</p>
                    <p>抽選対象者数: {eligibleEntries.length}</p>
                    <p>最大当選人数: {eligibleEntries.length}</p>
                  </article>

                  <article className="detail-card full-span">
                    <div className="section-heading compact-heading">
                      <h2>抽選演出</h2>
                      {presentation.phase === 'revealing' ? (
                        <button
                          type="button"
                          className="secondary-button inline-button"
                          onClick={() => finalizePresentation(presentation.draw)}
                        >
                          演出をスキップする
                        </button>
                      ) : null}
                    </div>

                    {presentation.phase === 'idle' ? (
                      <p className="empty-message">抽選開始後にここへ演出と結果を表示します。</p>
                    ) : (
                      <div className="lottery-stage">
                        <div className="lottery-stage-header">
                          <div className="coffee-orb coffee-orb-small" />
                          <div className="steam steam-stage-left" />
                          <div className="steam steam-stage-right" />
                          <div>
                            <strong>
                              {presentation.phase === 'revealing'
                                ? 'メニューカードをシャッフルしています…'
                                : '当選おめでとうございます！'}
                            </strong>
                            <p>
                              {presentation.phase === 'revealing'
                                ? '結果はサーバー側で確定済みです。'
                                : 'Cloud Functionsで確定した当選者です。'}
                            </p>
                          </div>
                        </div>
                        <div className="winner-grid">
                          {presentation.previewNames.map((name, index) => (
                            <article
                              key={`${name}-${index}`}
                              className={`winner-tile ${
                                presentation.phase === 'revealing' ? 'is-shuffling' : ''
                              }`}
                            >
                              当選者: {name}
                            </article>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>

                  <article className="detail-card full-span">
                    <div className="section-heading compact-heading">
                      <h2>抽選履歴</h2>
                    </div>
                    {adminData.draws.length === 0 ? (
                      <p className="empty-message">抽選履歴はまだありません。</p>
                    ) : (
                      <div className="table-scroll">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>抽選日時</th>
                              <th>当選者</th>
                              <th>当選人数</th>
                              <th>候補者数</th>
                              <th>実行者</th>
                              <th>備考</th>
                              <th>操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminData.draws.map((draw) => (
                              <tr key={draw.id}>
                                <td>{formatDateTime(draw.createdAt)}</td>
                                <td className="breakable-cell">{draw.winners.join(' / ')}</td>
                                <td>{draw.winnerCount}</td>
                                <td>{draw.candidateCount}</td>
                                <td>{draw.executedBy}</td>
                                <td className="breakable-cell">{draw.notes || '記録なし'}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="danger-button inline-button"
                                    onClick={() => {
                                      const confirmed = window.confirm(
                                        `抽選履歴を削除しますか？\n対象: ${draw.winners.join(' / ')}`,
                                      );

                                      if (confirmed) {
                                        void deleteLotteryDraw(draw.id)
                                          .then(async () => {
                                            setInfoMessage('抽選履歴を削除しました。');
                                            await refreshAdminData();
                                          })
                                          .catch((error) => {
                                            setErrorMessage(
                                              error instanceof Error
                                                ? error.message
                                                : '履歴削除に失敗しました。',
                                            );
                                          });
                                      }
                                    }}
                                  >
                                    削除
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>
                </div>
              ) : null}

              {activeTab === 'activities' ? (
                <div className="admin-grid">
                  <article className="detail-card full-span">
                    <h2>活動予定管理</h2>
                    {adminData.activities.length === 0 ? (
                      <p className="empty-message">活動予定はまだ登録されていません。</p>
                    ) : (
                      <div className="card-grid">
                        {adminData.activities.map((activity) => (
                          <article key={activity.id} className="info-card">
                            <span className="chip subtle-chip">{activityKindLabels[activity.kind]}</span>
                            <h3>{activity.title}</h3>
                            <p>{activity.description}</p>
                            <dl className="stacked-details compact-details">
                              <div>
                                <dt>開催日時</dt>
                                <dd>
                                  {activity.date} {activity.startTime} - {activity.endTime}
                                </dd>
                              </div>
                              <div>
                                <dt>集合場所</dt>
                                <dd>{activity.meetingPoint}</dd>
                              </div>
                              <div>
                                <dt>公開状態</dt>
                                <dd>{activity.isPublic ? '公開中' : '非公開'}</dd>
                              </div>
                            </dl>
                            <div className="inline-actions">
                              <button
                                type="button"
                                className="secondary-button inline-button"
                                onClick={() => setActivityDraft(activity)}
                              >
                                編集
                              </button>
                              <button
                                type="button"
                                className="danger-button inline-button"
                                onClick={() => {
                                  const confirmed = window.confirm(
                                    `活動予定「${activity.title}」を削除しますか？`,
                                  );

                                  if (confirmed) {
                                    void deleteActivity(activity.id)
                                      .then(async () => {
                                        setInfoMessage('活動予定を削除しました。');
                                        await refreshAdminData();
                                      })
                                      .catch((error) => {
                                        setErrorMessage(
                                          error instanceof Error ? error.message : '削除に失敗しました。',
                                        );
                                      });
                                  }
                                }}
                              >
                                削除
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </article>

                  <article className="detail-card full-span">
                    <div className="section-heading compact-heading">
                      <h2>活動予定フォーム</h2>
                      <button
                        type="button"
                        className="secondary-button inline-button"
                        onClick={() => setActivityDraft(blankActivity())}
                      >
                        新規入力へ戻す
                      </button>
                    </div>
                    <div className="form-grid">
                      <label>
                        活動名
                        <input
                          className="text-input"
                          value={activityDraft.title}
                          onChange={(event) =>
                            setActivityDraft((current) => ({ ...current, title: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        種類
                        <select
                          className="text-input"
                          value={activityDraft.kind}
                          onChange={(event) =>
                            setActivityDraft((current) => ({
                              ...current,
                              kind: event.target.value as Activity['kind'],
                            }))
                          }
                        >
                          {Object.entries(activityKindLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        開催日
                        <input
                          className="text-input"
                          type="date"
                          value={activityDraft.date}
                          onChange={(event) =>
                            setActivityDraft((current) => ({ ...current, date: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        開始時刻
                        <input
                          className="text-input"
                          type="time"
                          value={activityDraft.startTime}
                          onChange={(event) =>
                            setActivityDraft((current) => ({
                              ...current,
                              startTime: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        終了時刻
                        <input
                          className="text-input"
                          type="time"
                          value={activityDraft.endTime}
                          onChange={(event) =>
                            setActivityDraft((current) => ({ ...current, endTime: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        集合場所
                        <input
                          className="text-input"
                          value={activityDraft.meetingPoint}
                          onChange={(event) =>
                            setActivityDraft((current) => ({
                              ...current,
                              meetingPoint: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        対象者
                        <input
                          className="text-input"
                          value={activityDraft.targetAudience}
                          onChange={(event) =>
                            setActivityDraft((current) => ({
                              ...current,
                              targetAudience: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={activityDraft.isPublic}
                          onChange={(event) =>
                            setActivityDraft((current) => ({
                              ...current,
                              isPublic: event.target.checked,
                            }))
                          }
                        />
                        公開する
                      </label>
                    </div>
                    <label>
                      内容
                      <textarea
                        className="text-area"
                        value={activityDraft.description}
                        onChange={(event) =>
                          setActivityDraft((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      備考
                      <textarea
                        className="text-area"
                        value={activityDraft.notes}
                        onChange={(event) =>
                          setActivityDraft((current) => ({ ...current, notes: event.target.value }))
                        }
                      />
                    </label>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="primary-button inline-button"
                        onClick={() =>
                          void upsertActivity({ ...activityDraft, updatedAt: nowIso() })
                            .then(async () => {
                              setInfoMessage('活動予定を保存しました。');
                              setActivityDraft(blankActivity());
                              await refreshAdminData();
                            })
                            .catch((error) => {
                              setErrorMessage(
                                error instanceof Error ? error.message : '保存に失敗しました。',
                              );
                            })
                        }
                      >
                        保存
                      </button>
                    </div>
                  </article>
                </div>
              ) : null}

              {activeTab === 'members' ? (
                <div className="admin-grid">
                  <article className="detail-card full-span">
                    <h2>部員管理</h2>
                    {adminData.members.length === 0 ? (
                      <p className="empty-message">部員情報はまだ登録されていません。</p>
                    ) : (
                      <div className="card-grid">
                        {adminData.members.map((member) => (
                          <article key={member.id} className="info-card">
                            <img
                              className="admin-avatar-preview"
                              src={member.avatarImageUrl || buildAvatarImage(member.avatarLabel, member.role)}
                              alt={`${member.vrcName}のアイコン画像`}
                            />
                            <span className="chip subtle-chip">{member.role}</span>
                            <h3>{member.vrcName}</h3>
                            <p>{member.duties}</p>
                            <p>在籍状況: {member.status}</p>
                            <div className="inline-actions">
                              <button
                                type="button"
                                className="secondary-button inline-button"
                                onClick={() => setMemberDraft(member)}
                              >
                                編集
                              </button>
                              <button
                                type="button"
                                className="danger-button inline-button"
                                onClick={() => {
                                  const confirmed = window.confirm(
                                    `部員「${member.vrcName}」を削除しますか？`,
                                  );

                                  if (confirmed) {
                                    void deleteMember(member.id)
                                      .then(async () => {
                                        setInfoMessage('部員情報を削除しました。');
                                        await refreshAdminData();
                                      })
                                      .catch((error) => {
                                        setErrorMessage(
                                          error instanceof Error ? error.message : '削除に失敗しました。',
                                        );
                                      });
                                  }
                                }}
                              >
                                削除
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </article>

                  <article className="detail-card full-span">
                    <div className="section-heading compact-heading">
                      <h2>部員フォーム</h2>
                      <button
                        type="button"
                        className="secondary-button inline-button"
                        onClick={() => setMemberDraft(blankMember())}
                      >
                        新規入力へ戻す
                      </button>
                    </div>
                    <div className="form-grid">
                      <label>
                        VRC名
                        <input
                          className="text-input"
                          value={memberDraft.vrcName}
                          onChange={(event) =>
                            setMemberDraft((current) => ({ ...current, vrcName: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        アイコン表示文字
                        <input
                          className="text-input"
                          value={memberDraft.avatarLabel}
                          onChange={(event) =>
                            setMemberDraft((current) => ({
                              ...current,
                              avatarLabel: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        アイコン画像URL
                        <input
                          className="text-input"
                          value={memberDraft.avatarImageUrl}
                          onChange={(event) =>
                            setMemberDraft((current) => ({
                              ...current,
                              avatarImageUrl: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        役職
                        <input
                          className="text-input"
                          value={memberDraft.role}
                          onChange={(event) =>
                            setMemberDraft((current) => ({ ...current, role: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        担当
                        <input
                          className="text-input"
                          value={memberDraft.duties}
                          onChange={(event) =>
                            setMemberDraft((current) => ({ ...current, duties: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        好きな飲み物
                        <input
                          className="text-input"
                          value={memberDraft.favoriteDrink}
                          onChange={(event) =>
                            setMemberDraft((current) => ({
                              ...current,
                              favoriteDrink: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        在籍状況
                        <input
                          className="text-input"
                          value={memberDraft.status}
                          onChange={(event) =>
                            setMemberDraft((current) => ({ ...current, status: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        並び順
                        <input
                          className="text-input"
                          type="number"
                          value={memberDraft.sortOrder}
                          onChange={(event) =>
                            setMemberDraft((current) => ({
                              ...current,
                              sortOrder: Number(event.target.value),
                            }))
                          }
                        />
                      </label>
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={memberDraft.isLeadership}
                          onChange={(event) =>
                            setMemberDraft((current) => ({
                              ...current,
                              isLeadership: event.target.checked,
                            }))
                          }
                        />
                        部長・副部長として強調表示
                      </label>
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={memberDraft.isPublic}
                          onChange={(event) =>
                            setMemberDraft((current) => ({
                              ...current,
                              isPublic: event.target.checked,
                            }))
                          }
                        />
                        公開する
                      </label>
                    </div>
                    <label>
                      自己紹介
                      <textarea
                        className="text-area"
                        value={memberDraft.bio}
                        onChange={(event) =>
                          setMemberDraft((current) => ({ ...current, bio: event.target.value }))
                        }
                      />
                    </label>
                    <div className="admin-avatar-form-preview">
                      <img
                        className="admin-avatar-preview"
                        src={
                          memberDraft.avatarImageUrl ||
                          buildAvatarImage(memberDraft.avatarLabel, memberDraft.role)
                        }
                        alt="部員アイコンのプレビュー"
                      />
                    </div>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="primary-button inline-button"
                        onClick={() =>
                          void upsertMember({ ...memberDraft, updatedAt: nowIso() })
                            .then(async () => {
                              setInfoMessage('部員情報を保存しました。');
                              setMemberDraft(blankMember());
                              await refreshAdminData();
                            })
                            .catch((error) => {
                              setErrorMessage(
                                error instanceof Error ? error.message : '保存に失敗しました。',
                              );
                            })
                        }
                      >
                        保存
                      </button>
                    </div>
                  </article>
                </div>
              ) : null}

              {activeTab === 'settings' && settingsDraft ? (
                <div className="admin-grid">
                  <article className="detail-card full-span">
                    <h2>サイト設定</h2>
                    <div className="form-grid">
                      <label>
                        サイト名
                        <input
                          className="text-input"
                          value={settingsDraft.siteName}
                          onChange={(event) =>
                            setSettingsDraft((current) =>
                              current ? { ...current, siteName: event.target.value } : current,
                            )
                          }
                        />
                      </label>
                      <label>
                        抽選受付状態
                        <select
                          className="text-input"
                          value={settingsDraft.lotteryStatus}
                          onChange={(event) =>
                            setSettingsDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    lotteryStatus: event.target.value as SiteSettings['lotteryStatus'],
                                  }
                                : current,
                            )
                          }
                        >
                          {Object.entries(lotteryStatusLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        問い合わせ先
                        <input
                          className="text-input"
                          value={settingsDraft.supportEmail}
                          onChange={(event) =>
                            setSettingsDraft((current) =>
                              current ? { ...current, supportEmail: event.target.value } : current,
                            )
                          }
                        />
                      </label>
                    </div>
                    <label>
                      サイト説明
                      <textarea
                        className="text-area"
                        value={settingsDraft.siteDescription}
                        onChange={(event) =>
                          setSettingsDraft((current) =>
                            current ? { ...current, siteDescription: event.target.value } : current,
                          )
                        }
                      />
                    </label>
                    <label>
                      抽選案内文
                      <textarea
                        className="text-area"
                        value={settingsDraft.lotteryNotice}
                        onChange={(event) =>
                          setSettingsDraft((current) =>
                            current ? { ...current, lotteryNotice: event.target.value } : current,
                          )
                        }
                      />
                    </label>
                    <label>
                      入部案内文
                      <textarea
                        className="text-area"
                        value={settingsDraft.joinGuideNote}
                        onChange={(event) =>
                          setSettingsDraft((current) =>
                            current ? { ...current, joinGuideNote: event.target.value } : current,
                          )
                        }
                      />
                    </label>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="primary-button inline-button"
                        onClick={() =>
                          void updateSiteSettings({ ...settingsDraft, updatedAt: nowIso() })
                            .then(async () => {
                              setInfoMessage('サイト設定を保存しました。');
                              await refreshAdminData();
                            })
                            .catch((error) => {
                              setErrorMessage(
                                error instanceof Error ? error.message : '保存に失敗しました。',
                              );
                            })
                        }
                      >
                        保存
                      </button>
                    </div>
                  </article>
                </div>
              ) : null}
            </>
          )}

          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
          {infoMessage ? <p className="success-text">{infoMessage}</p> : null}
        </section>
      </div>
    </AdminGuard>
  );
};
