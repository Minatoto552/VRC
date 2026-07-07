import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getIdTokenResult, onIdTokenChanged } from 'firebase/auth';

import { firebaseServices, runtimeMode } from '../lib/firebase';
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
  const [authReady, setAuthReady] = useState(!firebaseServices.auth);
  const [isFirebaseAdmin, setIsFirebaseAdmin] = useState(false);
  const [isLocalAdmin, setIsLocalAdmin] = useState<boolean>(() => isLocalAdminSignedIn());

  useEffect(() => {
    if (!firebaseServices.auth) {
      setAuthReady(true);
      return undefined;
    }

    return onIdTokenChanged(firebaseServices.auth, (user) => {
      setAuthReady(false);

      if (!user) {
        setIsFirebaseAdmin(false);
        setAuthReady(true);
        return;
      }

      void getIdTokenResult(user, true)
        .then((tokenResult) => {
          setIsFirebaseAdmin(tokenResult.claims['admin'] === true);
        })
        .catch(() => {
          setIsFirebaseAdmin(false);
        })
        .finally(() => {
          setAuthReady(true);
        });
    });
  }, []);

  useEffect(() => {
    const syncSession = () => {
      setIsLocalAdmin(isLocalAdminSignedIn());
    };

    window.addEventListener(LOCAL_ADMIN_SESSION_EVENT, syncSession);
    window.addEventListener('storage', syncSession);

    return () => {
      window.removeEventListener(LOCAL_ADMIN_SESSION_EVENT, syncSession);
      window.removeEventListener('storage', syncSession);
    };
  }, []);

  const isAdminSignedIn = isFirebaseAdmin || isLocalAdmin;

  const value = useMemo<AuthContextValue>(
    () => ({
      authReady,
      isAdminSignedIn,
      runtimeMode,
    }),
    [authReady, isAdminSignedIn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => useContext(AuthContext);
