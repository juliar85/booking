import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import client from "../api/client";

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "teacher";
  passwordIsTemporary: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (token: string, data: Omit<AuthUser, "passwordIsTemporary"> & { passwordIsTemporary: boolean }) => void;
  logout: () => void;
  setPasswordChanged: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    client
      .get("/auth/me")
      .then((res) => {
        setUser({
          id: res.data.id,
          email: res.data.email,
          firstName: res.data.first_name,
          lastName: res.data.last_name,
          role: res.data.role,
          passwordIsTemporary: res.data.password_is_temporary,
        });
      })
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    (token: string, data: Omit<AuthUser, "passwordIsTemporary"> & { passwordIsTemporary: boolean }) => {
      localStorage.setItem("token", token);
      setUser(data);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  const setPasswordChanged = useCallback(() => {
    setUser((prev) => prev && { ...prev, passwordIsTemporary: false });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setPasswordChanged }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
