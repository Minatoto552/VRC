import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { runtimeMode } from '../lib/firebase';
import { isLocalAdminSignedIn, LOCAL_ADMIN_SESSION_EVENT } from '../lib/local-admin';

interface AuthContextValue {
  authReady: boolean;
  isAdminSignedIn: boolean;
  runtimeMode: typeof runtimeMode;
}

const AuthContext = createContext<AuthContextValue>({
  authReady: true,
  isAdminSignedIn: false,
  runtimeMode,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAdminSignedIn, setIsAdminSignedIn] = useState<boolean>(() => isLocalAdminSignedIn());

  useEffect(() => {
    const syncSession = () => {
      setIsAdminSignedIn(isLocalAdminSignedIn());
    };

    window.addEventListener(LOCAL_ADMIN_SESSION_EVENT, syncSession);
    window.addEventListener('storage', syncSession);

    return () => {
      window.removeEventListener(LOCAL_ADMIN_SESSION_EVENT, syncSession);
      window.removeEventListener('storage', syncSession);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authReady: true,
      isAdminSignedIn,
      runtimeMode,
    }),
    [isAdminSignedIn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => useContext(AuthContext);
