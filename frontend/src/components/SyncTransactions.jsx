import { useState } from "react";
import { syncTransactions } from "../api/plaid";

export default function SyncTransactions({ onSynced }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSync() {
    try {
      setLoading(true);
      setMessage("");
      setError("");

      const result = await syncTransactions();

      setMessage(
        `Sync complete: ${result.added} added, ${result.modified} updated, ${result.removed} removed.`
      );

      await onSynced?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to synchronize transactions."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {loading ? "Synchronizing..." : "Sync Transactions"}
      </button>

      {message && (
        <p className="text-sm text-green-700" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
