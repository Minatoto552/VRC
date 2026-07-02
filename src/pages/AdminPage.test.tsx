import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AdminPage } from './AdminPage';

describe('AdminPage', () => {
  it('does not expose the admin dashboard to non-admin visitors', () => {
    render(<AdminPage />);

    expect(screen.getByRole('heading', { name: '運営用管理サイト' })).toBeInTheDocument();
    expect(screen.getByLabelText('管理用パスワード')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ダッシュボード' })).not.toBeInTheDocument();
  });
});
