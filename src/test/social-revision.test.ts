import { describe, expect, it } from "vitest";
import { initialProductions } from "@/features/aksi/data";
import { accountById, buildPosts, canSubmitDistribution, captionFor, initialCampaigns, readinessChecks, recommendedPlatforms, recommendedWindowsFor, type SocialAccount } from "@/features/aksi/sosial";

describe("Social distribution revision", () => {
  it("recommends TikTok, Instagram, YouTube and Facebook for video", () => {
    expect(recommendedPlatforms(["Video Pendek"])).toEqual(["TikTok", "Instagram", "YouTube", "Facebook"]);
  });
  it("recommends Instagram, Facebook and X for carousel", () => {
    expect(recommendedPlatforms(["Carousel"])).toEqual(["Instagram", "Facebook", "X"]);
  });
  it("recommends X, Instagram and Facebook for infographic", () => {
    expect(recommendedPlatforms(["Infografis"])).toEqual(["X", "Instagram", "Facebook"]);
  });
  it("allows a compatible Threads override outside recommendations", () => {
    const asset = initialProductions.find((p) => p.id === "PRD-019");
    const c = initialCampaigns[0];
    const account = accountById("Threads:@suara_warga");
    expect(asset && c && account).toBeTruthy();
    if (!asset || !c || !account) return;
    expect(buildPosts([asset], [account], c.purpose, c.timing, true)).toHaveLength(1);
  });
  it("keeps recommended posts within 10–12 and 16–18 windows", () => {
    const c = initialCampaigns[0];
    expect(c).toBeDefined();
    if (!c) return;
    const accounts = c.accounts.map(accountById).filter((a): a is SocialAccount => !!a);
    const windows = recommendedWindowsFor([...new Set(accounts.map((a) => a.platform))]);
    const posts = buildPosts(initialProductions.filter((p) => c.contentIds.includes(p.id)), accounts, c.purpose, { ...c.timing, from: "09:00", windows }, true);
    expect(windows).toEqual([{ from: "09:00", to: "11:00" }, { from: "11:00", to: "13:00" }, { from: "17:00", to: "20:00" }]);
    expect(posts).toHaveLength(18);
    expect(posts.every((p) => windows.some((w) => p.time >= w.from && p.time <= w.to))).toBe(true);
  });
  it("blocks carousel with only TikTok accounts", () => {
    const c = initialCampaigns[0];
    expect(c).toBeDefined();
    if (!c) return;
    expect(canSubmitDistribution(readinessChecks({ ...c, contentIds: ["PRD-017"], accounts: ["TikTok:@ruangpublik"], posts: [] }, initialProductions))).toBe(false);
    expect(readinessChecks({ ...c, contentIds: ["PRD-017"], accounts: ["TikTok:@ruangpublik"], posts: [] }, initialProductions).at(-1)?.ok).toBe(false);
  });
  it("uses account context and type-specific action rather than opener-only variants", () => {
    const asset = initialProductions.find((p) => p.id === "PRD-020");
    expect(asset).toBeDefined();
    if (!asset) return;
    const info = captionFor("X", asset, ["Klarifikasi"], 0, accountById("X:@info_aksi"));
    const analysis = captionFor("X", asset, ["Klarifikasi"], 0, accountById("X:@analisis_media"));
    expect(info).not.toBe(analysis);
    expect(captionFor("Instagram", asset, ["Klarifikasi"], 0)).not.toContain("Geser");
    expect(captionFor("X", asset, ["Klarifikasi"], 0)).not.toBe(captionFor("X", asset, ["Edukasi Publik"], 0));
  });
});