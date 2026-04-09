const TAGS = ["Coding", "Music", "Sports", "Anime", "Startups", "Memes", "Acads", "Fest Talk", "Movies", "Gaming"];

export default function InterestTags({ selected, onChange }) {
  const toggle = (tag) => {
    if (selected.includes(tag)) onChange(selected.filter((t) => t !== tag));
    else onChange([...selected, tag]);
  };
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {TAGS.map((tag) => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => toggle(tag)}
            className={
              "px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 " +
              (active
                ? "bg-white/90 text-zinc-900 border-white/80 shadow-md shadow-white/10 scale-105"
                : "border-white/10 text-zinc-400 hover:border-white/20 hover:bg-white/[0.04]")
            }
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
