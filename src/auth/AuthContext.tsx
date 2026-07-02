import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { firebaseServices, runtimeMode } from '../lib/firebase';

interface AuthContextValue {
  authReady: boolean;
  user: User | null;
  isAdminSignedIn: boolean;
  runtimeMode: typeof runtimeMode;
}

const AuthContext = createContext<AuthContextValue>({
  authReady: runtimeMode === 'sample',
  user: null,
  isAdminSignedIn: false,
  runtimeMode,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(
    runtimeMode === 'sample' || firebaseServices.auth === null,
  );

  useEffect(() => {
    if (!firebaseServices.auth) {
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(firebaseServices.auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authReady,
      user,
      isAdminSignedIn: Boolean(user),
      runtimeMode,
    }),
    [authReady, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => useContext(AuthContext);
