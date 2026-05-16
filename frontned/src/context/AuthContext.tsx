import {

  createContext,
  useContext,
  useEffect,
  useState

} from "react";

interface AuthContextType {

  accessToken: string | null;

  refreshToken: string | null;

  login: (
    access: string,
    refresh: string
  ) => void;

  logout: () => void;

  isAuthenticated: boolean;
}

const AuthContext =
  createContext<AuthContextType | null>(
    null
  );

export const AuthProvider = ({
  children
}: any) => {

  const [accessToken, setAccessToken] =
    useState<string | null>(null);

  const [refreshToken, setRefreshToken] =
    useState<string | null>(null);

  useEffect(() => {

    const access =
      localStorage.getItem("access");

    const refresh =
      localStorage.getItem("refresh");

    if (access && refresh) {

      setAccessToken(access);

      setRefreshToken(refresh);
    }

  }, []);

  const login = (
    access: string,
    refresh: string
  ) => {

    localStorage.setItem(
      "access",
      access
    );

    localStorage.setItem(
      "refresh",
      refresh
    );

    setAccessToken(access);

    setRefreshToken(refresh);
  };

  const logout = () => {

    localStorage.removeItem(
      "access"
    );

    localStorage.removeItem(
      "refresh"
    );

    setAccessToken(null);

    setRefreshToken(null);
  };

  return (

    <AuthContext.Provider
      value={{

        accessToken,

        refreshToken,

        login,

        logout,

        isAuthenticated:
          !!accessToken,
      }}
    >

      {children}

    </AuthContext.Provider>
  );
};

export const useAuth = () => {

  const context =
    useContext(AuthContext);

  if (!context) {

    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};