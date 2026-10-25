import { describe, expect, it } from "vitest";
import { buildLumaInfographicPrompt, getProductionPrompt, PROMPT_CATALOG_VERSION, type OutputType } from "./prompt-templates";

const brief = {
  theme: "Ketenagakerjaan",
  message: "Jelaskan informasi sesuai fakta yang tersedia.",
  points: ["63.789 korban PHK hingga September 2026"],
  style: ["Faktual", "Informatif"],
  audience: "Masyarakat umum",
  region: "Indonesia",
};

const outputTypes: OutputType[] = ["News Article", "Infografis", "Carousel", "Video Pendek", "Audio / Podcast"];

describe("Sintesa GitHub Prompt Manager", () => {
  it("exposes a versioned prompt catalog", () => {
    expect(PROMPT_CATALOG_VERSION).toMatch(/^\\d+\\.\\d+\\.\\d+$/);
  });

  it.each(outputTypes)("returns a non-empty Indonesian prompt for %s", (type) => {
    const prompt = getProductionPrompt(type, brief);
    expect(prompt.length).toBeGreaterThan(100);
    expect(prompt).toContain(brief.theme);
    expect(prompt).toContain(brief.message);
    expect(prompt).toContain("Jangan mengarang angka");
  });

  it("keeps the Luma image prompt constrained to editor-provided facts", () => {
    const prompt = buildLumaInfographicPrompt({ ...brief, title: "Infografis PHK" });
    expect(prompt).toContain("Infografis PHK");
    expect(prompt).toContain("63.789 korban PHK");
    expect(prompt).toContain("Do not invent statistics");
    expect(prompt.length).toBeLessThanOrEqual(5000);
  });

  it("does not invent facts when the visual brief has no facts", () => {
    const prompt = buildLumaInfographicPrompt({ ...brief, title: "Visual konseptual", points: [] });
    expect(prompt).toContain("Jangan menambahkan angka atau fakta spesifik");
  });
});
