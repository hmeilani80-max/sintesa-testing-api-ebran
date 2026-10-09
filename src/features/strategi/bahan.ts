// Revisi 8 — Paket Bahan Tanggapan (Requirement S51)
// Pure, deterministic builder: tidak ada randomness, tidak ada keputusan final AI (mis. juru bicara).

export type PesanTanggapan = { kind: "Utama" | "Klarifikasi" | "Pendukung"; text: string };
export type FaktaPendukung = { pesan: "Utama" | "Klarifikasi" | "Pendukung"; fakta: string; sumber: string };
export type FaqItem = { question: string; answer: string };
export type JuruBicara = { nama: string; jabatan: string; unit: string; statusPenetapan: string; materi: string[] };

export type BahanTanggapan = {
  pesan: PesanTanggapan[];
  talkingPoints: string[];
  fakta: FaktaPendukung[];
  faq: FaqItem[];
  juruBicara: JuruBicara;
};

export type BahanInput = {
  title: string;
  narrative: string;
  growth: string;
  regions: string;
  verifiedFacts: string[];
  unverifiedFacts: string[];
  sources: Array<{ statement: string; source: string; status: string }>;
};

/** Belum ada juru bicara yang ditetapkan secara default — AI tidak menetapkan keputusan ini. */
export const BELUM_DITETAPKAN_SPOKESPERSON: JuruBicara = {
  nama: "Belum Ditetapkan",
  jabatan: "Belum Ditetapkan",
  unit: "Belum Ditetapkan",
  statusPenetapan: "Belum Ditetapkan",
  materi: [],
};

/**
 * Menyusun Paket Bahan Tanggapan secara otomatis dari Kajian, Pesan Utama, dan data Situasi.
 * Fungsi ini murni (deterministik) agar dapat diuji dan "Generate Ulang" menghasilkan bahan yang konsisten
 * dengan data sumber yang sama.
 */
export function buildBahanTanggapan(input: BahanInput): BahanTanggapan {
  const verified = input.verifiedFacts[0] ?? "data pemantauan terverifikasi";
  const pesan: PesanTanggapan[] = [
    { kind: "Utama", text: `Pemerintah memantau perkembangan ${input.title} secara berkelanjutan dan memastikan informasi yang disampaikan kepada publik berbasis data terverifikasi.` },
    { kind: "Klarifikasi", text: `Sejumlah informasi terkait ${input.narrative.toLowerCase()} belum dapat dikonfirmasi kebenarannya. Masyarakat diimbau merujuk pada sumber resmi sebelum menyebarluaskan informasi.` },
    { kind: "Pendukung", text: `Koordinasi lintas instansi terus dilakukan untuk menjaga ketersediaan layanan dan keamanan publik di wilayah terdampak (${input.regions}).` },
  ];

  const talkingPoints = [
    `Volume percakapan terkait ${input.title} tercatat ${input.growth} berdasarkan pemantauan SINTESA.`,
    `Narasi dominan saat ini: "${input.narrative}".`,
    `${verified}.`,
    `Informasi yang belum terverifikasi agar tidak disebarluaskan sebelum ada klarifikasi resmi.`,
    `Saluran resmi akan terus memperbarui informasi seiring perkembangan situasi.`,
  ].slice(0, 5);

  const fakta: FaktaPendukung[] = input.sources.slice(0, 3).map((s, i) => ({
    pesan: (i === 0 ? "Utama" : i === 1 ? "Klarifikasi" : "Pendukung") as FaktaPendukung["pesan"],
    fakta: s.statement,
    sumber: `${s.source} (${s.status})`,
  }));

  const faq: FaqItem[] = [
    { question: `Apakah ${input.title} akan meluas ke wilayah lain?`, answer: `Belum ada data terverifikasi yang mengonfirmasi perluasan di luar ${input.regions}. Informasi akan diperbarui sesuai perkembangan.` },
    { question: "Apakah informasi yang beredar di media sosial dapat dipastikan kebenarannya?", answer: "Sebagian informasi masih berstatus belum terverifikasi. Masyarakat diimbau merujuk kanal resmi untuk klarifikasi." },
    { question: "Apa langkah yang sedang dilakukan pemerintah?", answer: "Koordinasi lintas instansi dan pemantauan situasi dilakukan secara berkelanjutan untuk memastikan layanan publik tetap berjalan." },
  ];

  return { pesan, talkingPoints, fakta, faq, juruBicara: { ...BELUM_DITETAPKAN_SPOKESPERSON } };
}
