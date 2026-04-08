const TAGS = ["Coding","Music","Sports","Anime","Startups","Memes","Acads","Fest Talk","Movies","Gaming"];

export default function InterestTags({ selected, onChange }) {
  const toggle = (tag) => {
    if (selected.includes(tag)) onChange(selected.filter((t) => t !== tag));
    else onChange([...selected, tag]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {TAGS.map((tag) => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => toggle(tag)}
            className={
              "px-3 py-1.5 rounded-full text-xs font-medium border transition " +
              (active
                ? "bg-white text-zinc-900 border-white"
                : "border-zinc-700 text-zinc-300 hover:border-zinc-500")
            }
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
