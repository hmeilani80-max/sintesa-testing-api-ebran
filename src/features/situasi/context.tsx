import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

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

const gs = globalThis as unknown as {
  __spektraSituationCtx?: React.Context<
    SituationContextValue | undefined
  >;
};

const SituationContext =
  gs.__spektraSituationCtx ??
  (gs.__spektraSituationCtx =
    createContext<SituationContextValue | undefined>(undefined));

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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

  const monitoredSlugs = Array.isArray(cloud.monitoredSlugs)
    ? cloud.monitoredSlugs
    : [];

  const createdTopics = Array.isArray(cloud.createdTopics)
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
      setMonitoredSlugs((current) => {
        const currentSlugs = Array.isArray(current) ? current : [];

        return currentSlugs.includes(slug)
          ? currentSlugs
          : [...currentSlugs, slug];
      });
    },
    [setMonitoredSlugs],
  );

  const addTopic = useCallback(
    (topic: NewTopic) => {
      setCreatedTopics((current) => {
        const currentTopics = Array.isArray(current) ? current : [];

        const baseSlug = slugify(topic.name) || "topik";
        const slug = `${baseSlug}-${Date.now()}`;

        const newTopic: SituationEntry = {
          ...topic,
          slug,
          source: "Topik Pantauan",
          status: "Baru",
          volume: "0",
          actors: "0",
          narratives: "0",
          since: new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "Asia/Jakarta",
          }),
          regionScope: "Nasional",
          createdBy: "Dimas Pratama",
        };

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
```
