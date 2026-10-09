import { describe, expect, it } from "vitest";
import { completionRate, costPer, direction, narratives, pctChange } from "@/features/dampak/data";

describe("dampak metrics", () => {
  it("volume mention change is -22%", () => expect(pctChange(24300, 18900)).toBe(-22));
  it("cost per published post", () => expect(costPer(18000000, 23)).toBe(782609));
  it("cost per published article", () => expect(costPer(32000000, 14)).toBe(2285714));
  it("news completion rate 87.5%", () => expect(completionRate(14, 16)).toBe(87.5));
  it("narrative mention counts agree with baseline and current shares", () => {
    for (const narrative of narratives) {
      expect(narrative.mentionsBefore).toBe(24300 * narrative.before / 100);
      expect(narrative.mentionsNow).toBe(18900 * narrative.now / 100);
    }
    const expansion = narratives.find((n) => n.name === "Aksi meluas ke banyak kota");
    expect(expansion).toBeDefined();
    if (!expansion) throw new Error("Missing expansion narrative");
    expect(expansion.mentionsNow - expansion.mentionsBefore).toBe(-5076);
  });
  it("region status", () => {
    expect(direction(2800, 3400)).toBe("Meningkat");
    expect(direction(4200, 2900)).toBe("Menurun");
    expect(direction(225, 218)).toBe("Stabil");
  });
});
