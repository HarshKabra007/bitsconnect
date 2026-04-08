import { createContext, useContext, useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(null); // null = loading
  useEffect(() => {
    fetch(`${API}/api/auth/me`, { credentials: "include" })
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);
  const login = async () => {
    const r = await fetch(`${API}/api/auth/dev`, {
      method: "POST",
      credentials: "include",
    });
    if (r.ok) {
      setAuthed(true);
      window.location.href = "/chat";
    }
  };
  const logout = async () => {
    await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "include" });
    setAuthed(false);
  };
  return (
    <AuthContext.Provider value={{ authed, login, logout, API }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
