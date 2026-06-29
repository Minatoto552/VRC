import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Lottery } from './Lottery';

vi.mock('../lib/dataService', () => ({
  listenSettings: (callback: (settings: unknown) => void) => {
    callback({
      siteName: '',
      siteDescription: '',
      lotteryStatus: 'open',
      lotteryGuide: '抽選に参加する方は、VRChatで使用している名前を入力してください。',
      joinGuide: '',
    });
    return () => undefined;
  },
  submitLotteryEntry: vi.fn(),
}));

describe('Lottery page', () => {
  it('renders form and warning', () => {
    render(<Lottery />);

    expect(screen.getByRole('heading', { name: '抽選受付' })).toBeInTheDocument();
    expect(screen.getByText(/必ずVRC名を入力してください/)).toBeInTheDocument();
  });

  it('shows blank error', async () => {
    render(<Lottery />);

    await userEvent.click(screen.getByRole('button', { name: '抽選に登録する' }));

    expect(await screen.findByText('VRC名を入力してください')).toBeInTheDocument();
  });
});
