import { useEffect, useMemo, useState } from 'react';

import type { Activity, MemberProfile, SiteSettings } from '../../shared/models';
import { useAuth } from '../auth/AuthContext';
import { AdminGuard } from '../components/AdminGuard';
import { ManagedPhotoFrame } from '../components/ManagedPhotoFrame';
import { buildAvatarImage } from '../lib/avatar';
import {
  deleteActivity,
  deleteMember,
  loadAdminContent,
  loginAsAdmin,
  logoutAdmin,
  updateSiteSettings,
  upsertActivity,
  upsertMember,
} from '../lib/api';
import { activityKindLabels, formatDateTime } from '../lib/format';
import {
  deleteManagedPhoto,
  importManagedPhotos,
  loadManagedPhotos,
  PHOTO_LIBRARY_UPDATED_EVENT,
  photoCategories,
  type ManagedPhotoAsset,
  type PhotoCategoryId,
  upsertManagedPhoto,
} from '../lib/photo-library';

const adminTabs = ['dashboard', 'activities', 'members', 'photos', 'settings'] as const;
type AdminTab = (typeof adminTabs)[number];
type AdminContent = Awaited<ReturnType<typeof loadAdminContent>>;

const activityKindOptions = Object.entries(activityKindLabels).map(([value, label]) => ({
  value: value as Activity['kind'],
  label,
}));

const nowIso = (): string => new Date().toISOString();

