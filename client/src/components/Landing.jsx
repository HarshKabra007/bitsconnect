import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL ?? "";

export default function Landing() {
  const [params] = useSearchParams();
  const [online, setOnline] = useState(null);
  const error = params.get("error");
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const spotlightRef = useRef(null);
  const trailsRef = useRef([]);
  const rafRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    fetch(`${API}/api/online`)
      .then((r) => r.json())
      .then((d) => setOnline(d.count))
      .catch(() => {});
  }, []);

  // Mouse trail particles
  const [trails, setTrails] = useState([]);
  const trailIdRef = useRef(0);

  const handleMouseMove = useCallback((e) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };

    // Spotlight follows cursor
    if (spotlightRef.current) {
      spotlightRef.current.style.left = `${e.clientX}px`;
      spotlightRef.current.style.top = `${e.clientY}px`;
    }

    // Card tilt effect
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rotateX = ((e.clientY - centerY) / rect.height) * -8;
      const rotateY = ((e.clientX - centerX) / rect.width) * 8;
      cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }

    // Spawn trail particle
    const id = trailIdRef.current++;
    setTrails((prev) => [
      ...prev.slice(-15),
      { id, x: e.clientX, y: e.clientY, born: Date.now() },
    ]);
  }, []);

  // Clean up trail particles
  useEffect(() => {
    const interval = setInterval(() => {
      setTrails((prev) => prev.filter((t) => Date.now() - t.born < 800));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Reset card tilt on mouse leave
  const handleMouseLeave = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    }
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden cursor-none"
    >
      {/* Custom cursor */}
      <div
        className="pointer-events-none fixed z-50 mix-blend-difference"
        style={{ left: 0, top: 0 }}
      >
        {/* Outer ring */}
        <div
          className="absolute w-10 h-10 border border-white/60 rounded-full transition-transform duration-300 ease-out -translate-x-1/2 -translate-y-1/2"
          style={{
            left: mouseRef.current.x,
            top: mouseRef.current.y,
          }}
          ref={(el) => {
            if (!el) return;
            const animate = () => {
              el.style.left = `${mouseRef.current.x}px`;
              el.style.top = `${mouseRef.current.y}px`;
              requestAnimationFrame(animate);
            };
            if (!rafRef.current) rafRef.current = requestAnimationFrame(animate);
          }}
        />
      </div>

      {/* Mouse trail particles */}
      {trails.map((t) => {
        const age = (Date.now() - t.born) / 800;
        return (
          <div
            key={t.id}
            className="pointer-events-none fixed z-40 rounded-full bg-red-400/60"
            style={{
              left: t.x,
              top: t.y,
              width: `${6 * (1 - age)}px`,
              height: `${6 * (1 - age)}px`,
              opacity: 1 - age,
              transform: `translate(-50%, -50%) scale(${1 - age * 0.5})`,
              transition: "opacity 0.1s",
            }}
          />
        );
      })}

      {/* Cursor spotlight glow */}
      <div
        ref={spotlightRef}
        className="pointer-events-none fixed z-0 w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/[0.04] blur-[80px] transition-opacity duration-500"
      />

      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0a0a0f]" />
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-red-600/25 to-transparent rounded-full blur-[120px] animate-drift-1" />
        <div className="absolute top-[10%] right-[-15%] w-[500px] h-[500px] bg-gradient-to-bl from-violet-600/20 to-transparent rounded-full blur-[120px] animate-drift-2" />
        <div className="absolute bottom-[-10%] left-[20%] w-[550px] h-[550px] bg-gradient-to-tr from-blue-600/15 to-transparent rounded-full blur-[120px] animate-drift-3" />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-gradient-to-b from-rose-500/10 to-transparent rounded-full blur-[100px] animate-drift-4" />
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Glass card with 3D tilt */}
      <div className="relative max-w-md w-full" style={{ transformStyle: "preserve-3d" }}>
        <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-violet-500/20 to-blue-500/20 rounded-3xl blur-xl opacity-60 animate-glow" />
        <div
          ref={cardRef}
          className="relative backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-3xl px-8 py-12 shadow-2xl shadow-black/40 transition-transform duration-200 ease-out"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Card border glow on hover */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />

          <div className="relative" style={{ transform: "translateZ(40px)" }}>
            <div className="inline-block px-4 py-1.5 rounded-full border border-white/10 text-[10px] tracking-[0.2em] uppercase text-zinc-400 mb-8 bg-white/[0.03] backdrop-blur-sm animate-fade-in-down">
              BITS Pilani · Pilani Campus
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-none animate-fade-in-up">
              BITS<span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">Connect</span>
            </h1>

            <p className="mt-4 text-zinc-400 text-base leading-relaxed animate-fade-in-up animation-delay-100">
              Talk to a random BITSian.<br />Anonymously.
            </p>

            {online !== null && (
              <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] animate-fade-in-up animation-delay-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs text-zinc-400">{online} online now</span>
              </div>
            )}

            <a
              href={`${API}/api/auth/google`}
              className="group mt-8 w-full inline-flex items-center justify-center gap-3 bg-white/[0.9] backdrop-blur-sm text-zinc-900 font-semibold px-6 py-3.5 rounded-2xl hover:bg-white hover:scale-[1.03] hover:shadow-xl hover:shadow-red-500/10 active:scale-[0.97] transition-all duration-200 shadow-lg shadow-black/20 animate-fade-in-up animation-delay-300 cursor-none"
            >
              <GoogleIcon />
              <span className="group-hover:tracking-wider transition-all duration-200">Sign in with Google</span>
            </a>

            <p className="mt-5 text-[11px] text-zinc-500 animate-fade-in-up animation-delay-400">
              Only <code className="bg-white/[0.06] px-1.5 py-0.5 rounded text-zinc-400 font-mono text-[10px]">@pilani.bits-pilani.ac.in</code> accounts
            </p>

            {error && (
              <div className="mt-6 text-sm text-red-400 border border-red-500/20 bg-red-500/[0.06] rounded-xl p-3 backdrop-blur-sm">
                {decodeURIComponent(error)}
              </div>
            )}
          </div>
        </div>

        <p className="mt-8 text-[11px] text-zinc-600 tracking-wide animate-fade-in-up animation-delay-500">
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
