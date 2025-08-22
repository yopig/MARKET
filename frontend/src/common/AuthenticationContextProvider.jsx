import { createContext, useCallback, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

const AuthenticationContext = createContext(null);

export function AuthenticationContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    setLoading(false);
  }, []);

  const restoreUserFromToken = useCallback(async () => {
    const tokenInStorage = localStorage.getItem("token");
    if (!tokenInStorage) {
      setLoading(false);
      return;
    }

    try {
      const payload = jwtDecode(tokenInStorage);
      if (payload.exp * 1000 < Date.now()) {
        logout();
        return;
      }

      const res = await axios.get("/api/member?email=" + payload.sub);
      setUser({
        email: res.data.email,
        nickName: res.data.nickName,
        scope: payload.scp.split(" "),
      });
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    restoreUserFromToken();
  }, [restoreUserFromToken]);

  const login = async (token) => {
    localStorage.setItem("token", token);
    await restoreUserFromToken();
  };

  const hasAccess = (email) => user && user.email === email;
  const isAdmin = () => user?.scope?.includes("admin");

  // memberEdit에서 필요한 것
  const updateUser = useCallback((newUserData) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      return { ...prevUser, ...newUserData };
    });
  }, []);

  // axios interceptor: 모든 요청에 token 붙이기
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  return (
    <AuthenticationContext.Provider
      value={{ user, login, logout, hasAccess, isAdmin, loading, updateUser }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
}

export { AuthenticationContext };
