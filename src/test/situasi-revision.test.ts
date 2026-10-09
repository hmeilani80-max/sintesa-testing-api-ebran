import { describe, expect, it } from "vitest";

import {
  accountProfiles,
  commentStats,
  ewsEntries,
  getEws,
  manipulationPatterns,
} from "@/features/situasi/data";

describe("Situasi — Revisi gabungan", () => {
  it("menghitung pola manipulasi informasi sesuai jumlah yang ditetapkan", () => {
    const counts: Record<string, number> = Object.fromEntries(manipulationPatterns.map((pattern) => [pattern.id, pattern.count]));
    expect(counts["framing"]).toBe(186);
    expect(counts["fear"]).toBe(94);
    expect(counts["repetition"]).toBe(312);
    expect(counts["decontext"]).toBe(57);
  });

  it("menunjukkan perubahan perilaku akun @forum_mahasiswa", () => {
    const profile = accountProfiles["@forum_mahasiswa"];
    expect(profile).toBeDefined();
    expect(profile!.behaviorChange.postsBefore).toBe(42);
    expect(profile!.behaviorChange.postsNow).toBe(76);
    expect(profile!.behaviorChange.interactionsBefore).toBe(1850);
    expect(profile!.behaviorChange.interactionsNow).toBe(3240);
    expect(profile!.behaviorChange.mentionsBefore).toBe(420);
    expect(profile!.behaviorChange.mentionsNow).toBe(260);
  });

  it("menghitung total komentar dan sentimen yang berjumlah 100%", () => {
    expect(commentStats.total).toBe(8420);
    expect(commentStats.positive).toBe(18);
    expect(commentStats.neutral).toBe(29);
    expect(commentStats.negative).toBe(53);
    expect(commentStats.positive + commentStats.neutral + commentStats.negative).toBe(100);
  });

  it("menetapkan level EWS Tinggi untuk Demonstrasi Nasional", () => {
    const ews = getEws("demonstrasi-nasional");
    expect(ews?.level).toBe("Tinggi");
    expect(ewsEntries.some((item) => item.slug === "demonstrasi-nasional" && item.level === "Tinggi")).toBe(true);
  });
});