const createBlankActivity = (): Activity => ({
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

const createBlankMember = (): MemberProfile => ({
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

const getAvatarSrc = (member: MemberProfile): string =>
  member.avatarImageUrl || buildAvatarImage(member.avatarLabel, member.vrcName);

export const AdminPage = () => {
  const { authReady, isAdminSignedIn, runtimeMode } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adminData, setAdminData] = useState<AdminContent | null>(null);
  const [activityDraft, setActivityDraft] = useState<Activity>(createBlankActivity());
  const [memberDraft, setMemberDraft] = useState<MemberProfile>(createBlankMember());
  const [settingsDraft, setSettingsDraft] = useState<SiteSettings | null>(null);
  const [photoLibrary, setPhotoLibrary] = useState<ManagedPhotoAsset[]>(() => loadManagedPhotos());
  const [uploadCategory, setUploadCategory] = useState<PhotoCategoryId>('cast-event');

  const refreshAdminData = async () => {
    const data = await loadAdminContent();
    setAdminData(data);
    setSettingsDraft(data.settings);
    setErrorMessage('');
  };

  const refreshPhotoLibrary = () => {
    setPhotoLibrary(loadManagedPhotos());
  };

  useEffect(() => {
    if (!isAdminSignedIn) {
      setAdminData(null);
      return;
    }

    void refreshAdminData().catch((error) => {
      setErrorMessage(error instanceof Error ? error.message : '管理データの取得に失敗しました。');
    });
    refreshPhotoLibrary();
  }, [isAdminSignedIn]);

  useEffect(() => {
    const refresh = () => refreshPhotoLibrary();
    window.addEventListener(PHOTO_LIBRARY_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener(PHOTO_LIBRARY_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const activityCount = adminData?.activities.length ?? 0;
  const publicActivityCount = adminData?.activities.filter((activity) => activity.isPublic).length ?? 0;
  const memberCount = adminData?.members.length ?? 0;
  const photoCount = photoLibrary.length;

  const sortedMembers = useMemo(
    () =>
      [...(adminData?.members ?? [])].sort((left, right) =>
        left.sortOrder === right.sortOrder
          ? left.createdAt.localeCompare(right.createdAt)
          : left.sortOrder - right.sortOrder,
      ),
    [adminData?.members],
  );

  const recentAudits = useMemo(() => adminData?.audits.slice(0, 8) ?? [], [adminData?.audits]);

  const groupedPhotos = useMemo(
    () =>
      photoCategories.map((category) => ({
        category,
        items: photoLibrary.filter((photo) => photo.category === category.id),
      })),
    [photoLibrary],
  );

  const resetActivityDraft = () => {
    setActivityDraft(createBlankActivity());
  };

  const resetMemberDraft = () => {
    setMemberDraft(createBlankMember());
  };

  const handleLogin = async () => {
    setLoggingIn(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      await loginAsAdmin(password);
      setPassword('');
      setInfoMessage('ログインしました。');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'ログインに失敗しました。');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSaveActivity = async () => {
    setSaving(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      await upsertActivity({
        ...activityDraft,
        updatedAt: nowIso(),
      });
      await refreshAdminData();
      resetActivityDraft();
      setInfoMessage('活動予定を保存しました。');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '活動予定の保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    const confirmed = window.confirm('この活動予定を削除しますか？');
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      await deleteActivity(activityId);
      await refreshAdminData();
      if (activityDraft.id === activityId) {
        resetActivityDraft();
      }
      setInfoMessage('活動予定を削除しました。');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '活動予定の削除に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMember = async () => {
    setSaving(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      await upsertMember({
        ...memberDraft,
        updatedAt: nowIso(),
      });
      await refreshAdminData();
      resetMemberDraft();
      setInfoMessage('部員情報を保存しました。');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '部員情報の保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    const confirmed = window.confirm('この部員情報を削除しますか？');
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      await deleteMember(memberId);
      await refreshAdminData();
      if (memberDraft.id === memberId) {
        resetMemberDraft();
      }
      setInfoMessage('部員情報を削除しました。');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '部員情報の削除に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settingsDraft) {
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      await updateSiteSettings({
        ...settingsDraft,
        updatedAt: nowIso(),
      });
      await refreshAdminData();
      setInfoMessage('サイト設定を保存しました。');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'サイト設定の保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoImport = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    setErrorMessage('');
    setInfoMessage('');

    try {
      const imported = await importManagedPhotos(uploadCategory, fileList);
      refreshPhotoLibrary();
      setInfoMessage(`${imported.length}枚の写真を追加しました。`);
    } catch {
      setErrorMessage('写真の読み込みに失敗しました。');
    }
  };

  const handlePhotoChange = (photo: ManagedPhotoAsset, patch: Partial<ManagedPhotoAsset>) => {
    upsertManagedPhoto({
      ...photo,
      ...patch,
    });
    refreshPhotoLibrary();
  };

  const handlePhotoDelete = (photoId: string) => {
    const confirmed = window.confirm('この写真を削除しますか？');
    if (!confirmed) {
      return;
    }

    deleteManagedPhoto(photoId);
    refreshPhotoLibrary();
    setInfoMessage('写真を削除しました。');
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
        現在はローカルパスワード方式です。このブラウザ内に保存される運営画面へログインできます。
        {runtimeMode === 'sample' ? ' 動作確認用パスワードは 1112 です。' : ''}
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
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            void handleLogin();
          }
        }}
      />
      <div className="form-actions">
        <button
          type="button"
          className="primary-button inline-button"
          disabled={!authReady || loggingIn}
          onClick={() => void handleLogin()}
        >
          {loggingIn ? 'ログイン中...' : 'ログイン'}
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
                  : tab === 'activities'
                    ? '活動予定'
                    : tab === 'members'
                      ? '部員管理'
                      : tab === 'photos'
                        ? '写真管理'
                        : 'サイト設定'}
              </button>
            ))}
          </div>

          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
          {infoMessage ? <p className="success-text">{infoMessage}</p> : null}

          {!adminData ? <p className="empty-message">管理データを読み込んでいます...</p> : null}

          {adminData && activeTab === 'dashboard' ? (
            <div className="dashboard-grid">
              <article className="metric-card">
                <span>活動予定総数</span>
                <strong>{activityCount}</strong>
              </article>
              <article className="metric-card">
                <span>公開中の活動</span>
                <strong>{publicActivityCount}</strong>
              </article>
              <article className="metric-card">
                <span>部員数</span>
                <strong>{memberCount}</strong>
              </article>
              <article className="metric-card">
                <span>管理写真枚数</span>
                <strong>{photoCount}</strong>
              </article>
              <article className="detail-card full-span">
                <h2>現在の公開設定</h2>
                <dl className="stacked-details compact-details">
                  <div>
                    <dt>サイト名</dt>
                    <dd>{adminData.settings.siteName}</dd>
                  </div>
                  <div>
                    <dt>サポート連絡先</dt>
                    <dd>{adminData.settings.supportEmail}</dd>
                  </div>
                  <div>
                    <dt>最終更新</dt>
                    <dd>{formatDateTime(adminData.settings.updatedAt)}</dd>
                  </div>
                </dl>
              </article>
              <article className="detail-card full-span">
                <h2>最近の監査ログ</h2>
                {recentAudits.length === 0 ? (
                  <p className="empty-message">監査ログはまだありません。</p>
                ) : (
                  <ul className="audit-list">
                    {recentAudits.map((log) => (
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

          {adminData && activeTab === 'activities' ? (
            <div className="admin-grid">
              <article className="detail-card">
                <div className="section-heading compact-heading">
                  <div>
                    <span className="eyebrow">Activity Editor</span>
                    <h2>活動予定を編集</h2>
                  </div>
                  <button
                    type="button"
                    className="secondary-button inline-button"
                    onClick={resetActivityDraft}
                  >
                    新規作成
                  </button>
                </div>

                <div className="form-grid">
                  <label>
                    タイトル
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
                      {activityKindOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    開催日
                    <input
                      type="date"
                      className="text-input"
                      value={activityDraft.date}
                      onChange={(event) =>
                        setActivityDraft((current) => ({ ...current, date: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    開始時刻
                    <input
                      type="time"
                      className="text-input"
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
                      type="time"
                      className="text-input"
                      value={activityDraft.endTime}
                      onChange={(event) =>
                        setActivityDraft((current) => ({
                          ...current,
                          endTime: event.target.value,
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
                  備考
                  <textarea
                    className="text-area"
                    value={activityDraft.notes}
                    onChange={(event) =>
                      setActivityDraft((current) => ({ ...current, notes: event.target.value }))
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

                <div className="form-actions">
                  <button
                    type="button"
                    className="primary-button inline-button"
                    disabled={saving}
                    onClick={() => void handleSaveActivity()}
                  >
                    {saving ? '保存中...' : '活動予定を保存'}
                  </button>
                </div>
              </article>

              <article className="detail-card">
                <div className="section-heading compact-heading">
                  <div>
                    <span className="eyebrow">Activity List</span>
                    <h2>登録済みの活動予定</h2>
                  </div>
                </div>

                {adminData.activities.length === 0 ? (
                  <p className="empty-message">活動予定はまだありません。</p>
                ) : (
                  <div className="card-grid">
                    {adminData.activities.map((activity) => (
                      <article key={activity.id} className="detail-card">
                        <span className="chip subtle-chip">{activityKindLabels[activity.kind]}</span>
                        <h3>{activity.title}</h3>
                        <p>{activity.description}</p>
                        <dl className="stacked-details compact-details">
                          <div>
                            <dt>日時</dt>
                            <dd>
                              {activity.date} {activity.startTime} - {activity.endTime}
                            </dd>
                          </div>
                          <div>
                            <dt>対象者</dt>
                            <dd>{activity.targetAudience}</dd>
                          </div>
                          <div>
                            <dt>公開状態</dt>
                            <dd>{activity.isPublic ? '公開中' : '非公開'}</dd>
                          </div>
                        </dl>
                        <div className="form-actions">
                          <button
                            type="button"
                            className="secondary-button inline-button"
                            onClick={() => setActivityDraft(activity)}
                          >
                            編集
                          </button>
                          <button
                            type="button"
                            className="secondary-button inline-button"
                            onClick={() => void handleDeleteActivity(activity.id)}
                          >
                            削除
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            </div>
          ) : null}

          {adminData && activeTab === 'members' ? (
            <div className="admin-grid">
              <article className="detail-card">
                <div className="section-heading compact-heading">
                  <div>
                    <span className="eyebrow">Member Editor</span>
                    <h2>部員情報を編集</h2>
                  </div>
                  <button
                    type="button"
                    className="secondary-button inline-button"
                    onClick={resetMemberDraft}
                  >
                    新規作成
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
                    アイコンラベル
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
                    画像URL
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
                      type="number"
                      className="text-input"
                      value={memberDraft.sortOrder}
                      onChange={(event) =>
                        setMemberDraft((current) => ({
                          ...current,
                          sortOrder: Number(event.target.value),
                        }))
                      }
                    />
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
                  部長 / 副部長として強調表示する
                </label>

                <div className="form-actions">
                  <button
                    type="button"
                    className="primary-button inline-button"
                    disabled={saving}
                    onClick={() => void handleSaveMember()}
                  >
                    {saving ? '保存中...' : '部員情報を保存'}
                  </button>
                </div>
              </article>

              <article className="detail-card">
                <div className="section-heading compact-heading">
                  <div>
                    <span className="eyebrow">Member List</span>
                    <h2>登録済みの部員</h2>
                  </div>
                </div>

                {sortedMembers.length === 0 ? (
                  <p className="empty-message">部員情報はまだありません。</p>
                ) : (
                  <div className="member-grid">
                    {sortedMembers.map((member) => (
                      <article
                        key={member.id}
                        className={`member-card ${member.isLeadership ? 'is-leadership' : ''}`}
                      >
                        <div className="member-card-header">
                          <div>
                            <span className="chip subtle-chip">{member.role}</span>
                            <h2>{member.vrcName}</h2>
                          </div>
                          <img
                            src={getAvatarSrc(member)}
                            alt={`${member.vrcName} のアイコン`}
                            className="avatar-image"
                          />
                        </div>
                        <p>{member.bio}</p>
                        <dl className="stacked-details compact-details">
                          <div>
                            <dt>担当</dt>
                            <dd>{member.duties}</dd>
                          </div>
                          <div>
                            <dt>好きな飲み物</dt>
                            <dd>{member.favoriteDrink}</dd>
                          </div>
                          <div>
                            <dt>公開状態</dt>
                            <dd>{member.isPublic ? '公開中' : '非公開'}</dd>
                          </div>
                        </dl>
                        <div className="form-actions">
                          <button
                            type="button"
                            className="secondary-button inline-button"
                            onClick={() => setMemberDraft(member)}
                          >
                            編集
                          </button>
                          <button
                            type="button"
                            className="secondary-button inline-button"
                            onClick={() => void handleDeleteMember(member.id)}
                          >
                            削除
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            </div>
          ) : null}

          {adminData && activeTab === 'photos' ? (
            <div className="admin-grid">
              <article className="detail-card">
                <div className="section-heading compact-heading">
                  <div>
                    <span className="eyebrow">Photo Uploader</span>
                    <h2>写真を一括登録</h2>
                  </div>
                </div>

                <div className="form-grid">
                  <label>
                    登録先カテゴリ
                    <select
                      className="text-input"
                      value={uploadCategory}
                      onChange={(event) => setUploadCategory(event.target.value as PhotoCategoryId)}
                    >
                      {photoCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    画像ファイル
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="text-input"
                      onChange={(event) => {
                        void handlePhotoImport(event.target.files);
                        event.target.value = '';
                      }}
                    />
                  </label>
                </div>

                <p className="muted-note">
                  URL入力ではなく、フォルダから選んだ画像をそのまま登録できます。登録後は各カードで拡大率と表示位置を調整してください。
                </p>
              </article>

              <article className="detail-card">
                <div className="section-heading compact-heading">
                  <div>
                    <span className="eyebrow">Managed Photos</span>
                    <h2>カテゴリ別の写真一覧</h2>
                  </div>
                </div>

                {photoLibrary.length === 0 ? (
                  <p className="empty-message">まだ写真は登録されていません。</p>
                ) : (
                  <div className="admin-photo-sections">
                    {groupedPhotos.map(({ category, items }) => (
                      <section key={category.id} className="admin-photo-section">
                        <div className="admin-photo-section-head">
                          <div>
                            <strong>{category.title}</strong>
                            <p>{category.description}</p>
                          </div>
                          <span className="chip subtle-chip">{items.length}枚</span>
                        </div>

                        {items.length === 0 ? (
                          <p className="empty-message">このカテゴリにはまだ写真がありません。</p>
                        ) : (
                          <div className="admin-photo-grid">
                            {items.map((photo) => (
                              <article key={photo.id} className="admin-photo-card">
                                <ManagedPhotoFrame photo={photo} className="admin-photo-preview" />
                                <div className="admin-photo-fields">
                                  <label>
                                    タイトル
                                    <input
                                      className="text-input"
                                      value={photo.title}
                                      onChange={(event) =>
                                        handlePhotoChange(photo, { title: event.target.value })
                                      }
                                    />
                                  </label>
                                  <label>
                                    説明
                                    <textarea
                                      className="text-area admin-photo-description"
                                      value={photo.description}
                                      onChange={(event) =>
                                        handlePhotoChange(photo, { description: event.target.value })
                                      }
                                    />
                                  </label>
                                  <label>
                                    拡大率: {photo.zoom.toFixed(2)}
                                    <input
                                      type="range"
                                      min="1"
                                      max="2.6"
                                      step="0.05"
                                      value={photo.zoom}
                                      onChange={(event) =>
                                        handlePhotoChange(photo, {
                                          zoom: Number(event.target.value),
                                        })
                                      }
                                    />
                                  </label>
                                  <label>
                                    横位置: {Math.round(photo.focalX)}%
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      step="1"
                                      value={photo.focalX}
                                      onChange={(event) =>
                                        handlePhotoChange(photo, {
                                          focalX: Number(event.target.value),
                                        })
                                      }
                                    />
                                  </label>
                                  <label>
                                    縦位置: {Math.round(photo.focalY)}%
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      step="1"
                                      value={photo.focalY}
                                      onChange={(event) =>
                                        handlePhotoChange(photo, {
                                          focalY: Number(event.target.value),
                                        })
                                      }
                                    />
                                  </label>
                                  <div className="form-actions">
                                    <button
                                      type="button"
                                      className="secondary-button inline-button"
                                      onClick={() => handlePhotoDelete(photo.id)}
                                    >
                                      削除
                                    </button>
                                  </div>
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </section>
                    ))}
                  </div>
                )}
              </article>
            </div>
          ) : null}

          {adminData && activeTab === 'settings' && settingsDraft ? (
            <article className="detail-card">
              <div className="section-heading compact-heading">
                <div>
                  <span className="eyebrow">Site Settings</span>
                  <h2>公開サイトの基本設定</h2>
                </div>
              </div>

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
                  サポート用メール
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
                入部案内メモ
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
                  disabled={saving}
                  onClick={() => void handleSaveSettings()}
                >
                  {saving ? '保存中...' : 'サイト設定を保存'}
                </button>
              </div>
            </article>
          ) : null}
        </section>
      </div>
    </AdminGuard>
  );
};
