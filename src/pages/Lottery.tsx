import { FormEvent, useEffect, useRef, useState } from 'react';
import { listenSettings, submitLotteryEntry } from '../lib/dataService';
import { normalizeVrcName, validateVrcName } from '../lib/lottery';
import { defaultSettings } from '../lib/siteData';
import type { SiteSettings } from '../lib/types';

export function Lottery() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [name, setName] = useState('');
  const [confirmedName, setConfirmedName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const liveMessageRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => listenSettings(setSettings), []);

  const isClosed = settings.lotteryStatus !== 'open';
  const isDisabled = isClosed || isSubmitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const normalizedName = normalizeVrcName(name);
    const validationError = validateVrcName(normalizedName);

    if (validationError) {
      setMessage(validationError);
      return;
    }

    if (confirmedName !== normalizedName) {
      setConfirmedName(normalizedName);
      setMessage(`登録前確認：${normalizedName} で送信します。もう一度送信してください。`);
      return;
    }

    setIsSubmitting(true);

    try {
      await submitLotteryEntry(normalizedName);
      setMessage('抽選への登録が完了しました。スタッフからの案内をお待ちください。');
      setName('');
      setConfirmedName('');
      liveMessageRef.current?.focus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '通信に失敗しました。もう一度お試しください');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section>
      <h1>抽選受付</h1>
      <p>{settings.lotteryGuide}</p>
      <div className="warning" role="note">
        ⚠️ 必ずVRC名を入力してください。Xの名前、Discordの名前、ニックネームなどは使用しないでください。
      </div>
      <p>
        個人情報は入力しないでください。受付状態：
        <b>{settings.lotteryStatus === 'open' ? '受付中' : settings.lotteryStatus === 'paused' ? '一時停止中' : '抽選終了'}</b>
      </p>
      <form className="card form" onSubmit={handleSubmit}>
        <label htmlFor="vrc-name">VRC名</label>
        <input
          id="vrc-name"
          value={name}
          maxLength={40}
          onChange={(event) => setName(event.target.value)}
          disabled={isDisabled}
          autoComplete="off"
        />
        <button className="button primary" disabled={isDisabled}>
          {isSubmitting ? '送信中' : '抽選に登録する'}
        </button>
      </form>
      {isClosed && <p className="notice">現在は抽選受付を行っていません。</p>}
      <p ref={liveMessageRef} tabIndex={-1} aria-live="polite" className="status">
        {message}
      </p>
    </section>
  );
}
