export default function MessageBubble({ content, mine }) {
  return (
    <div className={"flex " + (mine ? "justify-end" : "justify-start")}>
      <div
        className={
          "max-w-[75%] px-4 py-2 rounded-2xl text-sm break-words " +
          (mine
            ? "bg-white text-zinc-900 rounded-br-sm"
            : "bg-zinc-800 text-zinc-100 rounded-bl-sm")
        }
      >
        {content}
      </div>
    </div>
  );
}
