import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { createLinkToken, exchangePublicToken } from "../api/plaid";

export default function ConnectBank({ onConnected }) {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function initializePlaid() {
      try {
        setLoading(true);
        setError("");

        const token = await createLinkToken();

        if (active) {
          setLinkToken(token);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to initialize bank connection."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initializePlaid();

    return () => {
      active = false;
    };
  }, []);

  const onSuccess = useCallback(
    async (publicToken, metadata) => {
      try {
        setLoading(true);
        setError("");

        await exchangePublicToken(publicToken, metadata);
        await onConnected?.();
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to save your bank connection."
        );
      } finally {
        setLoading(false);
      }
    },
    [onConnected]
  );

  const config = {
    token: linkToken,
    onSuccess,
    onExit: (err) => {
      if (err) {
        setError(err.display_message || err.error_message || "Bank connection was closed.");
      }
    },
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <div>
      <button
        type="button"
        onClick={() => open()}
        disabled={!ready || loading || !linkToken}
        className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Connecting..."
          : !linkToken
            ? "Preparing bank connection..."
            : "Connect Bank"}
      </button>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
