import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/aksi/distribusi-news")({ component: () => <Outlet /> });
