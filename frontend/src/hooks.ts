import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api";

export function useQuery<T>(path: string | null) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(true);
  const [generation, setGeneration] = useState(0);
  const reload = useCallback(() => setGeneration((n) => n + 1), []);
  useEffect(() => {
    if (path === null) {
      setData(undefined);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(undefined);
    setData(undefined);
    api<T>(path, { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch((reason: Error) => {
        if (!controller.signal.aborted) setError(reason);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, generation]);
  return { data, error, loading, reload };
}

export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error>();
  const [success, setSuccess] = useState("");
  async function run(
    action: () => Promise<unknown>,
    after?: () => void,
    message = "",
  ) {
    if (busy) return false;
    setBusy(true);
    setError(undefined);
    setSuccess("");
    try {
      await action();
      setSuccess(message);
      after?.();
      return true;
    } catch (reason) {
      setError(
        reason instanceof Error ? reason : new ApiError("Please try again.", 0),
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  return {
    busy,
    error,
    success,
    run,
    clear: () => {
      setError(undefined);
      setSuccess("");
    },
  };
}
