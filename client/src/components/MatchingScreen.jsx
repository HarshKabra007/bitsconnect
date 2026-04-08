import { useEffect, useState } from "react";

const FACTS = [
  "BITS Pilani was founded in 1964.",
  "The Clock Tower is Pilani's most iconic landmark.",
  "Oasis and APOGEE are BITS Pilani's two biggest fests.",
  "The Saraswati Temple on campus is open to all.",
  "BITSians call their campus 'home' for 4 years and forever after.",
  "The library stays open late during compre week.",
  "Connaught Circle is Pilani's unofficial hangout spot.",
];

export default function MatchingScreen({ onCancel }) {
  const [fact, setFact] = useState(FACTS[0]);
  useEffect(() => {
    const i = setInterval(() => {
      setFact(FACTS[Math.floor(Math.random() * FACTS.length)]);
    }, 4000);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="flex gap-2 mb-6">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-zinc-500 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <h2 className="text-xl font-semibold">Looking for a stranger…</h2>
      <p className="mt-2 text-sm text-zinc-400 max-w-xs">
        Matching you with another BITSian. Hang tight.
      </p>
      <div className="mt-10 text-xs text-zinc-500 italic max-w-sm">💡 {fact}</div>
      <button
        onClick={onCancel}
        className="mt-10 text-sm text-zinc-400 hover:text-white underline underline-offset-4"
      >
        Cancel
      </button>
    </div>
  );
}
