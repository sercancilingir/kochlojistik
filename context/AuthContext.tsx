import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getBaseUrl, setAuthToken } from '@/lib/api';

const USER_KEY = 'koch_auth_user';
const TOKEN_KEY = 'koch_auth_token';

export interface AuthUser {
  username: string;
  role: string;
  permissions?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session: load stored user + token, then validate with /api/auth/me.
    (async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(TOKEN_KEY),
        ]);

        if (!storedUser || !storedToken) {
          // Nothing stored — guest state.
          setLoading(false);
          return;
        }

        // Wire up the token so apiFetch includes it.
        setAuthToken(storedToken);

        // Validate the token is still accepted by the server.
        const res = await fetch(`${getBaseUrl()}/api/auth/me`, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (res.ok) {
          setUser(JSON.parse(storedUser) as AuthUser);
        } else {
          // Token rejected (server restarted, token expired) — clear stored creds.
          setAuthToken(null);
          await Promise.all([
            AsyncStorage.removeItem(USER_KEY),
            AsyncStorage.removeItem(TOKEN_KEY),
          ]);
        }
      } catch {
        // Network unavailable on launch: keep stored user so UI renders;
        // API calls will fail with 401 and show retry buttons.
        try {
          const storedUser = await AsyncStorage.getItem(USER_KEY);
          const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
          if (storedUser && storedToken) {
            setAuthToken(storedToken);
            setUser(JSON.parse(storedUser) as AuthUser);
          }
        } catch {
          // ignore
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (
    username: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${getBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        return { success: false, error: err.message ?? 'Geçersiz kimlik bilgileri.' };
      }

      const data = (await res.json()) as {
        username: string;
        role: string;
        permissions?: string;
        token?: string;
      };

      const authUser: AuthUser = {
        username: data.username,
        role: data.role,
        permissions: data.permissions,
      };

      // Persist user and bearer token.
      const token = data.token ?? '';
      setAuthToken(token);
      setUser(authUser);
      await Promise.all([
        AsyncStorage.setItem(USER_KEY, JSON.stringify(authUser)),
        AsyncStorage.setItem(TOKEN_KEY, token),
      ]);

      return { success: true };
    } catch {
      return { success: false, error: 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.' };
    }
  };

  const logout = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      await fetch(`${getBaseUrl()}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // ignore network errors on logout
    }
    setAuthToken(null);
    setUser(null);
    await Promise.all([
      AsyncStorage.removeItem(USER_KEY),
      AsyncStorage.removeItem(TOKEN_KEY),
    ]);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
