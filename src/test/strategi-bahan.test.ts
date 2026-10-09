import { describe, expect, it } from "vitest";

import { buildBahanTanggapan } from "@/features/strategi/bahan";

const input = {
  title: "Demonstrasi Nasional",
  narrative: "Aksi meluas ke sejumlah kota",
  growth: "+63%",
  regions: "Jakarta, Bandung",
  verifiedFacts: ["Aktivitas percakapan meningkat 63%."],
  unverifiedFacts: ["Klaim mengenai kericuhan pada lokasi tertentu."],
  sources: [
    { statement: "Volume naik 63%", source: "Data SINTESA", status: "Terverifikasi" },
    { statement: "Aksi direncanakan di Bandung", source: "News A", status: "Terverifikasi" },
    { statement: "Klaim kericuhan lokasi X", source: "@akun_dummy", status: "Belum Terverifikasi" },
  ],
};

describe("buildBahanTanggapan — Respons Informasi Demonstrasi Nasional", () => {
  it("menghasilkan tiga pesan: Utama, Klarifikasi, Pendukung", () => {
    const bahan = buildBahanTanggapan(input);
    expect(bahan.pesan).toHaveLength(3);
    expect(bahan.pesan.map((p) => p.kind)).toEqual(["Utama", "Klarifikasi", "Pendukung"]);
    bahan.pesan.forEach((p) => expect(p.text.length).toBeGreaterThan(0));
  });

  it("menghasilkan 3–5 talking points", () => {
    const bahan = buildBahanTanggapan(input);
    expect(bahan.talkingPoints.length).toBeGreaterThanOrEqual(3);
    expect(bahan.talkingPoints.length).toBeLessThanOrEqual(5);
  });

  it("juru bicara default Belum Ditetapkan (AI tidak menetapkan keputusan final)", () => {
    const bahan = buildBahanTanggapan(input);
    expect(bahan.juruBicara.nama).toBe("Belum Ditetapkan");
    expect(bahan.juruBicara.statusPenetapan).toBe("Belum Ditetapkan");
  });

  it("menyertakan fakta pendukung dengan sumber dan FAQ dengan draft jawaban", () => {
    const bahan = buildBahanTanggapan(input);
    expect(bahan.fakta.length).toBeGreaterThan(0);
    bahan.fakta.forEach((f) => expect(f.sumber.length).toBeGreaterThan(0));
    expect(bahan.faq.length).toBeGreaterThan(0);
    bahan.faq.forEach((f) => expect(f.answer.length).toBeGreaterThan(0));
  });

  it("deterministik: menghasilkan output yang sama untuk input yang sama (Generate Ulang konsisten)", () => {
    expect(buildBahanTanggapan(input)).toEqual(buildBahanTanggapan(input));
  });
});
