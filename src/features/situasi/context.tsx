import type React from "react";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { monitoredTopics, systemFindings, type SituationEntry } from "./data";

type NewTopic = Pick<SituationEntry, "name" | "description" | "keywords" | "platforms">;

type SituationContextValue = {
  findings: SituationEntry[];
  topics: SituationEntry[];
  monitorFinding: (slug: string) => void;
  addTopic: (topic: NewTopic) => void;
};

const gs = globalThis as unknown as { __spektraSituationCtx?: React.Context<SituationContextValue | undefined> };
const SituationContext = gs.__spektraSituationCtx ?? (gs.__spektraSituationCtx = createContext<SituationContextValue | undefined>(undefined));

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function SituationProvider({ children }: { children: ReactNode }) {
  const [monitoredSlugs, setMonitoredSlugs] = useState<string[]>([]);
  const [createdTopics, setCreatedTopics] = useState<SituationEntry[]>([]);

  const topics = useMemo(() => [
    ...monitoredTopics,
    ...systemFindings.filter((item) => monitoredSlugs.includes(item.slug)).map((item) => ({ ...item, status: "Dipantau" })),
    ...createdTopics,
  ], [createdTopics, monitoredSlugs]);

  const value = useMemo<SituationContextValue>(() => ({
    findings: systemFindings,
    topics,
    monitorFinding: (slug) => setMonitoredSlugs((current) => current.includes(slug) ? current : [...current, slug]),
    addTopic: (topic) => setCreatedTopics((current) => [{
      ...topic,
      slug: `${slugify(topic.name)}-${current.length + 1}`,
      source: "Topik Pantauan",
      status: "Baru",
      volume: "0",
      actors: "0",
      narratives: "0",
      since: "7 Oktober 2026",
      regionScope: "Nasional",
      createdBy: "Dimas Pratama",
    }, ...current]),
  }), [createdTopics, topics]);

  return <SituationContext.Provider value={value}>{children}</SituationContext.Provider>;
}

export function useSituations() {
  const context = useContext(SituationContext);
  if (!context) throw new Error("useSituations must be used within SituationProvider");
  return context;
}