import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it.each(["/", "/situasi", "/situasi/demonstrasi-nasional", "/situasi/demonstrasi-nasional/eksplorasi", "/situasi/demonstrasi-nasional/risiko-prediksi", "/strategi", "/strategi/respons-informasi-demonstrasi-nasional", "/aksi/kalender-tugas", "/aksi/produksi", "/aksi/produksi/PRD-021", "/aksi/persetujuan", "/aksi/persetujuan/konten/PRD-021", "/aksi/persetujuan/sosial/CMP-014", "/aksi/distribusi-sosial", "/aksi/distribusi-sosial/CMP-014", "/aksi/distribusi-sosial/baru", "/aksi/distribusi-news", "/aksi/distribusi-news/DN-012", "/dampak", "/arsip", "/administrasi"])(
    "matches a SINTESA page for %s instead of falling back to not found",
    (path) => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

      const matches = router.matchRoutes(path);

      expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    },
  );
});

describe("Situation risk profiles", () => {
  it("keeps Demonstrasi Nasional risk metrics scoped to that situation", async () => {
    const { getRiskProfile, systemFindings } = await import("@/features/situasi/data");
    const situation = systemFindings.find((item) => item.slug === "demonstrasi-nasional");
    expect(situation).toBeDefined();
    if (!situation) return;
    const profile = getRiskProfile(situation);
    expect(profile.activeRegions).toBe("6");
    expect(profile.warningCount).toBe("7");
    expect(profile.riskDetails[0]?.indicator).toBe("Aksi meluas ke sejumlah kota");
    expect(profile.riskDetails.some((item) => item.indicator === "Dugaan Serangan Siber")).toBe(false);
  });
});

describe("Strategy recommendations", () => {
  it("derives an Integrated plan for Demonstrasi Nasional (X, TikTok, News)", async () => {
    const { getChannelApproach, getActionPlan } = await import("@/features/strategi/data");
    const platforms = ["X", "TikTok", "News"];
    expect(getChannelApproach(platforms)).toBe("Integrated");
    const tasks = getActionPlan(platforms);
    expect(tasks.map((t) => t.title)).toEqual(["Artikel Utama", "Rapid Update", "Video Penjelasan", "Visual Summary"]);
    expect(tasks[1]?.count).toBe("3 post");
  });
  it("uses News-led and Social-led when only one channel family dominates", async () => {
    const { getChannelApproach } = await import("@/features/strategi/data");
    expect(getChannelApproach(["News"])).toBe("News-led");
    expect(getChannelApproach(["TikTok", "Instagram"])).toBe("Social-led");
  });
});

