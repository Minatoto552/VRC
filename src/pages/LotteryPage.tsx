import { AlertTriangle, CircleAlert } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import type { SiteSettings } from '../../shared/models';
import { MAX_VRC_NAME_LENGTH, normalizeWhitespace } from '../../shared/validation';
import { illustrations } from '../assets/illustrations';
import { PageIntro } from '../components/PageIntro';
import { submitLotteryEntry } from '../lib/api';
import { dispatchCafeLotteryPulse } from '../lib/cafe-scene-events';
import { runtimeMode } from '../lib/firebase';
import { lotteryStatusLabels } from '../lib/format';

interface LotteryPageProps {
  settings: SiteSettings;
}

export const LotteryPage = ({ settings }: LotteryPageProps) => {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const confirmationRef = useRef<HTMLDivElement | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const disabled = settings.lotteryStatus !== 'open';
  const normalizedDisplayName = normalizeWhitespace(displayName);

  useEffect(() => {
    if (confirmationVisible) {
      confirmationRef.current?.focus();
    }
  }, [confirmationVisible]);

  useEffect(() => {
    if (errorMessage || successMessage) {
      messageRef.current?.focus();
    }
  }, [errorMessage, successMessage]);

  const validate = (): string => {
    if (normalizedDisplayName.length === 0) {
      return 'VRC名を入力してください';
    }

    if (normalizedDisplayName.length > MAX_VRC_NAME_LENGTH) {
      return `VRC名は${MAX_VRC_NAME_LENGTH}文字以内で入力してください`;
    }

    return '';
  };

  const handleConfirm = () => {
    const validationMessage = validate();
    setSuccessMessage('');

    if (validationMessage) {
      setErrorMessage(validationMessage);
      setConfirmationVisible(false);
      return;
    }

    setErrorMessage('');
    setConfirmationVisible(true);
    dispatchCafeLotteryPulse();
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleConfirm();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    dispatchCafeLotteryPulse();

    try {
      await submitLotteryEntry(normalizedDisplayName);
      setSuccessMessage(
        runtimeMode === 'sample'
          ? 'サンプルモードで登録を確認しました。Firebase設定後にこのまま本登録になります。'
          : '抽選への登録が完了しました。スタッフからの案内をお待ちください。',
      );
      setDisplayName('');
      setConfirmationVisible(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '通信に失敗しました。もう一度お試しください',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="Lottery Entry"
        title="抽選受付"
        description="カウンター前で受付するような感覚で、VRC名だけを入力して抽選に参加できます。確認ステップを挟み、二重送信や入力ミスも起きにくくしています。"
        imageSrc={illustrations.lotteryGuide}
        imageAlt="抽選受付を案内するカフェ風イラスト"
        caption="Lottery Counter"
        chips={[
          `現在の受付状態: ${lotteryStatusLabels[settings.lotteryStatus]}`,
          '登録はVRC名のみ',
        ]}
        reverse
      >
        <strong>受付前の注意</strong>
        <p>
          必ずVRChatで使っているVRC名を入力してください。X名やDiscord名では登録できません。
        </p>
      </PageIntro>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Entry Form</span>
            <h2>抽選フォーム</h2>
          </div>
          <span className={`status-pill status-${settings.lotteryStatus}`}>
            {lotteryStatusLabels[settings.lotteryStatus]}
          </span>
        </div>

        <p>{settings.lotteryNotice}</p>

        <div className="warning-box" role="alert">
          <AlertTriangle size={20} />
          <div>
            <strong>必ずVRC名を入力してください。</strong>
            <p>
              Xの名前、Discordの名前、ニックネームなどは使用しないでください。個人情報は入力しないでください。
            </p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit}>
          <label htmlFor={inputId} className="field-label">
            VRC名
          </label>
          <input
            id={inputId}
            type="text"
            className="text-input"
            disabled={disabled || submitting}
            value={displayName}
            maxLength={MAX_VRC_NAME_LENGTH}
            autoComplete="off"
            inputMode="text"
            onChange={(event) => setDisplayName(event.target.value)}
            aria-invalid={errorMessage ? true : undefined}
            aria-describedby={errorMessage ? `${helperId} ${errorId}` : helperId}
          />
          <p id={helperId} className="helper-text">
            前後の空白は自動で整形されます。登録前に確認画面で内容を確認できます。
          </p>

          <div className="form-actions">
            <button type="submit" className="primary-button inline-button" disabled={disabled || submitting}>
              入力内容を確認する
            </button>
          </div>

          {confirmationVisible ? (
            <div className="confirmation-card" ref={confirmationRef} tabIndex={-1}>
              <h2>入力内容の確認</h2>
              <p>この名前で抽選へ登録しますか。</p>
              <strong>{normalizedDisplayName}</strong>
              <div className="form-actions">
                <button
                  type="button"
                  className="primary-button inline-button"
                  disabled={submitting}
                  onClick={() => void handleSubmit()}
                >
                  {submitting ? '登録中…' : 'この内容で登録する'}
                </button>
                <button
                  type="button"
                  className="secondary-button inline-button"
                  disabled={submitting}
                  onClick={() => setConfirmationVisible(false)}
                >
                  戻る
                </button>
              </div>
            </div>
          ) : null}

          {disabled ? (
            <p className="helper-text">
              <CircleAlert size={16} />
              現在の受付状態: {lotteryStatusLabels[settings.lotteryStatus]}
            </p>
          ) : null}

          {errorMessage ? (
            <p
              id={errorId}
              ref={messageRef}
              className="error-text"
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
            >
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <p
              ref={messageRef}
              className="success-text"
              role="status"
              aria-live="polite"
              tabIndex={-1}
            >
              {successMessage}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  );
};
