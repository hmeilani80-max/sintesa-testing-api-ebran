import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export type CloudKey = "situasi" | "strategi" | "aksi";

export type CloudSaveStatus =
  | "loading"
  | "saving"
  | "saved"
  | "error";

export type CloudStateStatus = {
  load: "loading" | "ready" | "error";
  save: CloudSaveStatus;
  message: string | null;
};

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Terjadi kesalahan yang tidak diketahui.";
}

/**
 * Sinkronisasi state dengan public.app_state.
 *
 * - Seed tidak disimpan saat data masih dimuat atau gagal dibaca.
 * - Seed digunakan hanya jika query berhasil dan baris tidak ditemukan.
 * - Penyimpanan dilakukan berurutan agar operasi lama tidak selesai
 *   setelah operasi baru dan menimpa nilai terbaru.
 * - Status pemuatan dan penyimpanan tersedia sebagai elemen tuple ketiga.
 */
export function useCloudState<T extends object>(
  key: CloudKey,
  initial: T
) {
  const [state, setState] = useState<T>(() => cloneJson(initial));

  const [loadStatus, setLoadStatus] =
    useState<CloudStateStatus["load"]>("loading");

  const [saveStatus, setSaveStatus] =
    useState<CloudSaveStatus>("loading");

  const [statusMessage, setStatusMessage] =
    useState<string | null>(null);

  const loadedKey = useRef<CloudKey | null>(null);
  const loadRequest = useRef(0);
  const saveVersion = useRef(0);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    const requestId = loadRequest.current + 1;

    loadRequest.current = requestId;
    loadedKey.current = null;

    setLoadStatus("loading");
    setSaveStatus("loading");
    setStatusMessage(null);

    async function load() {
      try {
        const result = await supabase
          .from("app_state")
          .select("data")
          .eq("key", key)
          .maybeSingle();

        if (cancelled || loadRequest.current !== requestId) {
          return;
        }

        if (result.error) {
          throw result.error;
        }

        if (result.data === null) {
          // Query berhasil dan baris tidak ditemukan.
          // Kondisi ini mengizinkan penggunaan seed.
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
                "' bukan objek JSON yang valid."
            );
          }

          const merged = {
            ...cloneJson(initial),
            ...(saved as Partial<T>),
          } as T;

          setState(merged);
        }

        loadedKey.current = key;
        setLoadStatus("ready");
        setSaveStatus("saved");
        setStatusMessage(null);

        console.info(
          "[useCloudState] Data berhasil dimuat untuk key '" +
            key +
            "'."
        );
      } catch (error) {
        if (cancelled || loadRequest.current !== requestId) {
          return;
        }

        loadedKey.current = null;
        setLoadStatus("error");
        setSaveStatus("error");

        const message = getErrorMessage(error);
        setStatusMessage(
          "Gagal memuat data. Perubahan tidak akan disimpan."
        );

        console.error(
          "[useCloudState] Gagal memuat key '" + key + "'.",
          error
        );

        // Jangan mencetak isi state, token, atau kredensial.
        void message;
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    if (
      loadStatus !== "ready" ||
      loadedKey.current !== key
    ) {
      return;
    }

    const snapshot = cloneJson(state);
    const version = saveVersion.current + 1;

    saveVersion.current = version;

    setSaveStatus("saving");
    setStatusMessage(null);

    const timeout = setTimeout(() => {
      const operation = saveQueue.current.then(async () => {
        // Jangan mulai menulis snapshot dari key yang sudah berganti.
        if (loadedKey.current !== key) {
          return;
        }

        const result = await supabase
          .from("app_state")
          .upsert(
            {
              key: key,
              data: snapshot,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "key" }
          );

        if (result.error) {
          throw result.error;
        }

        if (
          loadedKey.current === key &&
          saveVersion.current === version
        ) {
          setSaveStatus("saved");
          setStatusMessage(null);

          console.info(
            "[useCloudState] Data berhasil disimpan untuk key '" +
              key +
              "'."
          );
        }
      });

      // Simpan antrean yang tetap berjalan walau operasi sebelumnya gagal.
      saveQueue.current = operation.catch((error: unknown) => {
        console.error(
          "[useCloudState] Gagal menyimpan key '" + key + "'.",
          error
        );

        if (
          loadedKey.current === key &&
          saveVersion.current === version
        ) {
          setSaveStatus("error");
          setStatusMessage(
            "Gagal menyimpan perubahan. Periksa koneksi dan coba lagi."
          );
        }
      });
    }, 600);

    return () => {
      clearTimeout(timeout);
    };
  }, [key, state, loadStatus]);

  const safeSetState = useCallback<
    React.Dispatch<React.SetStateAction<T>>
  >(
    (value) => {
      if (loadedKey.current !== key) {
        console.warn(
          "[useCloudState] Perubahan untuk key '" +
            key +
            "' ditolak karena data belum berhasil dimuat."
        );
        return;
      }

      setState(value);
    },
    [key]
  );

  const status: CloudStateStatus = {
    load: loadStatus,
    save: saveStatus,
    message: statusMessage,
  };

  return [state, safeSetState, status] as const;
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
