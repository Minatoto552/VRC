import type { ReactNode } from 'react';

interface AdminGuardProps {
  allowed: boolean;
  fallback: ReactNode;
  children: ReactNode;
}

export const AdminGuard = ({ allowed, fallback, children }: AdminGuardProps) =>
  allowed ? <>{children}</> : <>{fallback}</>;
