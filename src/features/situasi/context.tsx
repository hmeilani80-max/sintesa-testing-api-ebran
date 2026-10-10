import {
createContext,
useCallback,
useContext,
useMemo,
type React,
} from "react";
import type { ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { field, useCloudState } from "@/hooks/use-cloud-state";
import {
monitoredTopics,
systemFindings,
type SituationEntry,
} from "./data";

type NewTopic = Pick<
SituationEntry,
"name" | "description" | "keywords" | "platforms"

;

type SituationContextValue = {
findings: SituationEntry[];
topics: SituationEntry[];
monitorFinding: (slug: string) => void;
addTopic: (topic: NewTopic) => void;
};

const globalContext = globalThis as typeof globalThis & {
__spektraSituationCtx?: React.Context<
SituationContextValue | undefined

;
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

/**

Sinkronkan topik ke tabel relasional Supabase.

app_state tetap digunakan sebagai penyimpanan utama selama transisi.
*/
async function syncTopicToDatabase(
topic: SituationEntry,
): Promise<void> {
const { error } = await supabase
.from("situasi_topics")
.upsert(
{
slug: topic.slug,
name: topic.name,
source: topic.source,
risk: topic.risk ?? null,
status: topic.status,
volume: Number(topic.volume) || 0,
actor_count: Number(topic.actors) || 0,
narrative_count: Number(topic.narratives) || 0,
description: topic.description,
platforms: topic.platforms ?? [],
region_scope: topic.regionScope,
keywords: topic.keywords ?? [],
metadata: topic,
created_by: topic.createdBy ?? null,
updated_at: new Date().toISOString(),
},
{ onConflict: "slug" },
);

if (error) {
console.error(
"[Situasi] Gagal menyinkronkan topik:",
error.message,
{ slug: topic.slug },
);
return;
}

console.info(
"[Situasi] Topik berhasil disinkronkan:",
topic.slug,
);
}

/**

Sinkronkan status pantauan temuan sistem ke Supabase.
*/
async function syncMonitoringToDatabase(
slug: string,
): Promise<void> {
const { error } = await supabase
.from("situasi_topic_monitoring")
.upsert(
{
finding_slug: slug,
monitored_at: new Date().toISOString(),
},
{ onConflict: "finding_slug" },
);

if (error) {
console.error(
"[Situasi] Gagal menyinkronkan pantauan:",
error.message,
{ slug },
);
return;
}

console.info(
"[Situasi] Pantauan berhasil disinkronkan:",
slug,
);
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

const monitoredSlugs: string[] = Array.isArray(
cloud.monitoredSlugs,
)
? cloud.monitoredSlugs
: [];

const createdTopics: SituationEntry[] = Array.isArray(
cloud.createdTopics,
)
? cloud.createdTopics
: [];

const setMonitoredSlugs = field(
setCloud,
"monitoredSlugs",
);

const setCreatedTopics = field(
setCloud,
"createdTopics",
);

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
const finding = systemFindings.find(
(item) => item.slug === slug,
);

  if (!finding) {
    console.warn(
      "[Situasi] Temuan tidak ditemukan; pantauan dibatalkan:",
      slug,
    );
    return;
  }

  setMonitoredSlugs((current) => {
    const currentSlugs = Array.isArray(current)
      ? current
      : [];

    if (currentSlugs.includes(slug)) {
      return currentSlugs;
    }

    return [...currentSlugs, slug];
  });

  // Coba sinkronkan juga jika slug sudah ada di app_state.
  void syncMonitoringToDatabase(slug);
},
[setMonitoredSlugs],

);

const addTopic = useCallback(
(topic: NewTopic) => {
const name = topic.name.trim();

  if (!name) {
    console.warn(
      "[Situasi] Nama topik wajib diisi.",
    );
    return;
  }

  const newTopic: SituationEntry = {
    ...topic,
    name,
    description: topic.description.trim(),
    keywords: topic.keywords ?? [],
    platforms: topic.platforms ?? [],
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

  // Pertahankan penyimpanan app_state yang sudah berjalan.
  setCreatedTopics((current) => {
    const currentTopics = Array.isArray(current)
      ? current
      : [];

    return [newTopic, ...currentTopics];
  });

  // Sinkronkan ke tabel relasional Supabase.
  void syncTopicToDatabase(newTopic);
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
