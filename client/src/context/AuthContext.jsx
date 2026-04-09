import { createContext, useContext, useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "";
const AuthContext = createContext(null);

// On first load, grab token from URL (Google OAuth redirect) and save it.
(function captureTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const t = params.get("token");
  if (t) {
    localStorage.setItem("token", t);
    // Clean the URL so token isn't visible
    params.delete("token");
    const clean = params.toString();
    const newUrl = window.location.pathname + (clean ? `?${clean}` : "");
    window.history.replaceState({}, "", newUrl);
  }
})();

function authHeaders() {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(null); // null = loading
  useEffect(() => {
    fetch(`${API}/api/auth/me`, { credentials: "include", headers: authHeaders() })
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);
  const login = async () => {
    const r = await fetch(`${API}/api/auth/dev`, {
      method: "POST",
      credentials: "include",
    });
    if (r.ok) {
      const data = await r.json().catch(() => ({}));
      if (data.token) localStorage.setItem("token", data.token);
      setAuthed(true);
      window.location.href = "/chat";
    }
  };
  const logout = async () => {
    await fetch(`${API}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: authHeaders(),
    });
    localStorage.removeItem("token");
    setAuthed(false);
  };
  return (
    <AuthContext.Provider value={{ authed, login, logout, API }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