describe("Aksi approval gates", () => {
  it("creates one separate Produksi item per selected output", async () => {
    const { buildItems, DEMO_BRIEF } = await import("@/features/aksi/data");
    const items = buildItems(DEMO_BRIEF, ["News Article", "Carousel", "Video Pendek"], { source: "Strategi" }, 30);
    expect(items).toHaveLength(3);
    expect(new Set(items.map((i) => i.id)).size).toBe(3);
    expect(items.map((i) => i.dest[0])).toEqual(["News", "Sosial", "Sosial"]);
    expect(items.every((i) => i.approval === null && i.status === "Draft")).toBe(true);
  });
  it("only allows submitting generated content that is not already under review", async () => {
    const { canSubmit } = await import("@/features/aksi/data");
    expect(canSubmit({ status: "Draft", approval: null })).toBe(false);
    expect(canSubmit({ status: "Generated", approval: null })).toBe(true);
    expect(canSubmit({ status: "Generated", approval: "Menunggu" })).toBe(false);
    expect(canSubmit({ status: "Generated", approval: "Perlu Revisi" })).toBe(true);
  });
  it("only lets approved, eligible content into each distribution", async () => {
    const { isEligible } = await import("@/features/aksi/data");
    expect(isEligible({ approval: "Disetujui", dest: ["News"] }, "News")).toBe(true);
    expect(isEligible({ approval: "Disetujui", dest: ["News"] }, "Sosial")).toBe(false);
    expect(isEligible({ approval: "Menunggu", dest: ["Sosial"] }, "Sosial")).toBe(false);
  });
  it("requires distribution approval before execution", async () => {
    const { distributionReadiness } = await import("@/features/aksi/data");
    expect(distributionReadiness("Disetujui", "Menunggu")).toBe("Menunggu Approval Distribusi");
    expect(distributionReadiness("Disetujui", "Disetujui")).toBe("Siap Eksekusi");
    expect(distributionReadiness(null, "Disetujui")).toBe("Belum dapat didistribusikan");
  });
  it("has 38 regional channels plus 1 national channel", async () => {
    const { NEWS_CHANNELS, REGIONAL_CHANNELS, newsChannelDomain } = await import("@/features/aksi/data");
    expect(REGIONAL_CHANNELS).toHaveLength(38);
    expect(NEWS_CHANNELS).toHaveLength(39);
    expect(newsChannelDomain("Nasional")).toBe("nusakanalnasional.com");
    expect(newsChannelDomain("DKI Jakarta")).toBe("nusakanaljakarta.com");
    expect(newsChannelDomain("Jawa Barat")).toBe("nusakanaljawabarat.com");
    expect(new Set(NEWS_CHANNELS.map(newsChannelDomain))).toHaveLength(39);
  });
  it("records every decision per version and keeps old records when a new version voids approval", async () => {
    const { applySubmit, applyDecision, invalidateApproval, initialProductions } = await import("@/features/aksi/data");
    const base = { ...initialProductions[1]!, approvals: [] as import("@/features/aksi/data").ApprovalRecord[], approval: null };
    let p = applySubmit(base, "Tim Produksi", "09:00", 1);
    p = applyDecision(p, "Perlu Revisi", "09:10", 1, "Perjelas sumber");
    p = applySubmit(p, "Tim Produksi", "09:30", 2);
    p = applyDecision(p, "Disetujui", "09:40", 2);
    expect(p.approvals.map((r) => `${r.version}:${r.decision}`)).toEqual(["1:Diajukan", "1:Perlu Revisi", "2:Diajukan Kembali", "2:Disetujui"]);
    const v3 = invalidateApproval(p, "10:00", 2, 3);
    expect(v3.approval).toBeNull();
    expect(v3.approvals).toHaveLength(5);
    expect(v3.approvals[3]?.decision).toBe("Disetujui");
  });
});

describe("Distribusi Sosial rules", () => {
  it("recommends 18 curated posts for 3 assets and 12 accounts", async () => {
    const { initialCampaigns } = await import("@/features/aksi/sosial");
    const c = initialCampaigns.find((x) => x.id === "CMP-015");
    expect(c?.accounts.length).toBe(12);
    expect(c?.posts.length).toBe(18);
  });
  it("only lets Ready accounts be selected", async () => {
    const { selectable } = await import("@/features/aksi/sosial");
    expect(selectable({ status: "Ready" })).toBe(true);
    expect(selectable({ status: "Busy" })).toBe(false);
    expect(selectable({ status: "Unavailable" })).toBe(false);
  });
  it("blocks submission when an account is unavailable or a caption is missing", async () => {
    const { readinessChecks, canSubmitDistribution, initialCampaigns } = await import("@/features/aksi/sosial");
    const { initialProductions } = await import("@/features/aksi/data");
    const c = initialCampaigns[0]!;
    expect(canSubmitDistribution(readinessChecks(c, initialProductions))).toBe(true);
    expect(canSubmitDistribution(readinessChecks({ ...c, accounts: [...c.accounts, "Instagram:@info_aksi"] }, initialProductions))).toBe(false);
    expect(canSubmitDistribution(readinessChecks({ ...c, posts: c.posts.map((p, i) => (i === 0 ? { ...p, caption: "" } : p)) }, initialProductions))).toBe(false);
  });
  it("cannot execute before Distribution Approval and maps decisions to statuses", async () => {
    const { canExecute, statusAfterDecision } = await import("@/features/aksi/sosial");
    expect(canExecute({ approval: "Menunggu", status: "Menunggu Persetujuan" })).toBe(false);
    expect(canExecute({ approval: "Disetujui", status: "Dijadwalkan" })).toBe(true);
    expect(statusAfterDecision("Disetujui", "Segera")).toBe("Sedang Berjalan");
    expect(statusAfterDecision("Disetujui", "Jadwal")).toBe("Dijadwalkan");
    expect(statusAfterDecision("Perlu Revisi", "Jadwal")).toBe("Perlu Perubahan");
    expect(statusAfterDecision("Ditolak", "Jadwal")).toBe("Ditolak");
  });
});
