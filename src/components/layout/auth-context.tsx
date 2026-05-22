"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AuthMeData = {
  user: { id: string; email: string };
  nomeCompleto: string;
  perfil: { slug: string; nome: string; descricao?: string | null } | null;
  permissions: string[];
  canViewAllEleitores: boolean;
  canAccessUsuarios: boolean;
  isSuperAdmin: boolean;
};

type AuthContextValue = {
  auth: AuthMeData | null;
  loading: boolean;
  refresh: () => void;
};

const AuthContext = createContext<AuthContextValue>({
  auth: null,
  loading: true,
  refresh: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthMeData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setAuth({
            user: j.data.user,
            nomeCompleto: j.data.nomeCompleto ?? j.data.user.email,
            perfil: j.data.perfil ?? null,
            permissions: j.data.permissions ?? [],
            canViewAllEleitores: j.data.canViewAllEleitores === true,
            canAccessUsuarios: j.data.canAccessUsuarios === true,
            isSuperAdmin: j.data.isSuperAdmin === true,
          });
        } else {
          setAuth(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setAuth(null);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ auth, loading, refresh }), [auth, loading, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
