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
 * Menyinkronkan state dengan tabel public.app_state.
 *
 * Perlindungan:
 * - Tidak melakukan autosave selama data sedang dimuat.
 * - Tidak melakukan autosave jika pembacaan Supabase gagal.
 * - Seed hanya digunakan jika query berhasil dan baris belum ada.
 * - Error pemuatan dan penyimpanan dicatat dengan jelas.
 */
export function useCloudState<T extends object>(
  key: CloudKey,
  initial: T
) {
  const [state, setState] = useState<T>(() => cloneJson(initial));
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");

  const loadedKey = useRef<CloudKey | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadedKey.current = null;
    setLoadStatus("loading");

    async function load() {
      try {
        const result = await supabase
          .from("app_state")
          .select("data")
          .eq("key", key)
          .maybeSingle();

        if (cancelled) return;

        if (result.error) {
          throw result.error;
        }

        if (result.data === null) {
          // Query berhasil dan baris memang belum ada.
          // Hanya kondisi ini yang mengizinkan penggunaan seed.
          setState(cloneJson(initial));
        } else {
          const saved = result.data.data;

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

          // Data server diprioritaskan. Seed hanya melengkapi
          // field tingkat atas yang belum tersedia.
          const merged = {
            ...cloneJson(initial),
            ...(saved as Partial<T>),
          } as T;

          setState(merged);
        }

        loadedKey.current = key;
        setLoadStatus("ready");
      } catch (error) {
        if (cancelled) return;

        loadedKey.current = null;
        setLoadStatus("error");

        console.error(
          "[useCloudState] Gagal memuat key '" +
            key +
            "'. Autosave diblokir.",
          error
        );
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    // Jangan menyimpan seed ketika loading atau terjadi error.
    if (loadStatus !== "ready" || loadedKey.current !== key) {
      return;
    }

    const snapshot = cloneJson(state);

    const timeout = setTimeout(async () => {
      try {
        const result = await supabase
          .from("app_state")
          .upsert({
            key: key,
            data: snapshot,
            updated_at: new Date().toISOString(),
          });

        if (result.error) {
          throw result.error;
        }
      } catch (error) {
        console.error(
          "[useCloudState] Gagal menyimpan key '" +
            key +
            "'. Perubahan mungkin belum tersimpan.",
          error
        );
      }
    }, 600);

    return () => {
      clearTimeout(timeout);
    };
  }, [key, state, loadStatus]);

  const safeSetState = useCallback<
    React.Dispatch<React.SetStateAction<T>>
  >(
    (value) => {
      // Tolak perubahan sampai data untuk key aktif berhasil dimuat.
      if (loadedKey.current !== key) {
        console.warn(
          "[useCloudState] Perubahan untuk '" +
            key +
            "' ditahan karena data belum berhasil dimuat."
        );
        return;
      }

      setState(value);
    },
    [key]
  );

  return [state, safeSetState] as const;
}

/** Membuat setter untuk satu field dari gabungan cloud state. */
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
