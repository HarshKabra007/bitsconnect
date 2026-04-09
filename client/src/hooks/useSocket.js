import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_URL ?? "";

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const opts = { withCredentials: true, auth: token ? { token } : {} };
    const s = API ? io(API, opts) : io(opts);
    socketRef.current = s;
    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    return () => s.disconnect();
  }, []);

  return { socket: socketRef.current, connected };
}
