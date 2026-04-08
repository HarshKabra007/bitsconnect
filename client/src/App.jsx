import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Landing from "./components/Landing.jsx";
import ChatRoom from "./components/ChatRoom.jsx";

function Protected({ children }) {
  const { authed } = useAuth();
  if (authed === null) {
    return (
      <div className="h-screen flex items-center justify-center text-zinc-500 text-sm">
        Loading…
      </div>
    );
  }
  if (!authed) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/chat"
          element={
            <Protected>
              <ChatRoom />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
