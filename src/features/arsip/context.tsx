import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { ITEMS, type ArsipItem } from "./data";

type Value = { items: ArsipItem[]; addItem: (item: ArsipItem) => void };

// Keep one context instance across hot reloads so provider and consumers always match.
const g = globalThis as unknown as { __sintesaArsipCtx?: React.Context<Value | undefined> };
const Ctx = g.__sintesaArsipCtx ?? (g.__sintesaArsipCtx = createContext<Value | undefined>(undefined));

export function ArsipProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ArsipItem[]>(ITEMS);
  const value = useMemo<Value>(() => ({
    items,
    addItem: (item) => setItems((cur) => [item, ...cur]),
  }), [items]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useArsip() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useArsip must be used within ArsipProvider");
  return c;
}
