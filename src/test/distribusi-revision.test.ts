import { describe, expect, it } from "vitest";
import { deadlineFor, recommendedScheduleFor, zoneFor } from "@/features/aksi/data";
import { PLATFORM_WINDOWS, recommendedWindowsFor, rencanaPublikasi, initialCampaigns } from "@/features/aksi/sosial";
import { initialOrders } from "@/features/aksi/data";

describe("Distribution revision — platform windows & zone recommendations", () => {
  it("has a fixed recommended window for every social platform", () => {
    expect(PLATFORM_WINDOWS.map((w) => w.platform)).toEqual(["X", "Instagram", "TikTok", "Facebook", "YouTube", "Threads"]);
  });
  it("derives recommended windows for the chosen platforms only, falling back when unknown", () => {
    expect(recommendedWindowsFor(["X", "TikTok"])).toEqual([{ from: "09:00", to: "11:00" }, { from: "17:00", to: "20:00" }]);
    expect(recommendedWindowsFor(["Unknown"])).toEqual([{ from: "09:00", to: "11:00" }]);
  });
  it("recommends Nasional, Jawa Barat, Bali and Papua per the S56 example", () => {
    expect(recommendedScheduleFor("Nasional")).toBe("09 Okt, 10:00 WIB");
    expect(recommendedScheduleFor("Jawa Barat")).toBe("09 Okt, 10:00 WIB");
    expect(recommendedScheduleFor("Bali")).toBe("09 Okt, 13:00 WITA");
    expect(recommendedScheduleFor("Papua")).toBe("09 Okt, 14:00 WIT");
  });
  it("assigns zones by region", () => {
    expect(zoneFor("Jawa Barat")).toBe("WIB");
    expect(zoneFor("Bali")).toBe("WITA");
    expect(zoneFor("Papua")).toBe("WIT");
  });
  it("derives a deadline after the recommended tayang slot", () => {
    expect(deadlineFor("Bali")).toBe("09 Okt, 16:00 WITA");
  });
});

describe("Distribution revision — Rencana Publikasi (S69)", () => {
  it("derives publication rows from existing campaigns and orders", () => {
    const rows = rencanaPublikasi("PRD-020", initialCampaigns, initialOrders);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.distribusi && r.target && r.jadwal && r.status)).toBe(true);
  });
  it("returns an empty list when the content was never used in a distribution", () => {
    const rows = rencanaPublikasi("PRD-999-NONE", initialCampaigns, initialOrders);
    expect(rows).toEqual([]);
  });
});
