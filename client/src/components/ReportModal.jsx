import { useState } from "react";

const REASONS = ["Harassment", "Spam", "Inappropriate Content", "Other"];

export default function ReportModal({ open, onClose, onSubmit }) {
  const [reason, setReason] = useState(REASONS[0]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold">Report this user</h3>
        <p className="text-sm text-zinc-400 mt-1">
          Your report is anonymous. We never store chat contents.
        </p>
        <div className="mt-4 space-y-2">
          {REASONS.map((r) => (
            <label
              key={r}
              className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 hover:border-zinc-600 cursor-pointer"
            >
              <input
                type="radio"
                name="reason"
                checked={reason === r}
                onChange={() => setReason(r)}
                className="accent-white"
              />
              <span className="text-sm">{r}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-zinc-700 text-sm hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSubmit(reason);
              onClose();
            }}
            className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-medium"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}
