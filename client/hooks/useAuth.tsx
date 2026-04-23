import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { normalizeSessionUser, type SessionUser } from '../lib/session';

export type AuthMode = 'login' | 'signup';

interface LoginInput {
  email: string;
  password: string;
}

interface SignupInput extends LoginInput {
  name: string;
  company: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  mode: AuthMode;
  isDialogOpen: boolean;
  openAuth: (mode: AuthMode) => void;
  closeAuth: () => void;
  switchMode: (mode: AuthMode) => void;
  refreshSession: () => Promise<SessionUser | null>;
  login: (input: LoginInput) => Promise<{ error?: string; user?: SessionUser }>;
  signup: (input: SignupInput) => Promise<{ error?: string; user?: SessionUser }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');

  const refreshSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await readJson<{ user: SessionUser | null }>(response);
      const normalizedUser = normalizeSessionUser(data.user);
      setUser(normalizedUser);
      return normalizedUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  const openAuth = (nextMode: AuthMode) => {
    setMode(nextMode);
    setIsDialogOpen(true);
  };

  const closeAuth = () => setIsDialogOpen(false);

  const switchMode = (nextMode: AuthMode) => setMode(nextMode);

  const login = async (input: LoginInput) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const data = await readJson<{
      error?: string;
      user?: SessionUser;
    }>(response);

    if (!response.ok || !data.user) {
      return { error: data.error || 'Unable to log in.' };
    }

    const normalizedUser = normalizeSessionUser(data.user);

    if (!normalizedUser) {
      setUser(null);
      return { error: 'Unable to load this account session.' };
    }

    setUser(normalizedUser);
    return { user: normalizedUser };
  };

  const signup = async (input: SignupInput) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const data = await readJson<{
      error?: string;
      user?: SessionUser;
    }>(response);

    if (!response.ok || !data.user) {
      return { error: data.error || 'Unable to create your account.' };
    }

    const normalizedUser = normalizeSessionUser(data.user);

    if (!normalizedUser) {
      setUser(null);
      return { error: 'Unable to load this account session.' };
    }

    setUser(normalizedUser);
    return { user: normalizedUser };
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      mode,
      isDialogOpen,
      openAuth,
      closeAuth,
      switchMode,
      refreshSession,
      login,
      signup,
      logout,
    }),
    [isDialogOpen, isLoading, mode, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
