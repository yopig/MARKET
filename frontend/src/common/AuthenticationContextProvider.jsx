  import { createContext, useEffect, useState } from "react";
  import { jwtDecode } from "jwt-decode";
  import axios from "axios";

  // 유효기간을 넘긴 토큰 삭제
  const token = localStorage.getItem("token");
  if (token) {
    const decoded = jwtDecode(token);
    const exp = decoded.exp;
    if (exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
    }
  }

  // axios interceptor
  // token 이 있으면 Authorization 헤더에 'Bearer token' 붙이기
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  // step1. create context
  const AuthenticationContext = createContext(null);

  export function AuthenticationContextProvider({ children }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = jwtDecode(token);
        axios.get("/api/member?email=" + payload.sub).then((res) => {
          // email
          // nickName
          setUser({
            email: res.data.email,
            nickName: res.data.nickName,
            scope: payload.scp.split(" "),
          });
        });
      }
    }, []);

    // login
    function login(token) {
      localStorage.setItem("token", token);
      const payload = jwtDecode(token);
      axios.get("/api/member?email=" + payload.sub).then((res) => {
        // email
        // nickName
        setUser({
          email: res.data.email,
          nickName: res.data.nickName,
          scope: payload.scp.split(" "),
        });
      });
    }

    // logout
    function logout() {
      localStorage.removeItem("token");
      setUser(null);
    }

    // hasAccess
    function hasAccess(email) {
      return user && user.email === email;
    }

    // isAdmin
    function isAdmin() {
      return user && user.scope && user.scope.includes("admin");
    }

    // step3. provide context
    return (
      <AuthenticationContext
        value={{
          user: user,
          login: login,
          logout: logout,
          hasAccess: hasAccess,
          isAdmin: isAdmin,
        }}
      >
        {children}
      </AuthenticationContext>
    );
  }

  export { AuthenticationContext };