import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL ?? "";

function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let mouse = { x: -1000, y: -1000 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e) => { mouse = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);

    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const f = (150 - dist) / 150;
          p.vx += (dx / dist) * f * 0.3;
          p.vy += (dy / dist) * f * 0.3;
        }
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const gd = Math.sqrt((p.x - mouse.x) ** 2 + (p.y - mouse.y) ** 2);
        const glow = gd < 200 ? (200 - gd) / 200 : 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + glow * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239,68,68,${p.alpha + glow * 0.6})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const d = Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(239,68,68,${(1 - d / 120) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        if (gd < 180) {
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `rgba(167,139,250,${(1 - gd / 180) * 0.25})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

function isInAppBrowser() {
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|Instagram|Line|WhatsApp|Snapchat|Twitter|LinkedInApp|MicroMessenger|TikTok/i.test(ua);
}

export default function Landing() {
  const [params] = useSearchParams();
  const [online, setOnline] = useState(null);
  const [inApp, setInApp] = useState(false);
  const error = params.get("error");

  useEffect(() => {
    setInApp(isInAppBrowser());
    fetch(`${API}/api/online`)
      .then((r) => r.json())
      .then((d) => setOnline(d.count))
      .catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden bg-[#06060a]">
      <ParticleBackground />

      {/* Gradient blobs */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-red-600/20 to-transparent rounded-full blur-[120px] animate-drift-1" />
        <div className="absolute top-[10%] right-[-15%] w-[500px] h-[500px] bg-gradient-to-bl from-violet-600/15 to-transparent rounded-full blur-[120px] animate-drift-2" />
        <div className="absolute bottom-[-10%] left-[20%] w-[550px] h-[550px] bg-gradient-to-tr from-blue-600/10 to-transparent rounded-full blur-[120px] animate-drift-3" />
      </div>

      {/* Card */}
      <div className="relative max-w-md w-full" style={{ zIndex: 10 }}>
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-3xl px-8 py-12 shadow-2xl shadow-black/40">
          <div className="inline-block px-4 py-1.5 rounded-full border border-white/10 text-[10px] tracking-[0.2em] uppercase text-zinc-400 mb-8 bg-white/[0.03]">
            BITS Pilani · Pilani Campus
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-none">
            bits<span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">TV</span>
          </h1>

          <p className="mt-4 text-zinc-400 text-base leading-relaxed">
            Talk to a random BITSian.<br />Anonymously.
          </p>

          {online !== null && (
            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs text-zinc-400">{online} online now</span>
            </div>
          )}

          {inApp ? (
            <div className="mt-6 text-sm text-yellow-300 border border-yellow-500/20 bg-yellow-500/[0.06] rounded-xl p-4 text-center">
              <p className="font-semibold">Open only in Chrome / Safari</p>
            </div>
          ) : (
            <a
              href={`${API}/api/auth/google`}
              className="mt-8 w-full inline-flex items-center justify-center gap-3 bg-white text-zinc-900 font-semibold px-6 py-3.5 rounded-2xl hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 shadow-lg"
            >
              <GoogleIcon />
              Sign in with Google
            </a>
          )}

          <p className="mt-5 text-[11px] text-zinc-500">
            Only <code className="bg-white/[0.06] px-1.5 py-0.5 rounded text-zinc-400 font-mono text-[10px]">@pilani.bits-pilani.ac.in</code> accounts
          </p>

          {error && (
            <div className="mt-6 text-sm text-red-400 border border-red-500/20 bg-red-500/[0.06] rounded-xl p-3">
              {decodeURIComponent(error)}
            </div>
          )}
        </div>

        <p className="mt-8 text-[11px] text-zinc-600 tracking-wide">
          Chats are ephemeral. Nothing is stored. Stay kind.
        </p>
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
