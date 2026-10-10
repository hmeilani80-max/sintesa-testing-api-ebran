import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type React,
} from "react";
import type { ReactNode } from "react";

import { field, useCloudState } from "@/hooks/use-cloud-state";
import {
  monitoredTopics,
  systemFindings,
  type SituationEntry,
} from "./data";

type NewTopic = Pick<
  SituationEntry,
  "name" | "description" | "keywords" | "platforms"
>;

type SituationContextValue = {
  findings: SituationEntry[];
  topics: SituationEntry[];
  monitorFinding: (slug: string) => void;
  addTopic: (topic: NewTopic) => void;
};

const globalContext = globalThis as typeof globalThis & {
  __spektraSituationCtx?: React.Context<
    SituationContextValue | undefined
  >;
};

const SituationContext =
  globalContext.__spektraSituationCtx ??
  (globalContext.__spektraSituationCtx =
    createContext<SituationContextValue | undefined>(undefined));

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getTodayIndonesia(): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

export function SituationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cloud, setCloud] = useCloudState("situasi", {
    monitoredSlugs: [] as string[],
    createdTopics: [] as SituationEntry[],
  });

  const monitoredSlugs: string[] = Array.isArray(cloud.monitoredSlugs)
    ? cloud.monitoredSlugs
    : [];

  const createdTopics: SituationEntry[] = Array.isArray(cloud.createdTopics)
    ? cloud.createdTopics
    : [];

  const setMonitoredSlugs = field(setCloud, "monitoredSlugs");
  const setCreatedTopics = field(setCloud, "createdTopics");

  const topics = useMemo<SituationEntry[]>(() => {
    const monitoredSystemFindings = systemFindings
      .filter((item) => monitoredSlugs.includes(item.slug))
      .map((item) => ({
        ...item,
        status: "Dipantau",
      }));

    return [
      ...monitoredTopics,
      ...monitoredSystemFindings,
      ...createdTopics,
    ];
  }, [monitoredSlugs, createdTopics]);

  const monitorFinding = useCallback(
    (slug: string) => {
      if (!slug.trim()) return;

      setMonitoredSlugs((current) => {
        const currentSlugs = Array.isArray(current) ? current : [];

        if (currentSlugs.includes(slug)) {
          return currentSlugs;
        }

        return [...currentSlugs, slug];
      });
    },
    [setMonitoredSlugs],
  );

  const addTopic = useCallback(
    (topic: NewTopic) => {
      const name = topic.name.trim();

      if (!name) return;

      const newTopic: SituationEntry = {
        ...topic,
        name,
        slug: `${slugify(name) || "topik"}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 7)}`,
        source: "Topik Pantauan",
        status: "Baru",
        volume: "0",
        actors: "0",
        narratives: "0",
        since: getTodayIndonesia(),
        regionScope: "Nasional",
        createdBy: "Dimas Pratama",
      };

      setCreatedTopics((current) => {
        const currentTopics = Array.isArray(current) ? current : [];
        return [newTopic, ...currentTopics];
      });
    },
    [setCreatedTopics],
  );

  const value = useMemo<SituationContextValue>(
    () => ({
      findings: systemFindings,
      topics,
      monitorFinding,
      addTopic,
    }),
    [topics, monitorFinding, addTopic],
  );

  return (
    <SituationContext.Provider value={value}>
      {children}
    </SituationContext.Provider>
  );
}

export function useSituations(): SituationContextValue {
  const context = useContext(SituationContext);

  if (!context) {
    throw new Error(
      "useSituations must be used within SituationProvider",
    );
  }

  return context;
}
