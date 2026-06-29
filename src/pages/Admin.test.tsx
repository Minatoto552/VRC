import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Admin } from './Admin';

vi.mock('../lib/firebase', () => ({ auth: undefined }));
vi.mock('../lib/dataService', () => ({ adminLogin: vi.fn() }));

describe('Admin page', () => {
  it('blocks non-admin users with login screen', () => {
    render(<Admin />);

    expect(screen.getByText('管理者以外は閲覧できません。')).toBeInTheDocument();
    expect(screen.getByLabelText('管理者パスワード')).toBeInTheDocument();
  });
});
