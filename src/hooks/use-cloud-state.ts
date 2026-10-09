import type React from "react";
import { useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export type CloudKey = "situasi" | "strategi" | "aksi";

/**
 * Keeps a JSON-serialisable state object in sync with the shared `app_state` row.
 * Starts from `initial`, loads the saved snapshot after mount, then saves changes (debounced).
 */
export function useCloudState<T extends object>(key: CloudKey, initial: T) {
  const [state, setState] = useState<T>(initial);
  const loaded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    supabase.from("app_state").select("data").eq("key", key).maybeSingle().then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.error("Gagal memuat data", key, error);
      if (data?.data && typeof data.data === "object") setState((cur) => ({ ...cur, ...(data.data as Partial<T>) }));
      loaded.current = true;
    });
    return () => { cancelled = true; };
  }, [key]);

  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => {
      supabase.from("app_state").upsert({ key, data: JSON.parse(JSON.stringify(state)), updated_at: new Date().toISOString() })
        .then(({ error }) => { if (error) console.error("Gagal menyimpan data", key, error); });
    }, 600);
    return () => clearTimeout(t);
  }, [key, state]);

  return [state, setState] as const;
}

/** Derive a per-field setter from a combined cloud state. */
export function field<T extends object, K extends keyof T>(set: React.Dispatch<React.SetStateAction<T>>, k: K) {
  return (v: T[K] | ((cur: T[K]) => T[K])) =>
    set((s) => ({ ...s, [k]: typeof v === "function" ? (v as (c: T[K]) => T[K])(s[k]) : v }));
}
