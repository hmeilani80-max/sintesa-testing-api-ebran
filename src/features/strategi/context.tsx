import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { getActionPlan, getChannelApproach, initialStrategies, slugify, type Strategy, type StrategyTask } from "./data";

type Handoff = { strategySlug: string; title: string; situationName?: string | undefined; tasks: StrategyTask[] };

type Value = {
  strategies: Strategy[];
  addStrategy: (s: Omit<Strategy, "slug" | "status" | "updated">) => string;
  updateStrategy: (slug: string, patch: Partial<Strategy>) => void;
  sendToAction: (slug: string) => void;
  handoffs: Handoff[];
};

// Keep one context instance across hot reloads so the root provider and pages always match.
const g = globalThis as unknown as { __spektraStrategyCtx?: React.Context<Value | undefined> };
const Ctx = g.__spektraStrategyCtx ?? (g.__spektraStrategyCtx = createContext<Value | undefined>(undefined));

export function StrategyProvider({ children }: { children: ReactNode }) {
  const [strategies, setStrategies] = useState(initialStrategies);
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);

  const value = useMemo<Value>(() => ({
    strategies,
    handoffs,
    addStrategy: (s) => {
      const slug = `${slugify(s.title)}-${strategies.length + 1}`;
      setStrategies((cur) => [{ ...s, slug, status: "Dalam Penyusunan", updated: "Baru saja" }, ...cur]);
      return slug;
    },
    updateStrategy: (slug, patch) => setStrategies((cur) => cur.map((s) => (s.slug === slug ? { ...s, ...patch, updated: "Baru saja" } : s))),
    sendToAction: (slug) => {
      const s = strategies.find((item) => item.slug === slug);
      if (!s) return;
      setStrategies((cur) => cur.map((item) => (item.slug === slug ? { ...item, status: "Diteruskan ke Aksi", updated: "Baru saja" } : item)));
      const platforms = s.situationSlug === "demonstrasi-nasional" ? ["X", "TikTok", "News"] : s.platforms;
      const tasks = getActionPlan(s.approach ? approachPlatforms(s.approach, platforms) : platforms);
      setHandoffs((cur) => [{ strategySlug: slug, title: s.title, situationName: s.situationName, tasks }, ...cur.filter((h) => h.strategySlug !== slug)]);
    },
  }), [strategies, handoffs]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** When the user overrides the recommended approach, shape the platform mix to match it. */
export function approachPlatforms(approach: string, platforms: string[]) {
  if (approach === getChannelApproach(platforms)) return platforms;
  if (approach === "News-led") return ["News"];
  if (approach === "Social-led") return platforms.filter((p) => p !== "News").length ? platforms.filter((p) => p !== "News") : ["X", "TikTok"];
  return Array.from(new Set(["News", ...platforms, "X"]));
}

export function useStrategies() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStrategies must be used within StrategyProvider");
  return c;
}
