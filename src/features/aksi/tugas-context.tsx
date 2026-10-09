import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { useAksi } from "./context";
import { deriveTasks, SCENARIO_TASKS, type Activity, type BaseStatus, type Note, type Task } from "./tugas";

type Value = {
  tasks: Task[];
  addTask: (t: { title: string; pic: string; due: string; situation?: string | undefined; note?: string | undefined }) => string;
  setPic: (id: string, pic: string) => void;
  addNote: (id: string, text: string, author?: string) => void;
  setManualStatus: (id: string, status: BaseStatus) => void;
};
const g = globalThis as unknown as { __sintesaTugasCtx?: React.Context<Value | undefined> };
const Ctx = g.__sintesaTugasCtx ?? (g.__sintesaTugasCtx = createContext<Value | undefined>(undefined));
const now = () => new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

/** Overlays user edits (PIC, notes, manual tasks) on tasks derived live from the Aksi workflow. */
export function TugasProvider({ children }: { children: ReactNode }) {
  const { productions, campaigns, orders } = useAksi();
  const [manual, setManual] = useState<Task[]>([]);
  const [pics, setPics] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, Note[]>>({});
  const [acts, setActs] = useState<Record<string, Activity[]>>({});
  const [statuses, setStatuses] = useState<Record<string, BaseStatus>>({});
  const log = (id: string, text: string) => setActs((c) => ({ ...c, [id]: [...(c[id] ?? []), { at: now(), text }] }));

  const tasks = useMemo(() => [...deriveTasks({ productions, campaigns, orders }), ...SCENARIO_TASKS, ...manual].map((t) => ({
    ...t,
    pic: pics[t.id] ?? t.pic,
    base: t.source === "Manual" ? statuses[t.id] ?? t.base : t.base,
    notes: [...t.notes, ...(notes[t.id] ?? [])],
    activity: [...t.activity, ...(acts[t.id] ?? [])],
  })), [productions, campaigns, orders, manual, pics, notes, acts, statuses]);

  const value: Value = {
    tasks,
    addTask: ({ title, pic, due, situation, note }) => {
      const id = `man:new-${Date.now()}`;
      setManual((c) => [...c, { id, title, source: "Manual", kind: "Tugas Manual", situation: situation || "Tanpa situasi", pic, support: [], due, priority: "Normal", base: "Belum Dimulai",
        description: note || "Tugas manual di luar workflow sistem.", notes: note ? [{ at: now(), author: "Dimas Pratama", text: note }] : [], activity: [{ at: now(), text: "Tugas manual dibuat oleh Dimas Pratama" }] }]);
      return id;
    },
    setPic: (id, pic) => { const prev = tasks.find((t) => t.id === id)?.pic; setPics((c) => ({ ...c, [id]: pic })); log(id, `PIC diubah dari ${prev} ke ${pic}`); },
    addNote: (id, text, author = "Dimas Pratama") => setNotes((c) => ({ ...c, [id]: [...(c[id] ?? []), { at: now(), author, text }] })),
    setManualStatus: (id, status) => { setStatuses((c) => ({ ...c, [id]: status })); log(id, `Status diubah ke ${status}`); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTugas() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTugas must be used within TugasProvider");
  return v;
}
