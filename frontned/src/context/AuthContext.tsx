import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

// ── Types ────────────────────────────────────────────────
interface AuthUser {
  id: number;
  username: string;
  email: string;
  phone_number: string | null;
  is_email_verified: boolean;
  preferred_language: string;
  created_at: string;
}

interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  login: (access: string, refresh: string, userData?: AuthUser) => void;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// ── Context ──────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ─────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const access  = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");
    const stored  = localStorage.getItem("user");

    if (access && refresh) {
      setAccessToken(access);
      setRefreshToken(refresh);
    }
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  // ── login (email/password) ────────────────────────────
  const login = (
    access: string,
    refresh: string,
    userData?: AuthUser
  ) => {
    localStorage.setItem("access",  access);
    localStorage.setItem("refresh", refresh);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    }
    setAccessToken(access);
    setRefreshToken(refresh);
  };

  // ── googleLogin ───────────────────────────────────────
  const googleLogin = async (credential: string): Promise<void> => {
    const response = await fetch(
      "http://127.0.0.1:8000/api/auth/google/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || data.message || "Google login failed"
      );
    }

    login(data.tokens.access, data.tokens.refresh, data.user);
  };

  // ── logout ────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        refreshToken,
        user,
        login,
        googleLogin,
        logout,
        isAuthenticated: !!accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};