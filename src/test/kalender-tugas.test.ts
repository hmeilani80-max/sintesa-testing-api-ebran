import { describe, expect, it } from "vitest";
import { initialOrders, initialProductions } from "@/features/aksi/data";
import { initialCampaigns } from "@/features/aksi/sosial";
import { deriveTasks, effectiveStatus, productionStatus, reviewStatus, workOrderStatus } from "@/features/aksi/tugas";

const src = { productions: initialProductions, campaigns: initialCampaigns, orders: initialOrders };
describe("Kalender & Tugas", () => {
  it("maps production lifecycle", () => {
    expect(productionStatus({ status: "Draft", approval: null })).toBe("Belum Dimulai");
    expect(productionStatus({ status: "Generated", approval: "Menunggu" })).toBe("Menunggu");
    expect(productionStatus({ status: "Generated", approval: "Perlu Revisi" })).toBe("Perlu Tindakan");
    expect(productionStatus({ status: "Generated", approval: "Disetujui" })).toBe("Selesai");
  });
  it("review task completes once approved", () => expect(reviewStatus("Disetujui")).toBe("Selesai"));
  it("maps news work orders", () => {
    expect(workOrderStatus("Dikirim")).toBe("Belum Dimulai");
    expect(workOrderStatus("Dalam Pengerjaan")).toBe("Dalam Proses");
    expect(workOrderStatus("Selesai")).toBe("Selesai");
  });
  it("overdue unfinished work is Terlambat", () => {
    expect(effectiveStatus({ base: "Dalam Proses", due: "2026-10-08T16:00" }, "2026-10-09T09:47")).toBe("Terlambat");
    expect(effectiveStatus({ base: "Selesai", due: "2026-10-08T16:00" }, "2026-10-09T09:47")).toBe("Selesai");
  });
  it("one task per campaign, not per post", () => expect(deriveTasks(src).filter((t) => t.id === "cmp:CMP-014")).toHaveLength(1));
  it("approving content closes its review task", () => {
    const approved = initialProductions.map((p) => (p.id === "PRD-022" ? { ...p, approval: "Disetujui" as const } : p));
    const t = deriveTasks({ ...src, productions: approved });
    expect(t.find((x) => x.id === "rev:konten:PRD-022")?.base).toBe("Selesai");
    expect(t.find((x) => x.id === "prod:PRD-022")?.base).toBe("Selesai");
  });
  it("approval revision notes appear on the task", () =>
    expect(deriveTasks(src).find((t) => t.id === "prod:PRD-023")?.notes.some((n) => n.origin === "Persetujuan")).toBe(true));
});
