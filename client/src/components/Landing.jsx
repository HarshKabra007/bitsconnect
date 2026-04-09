import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL ?? "";

export default function Landing() {
  const [params] = useSearchParams();
  const [online, setOnline] = useState(null);
  const error = params.get("error");

  useEffect(() => {
    fetch(`${API}/api/online`)
      .then((r) => r.json())
      .then((d) => setOnline(d.count))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-lg w-full">
        <div className="inline-block px-3 py-1 rounded-full border border-zinc-700 text-xs tracking-widest uppercase text-zinc-400 mb-6">
          BITS Pilani · Pilani Campus
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">BITSConnect</h1>
        <p className="mt-4 text-zinc-400 text-lg">
          Talk to a random BITSian. Anonymously.
        </p>

        {online !== null && (
          <p className="mt-6 text-sm text-zinc-500">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2" />
            {online} online now
          </p>
        )}

        <a
          href={`${API}/api/auth/google`}
          className="mt-10 inline-flex items-center gap-3 bg-white text-zinc-900 font-medium px-6 py-3 rounded-lg hover:bg-zinc-100 transition"
        >
          <GoogleIcon />
          Sign in with Google
        </a>

        <p className="mt-4 text-xs text-zinc-500">
          Only <code>@pilani.bits-pilani.ac.in</code> accounts allowed.
        </p>

        {error && (
          <div className="mt-6 text-sm text-red-400 border border-red-900/50 bg-red-950/30 rounded-lg p-3">
            {decodeURIComponent(error)}
          </div>
        )}

        <div className="mt-12 text-xs text-zinc-600">
          Chats are ephemeral. Nothing is stored. Stay kind.
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
