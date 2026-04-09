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
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-zinc-950" />
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-slow-spin">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[128px]" />
          <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-500/8 rounded-full blur-[128px]" />
        </div>
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-lg w-full relative">
        <div className="inline-block px-4 py-1.5 rounded-full border border-zinc-700/50 text-xs tracking-widest uppercase text-zinc-400 mb-8 backdrop-blur-sm bg-zinc-900/30">
          BITS Pilani · Pilani Campus
        </div>
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight">
          BITS<span className="text-red-500">Connect</span>
        </h1>
        <p className="mt-4 text-zinc-400 text-lg">
          Talk to a random BITSian. Anonymously.
        </p>

        {online !== null && (
          <p className="mt-6 text-sm text-zinc-500">
            <span className="relative inline-block w-2 h-2 rounded-full bg-green-500 mr-2">
              <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
            </span>
            {online} online now
          </p>
        )}

        <a
          href={`${API}/api/auth/google`}
          className="mt-10 inline-flex items-center gap-3 bg-white text-zinc-900 font-semibold px-8 py-3.5 rounded-xl hover:bg-zinc-100 hover:scale-105 transition-all duration-200 shadow-lg shadow-white/5"
        >
          <GoogleIcon />
          Sign in with Google
        </a>

        <p className="mt-4 text-xs text-zinc-500">
          Only <code className="bg-zinc-800/50 px-1.5 py-0.5 rounded text-zinc-400">@pilani.bits-pilani.ac.in</code> accounts allowed.
        </p>

        {error && (
          <div className="mt-6 text-sm text-red-400 border border-red-900/50 bg-red-950/30 rounded-lg p-3 backdrop-blur-sm">
            {decodeURIComponent(error)}
          </div>
        )}

        <div className="mt-16 text-xs text-zinc-600">
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
