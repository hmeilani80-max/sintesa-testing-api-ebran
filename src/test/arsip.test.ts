import { describe, expect, it } from "vitest";
import { ITEMS, search } from "@/features/arsip/data";

const ALL = { jenis: "Semua", modul: "Semua", klasifikasi: "Semua", owner: "Semua" };
const titles = (q: string) => search(ITEMS, q, ALL).map((i) => i.title);

describe("Arsip search", () => {
  it("finds the whole Demonstrasi Nasional chain from one query", () => {
    const t = titles("Demonstrasi Nasional");
    for (const x of ["Demonstrasi Nasional", "Respons Informasi Demonstrasi Nasional", "Artikel Informasi Demonstrasi Nasional", "Distribusi Sosial Demonstrasi", "Distribusi Artikel Demonstrasi Nasional", "Laporan Dampak Demonstrasi Nasional"]) expect(t).toContain(x);
  });
  it("searches document content, not only titles", () => {
    expect(titles("sentimen negatif turun 12 poin")[0]).toBe("Laporan Dampak Demonstrasi Nasional");
    expect(titles("klaim kericuhan belum terverifikasi")).toContain("Kajian & Sumber — Respons Demonstrasi");
  });
  it("applies classification filter", () => {
    expect(search(ITEMS, "", { ...ALL, klasifikasi: "Rahasia" }).every((i) => i.klasifikasi === "Rahasia")).toBe(true);
  });
});
