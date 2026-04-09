import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL ?? "";

// Interactive particles that react to mouse
function useParticleCanvas() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Init particles
    const count = 80;
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 0.5,
      baseAlpha: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Mouse repulsion
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (150 - dist) / 150;
          p.vx += (dx / dist) * force * 0.3;
          p.vy += (dy / dist) * force * 0.3;
        }

        // Damping
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Glow near mouse
        const glowDist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
        const glow = glowDist < 200 ? (200 - glowDist) / 200 : 0;
        const alpha = p.baseAlpha + glow * 0.6;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + glow * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const d = Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2);
          if (d < 120) {
            const lineAlpha = (1 - d / 120) * 0.15;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(239, 68, 68, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Mouse connection lines to nearby particles
      for (const p of particles) {
        const d = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
        if (d < 180) {
          const lineAlpha = (1 - d / 180) * 0.3;
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `rgba(167, 139, 250, ${lineAlpha})`;
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
    };
  }, []);

  return { canvasRef, mouseRef };
}

export default function Landing() {
  const [params] = useSearchParams();
  const [online, setOnline] = useState(null);
  const error = params.get("error");
  const cardRef = useRef(null);
  const { canvasRef, mouseRef } = useParticleCanvas();
  const [ripples, setRipples] = useState([]);
  const rippleIdRef = useRef(0);

  useEffect(() => {
    fetch(`${API}/api/online`)
      .then((r) => r.json())
      .then((d) => setOnline(d.count))
      .catch(() => {});
  }, []);

  const handleMouseMove = useCallback((e) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };

    // Card tilt
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rx = ((e.clientY - cy) / rect.height) * -6;
      const ry = ((e.clientX - cx) / rect.width) * 6;
      cardRef.current.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000 };
    if (cardRef.current) {
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    }
  }, []);

  const handleClick = useCallback((e) => {
    const id = rippleIdRef.current++;
    setRipples((prev) => [...prev.slice(-5), { id, x: e.clientX, y: e.clientY, born: Date.now() }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 1000);
  }, []);

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden"
    >
      {/* Interactive particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: -1 }} />

      {/* Click ripples */}
      {ripples.map((r) => (
        <div
          key={r.id}
          className="pointer-events-none fixed z-30 rounded-full border border-red-400/40 animate-ripple"
          style={{ left: r.x, top: r.y, transform: "translate(-50%, -50%)" }}
        />
      ))}

      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#06060a]" />
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-red-600/20 to-transparent rounded-full blur-[120px] animate-drift-1" />
        <div className="absolute top-[10%] right-[-15%] w-[500px] h-[500px] bg-gradient-to-bl from-violet-600/15 to-transparent rounded-full blur-[120px] animate-drift-2" />
        <div className="absolute bottom-[-10%] left-[20%] w-[550px] h-[550px] bg-gradient-to-tr from-blue-600/10 to-transparent rounded-full blur-[120px] animate-drift-3" />
      </div>

      {/* Glass card */}
      <div className="relative max-w-md w-full z-10" style={{ transformStyle: "preserve-3d" }}>
        <div
          ref={cardRef}
          className="relative backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-3xl px-8 py-12 shadow-2xl shadow-black/40 transition-transform duration-200 ease-out"
          style={{ transformStyle: "preserve-3d" }}
        >

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
              className="relative z-50 mt-8 w-full inline-flex items-center justify-center gap-3 bg-white text-zinc-900 font-semibold px-6 py-3.5 rounded-2xl hover:bg-zinc-100 active:scale-[0.97] transition-all duration-200 shadow-lg shadow-black/20 animate-fade-in-up animation-delay-300"
            >
              <GoogleIcon />
              Sign in with Google
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
