import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { SiteSettings } from '../../shared/models';
import { LotteryPage } from './LotteryPage';

const makeSettings = (lotteryStatus: SiteSettings['lotteryStatus']): SiteSettings => ({
  siteName: '2026年3月同期会 Event Cafe',
  siteDescription: 'sample',
  lotteryStatus,
  lotteryNotice:
    '抽選に参加する方は、VRChatで使用している名前を入力してください。',
  joinGuideNote: 'sample',
  supportEmail: 'event-cafe@example.com',
  updatedAt: '2026-06-29T00:00:00.000Z',
});

describe('LotteryPage', () => {
  it('shows the VRC-name warning', () => {
    render(<LotteryPage settings={makeSettings('open')} />);

    expect(
      screen.getByText(
        'Xの名前、Discordの名前、ニックネームなどは使用しないでください。個人情報は入力しないでください。',
      ),
    ).toBeInTheDocument();
  });

  it('shows an error when the user tries to confirm without input', () => {
    render(<LotteryPage settings={makeSettings('open')} />);

    fireEvent.click(screen.getByRole('button', { name: '入力内容を確認する' }));

    expect(screen.getByText('VRC名を入力してください')).toBeInTheDocument();
  });

  it('disables the form while the lottery is paused', () => {
    render(<LotteryPage settings={makeSettings('paused')} />);

    expect(screen.getByRole('textbox', { name: 'VRC名' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '入力内容を確認する' })).toBeDisabled();
  });
});
