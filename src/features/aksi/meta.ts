export const aksiHead = (title: string, description: string) => () => ({
  meta: [
    { title: `${title} — SINTESA` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — SINTESA` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
