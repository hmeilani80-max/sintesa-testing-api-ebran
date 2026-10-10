```tsx
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export type CloudKey = "situasi" | "strategi" | "aksi";

type LoadStatus = "loading" | "ready" | "error";

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Synchronizes a JSON-serializable state object with public.app_state.
 *
 * Safety rules:
 * - Never autosave the initial seed while the server read is pending.
 * - Never autosave after a failed server read.
 * - Only enable autosave after a successful read, including a confirmed
 *   empty row for this key.
 * - Report load and save errors explicitly.
 */
export function useCloudState<T extends object>(key: CloudKey, initial: T) {
  const [state, setState] = useState<T>(() => cloneJson(initial));
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");

  const loadedKey = useRef<CloudKey | null>(null);
  const latestState = useRef(state);
  const saveVersion = useRef(0);

  // Keep the latest state available to asynchronous callbacks.
  useEffect(() => {
    latestState.current = state;
  }, [state]);

  useEffect(() => {
    let cancelled = false;

    loadedKey.current = null;
    setLoadStatus("loading");

    async function load() {
      try {
        const { data, error } = await supabase
          .from("app_state")
          .select("data")
          .eq("key", key)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          throw error;
        }

        // A successful query with no row is different from a failed query.
        // In the empty-row case, initial state may be used as the seed.
        if (data === null) {
          const seed = cloneJson(initial);
          latestState.current = seed;
          setState(seed);
        } else {
          const saved = data.data;

          if (
            saved === null ||
            typeof saved !== "object" ||
            Array.isArray(saved)
          ) {
            throw new Error(
  "Data Supabase untuk key '" +
    key +
    "' bukan objek JSON yang valid. Autosave diblokir."
            );
          }

          // Server data takes precedence. Initial values only fill missing
          // top-level fields, so newly introduced fields have safe defaults.
          const merged = {
            ...cloneJson(initial),
            ...(saved as Partial<T>),
          } as T;

          latestState.current = merged;
          setState(merged);
        }

        loadedKey.current = key;
        setLoadStatus("ready");
      } catch (error) {
        if (cancelled) return;

        loadedKey.current = null;
        setLoadStatus("error");
        console.error(`[useCloudState] Gagal memuat key "${key}". Autosave diblokir.`, error);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    // Critical safeguard: don't save while loading, after a read failure,
    // or if the active key hasn't finished loading.
    if (loadStatus !== "ready" || loadedKey.current !== key) {
      return;
    }

    const snapshot = cloneJson(state);
    const version = ++saveVersion.current;

    const timeout = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from("app_state")
          .upsert({
            key,
            data: snapshot,
            updated_at: new Date().toISOString(),
          });

        if (error) {
          throw error;
        }
      } catch (error) {
        console.error(`[useCloudState] Gagal menyimpan key "${key}". Perubahan mungkin belum tersimpan.`, error);
      }
    }, 600);

    return () => {
      clearTimeout(timeout);
    };
  }, [key, state, loadStatus]);

  // Expose a setter compatible with React's normal setState API.
  const safeSetState = useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (value) => {
      // While loading or after a read failure, block edits that could
      // later accidentally replace server data with the initial seed.
      if (loadedKey.current !== key) {
        console.warn(
          `[useCloudState] Perubahan untuk "${key}" ditahan karena data belum berhasil dimuat.`
        );
        return;
      }

      setState(value);
    },
    [key]
  );

  return [state, safeSetState] as const;
}

/** Derive a per-field setter from a combined cloud state. */
export function field<T extends object, K extends keyof T>(
  set: React.Dispatch<React.SetStateAction<T>>,
  k: K
) {
  return (v: T[K] | ((cur: T[K]) => T[K])) =>
    set((s) => ({
      ...s,
      [k]:
        typeof v === "function"
          ? (v as (c: T[K]) => T[K])(s[k])
          : v,
    }));
}
```
