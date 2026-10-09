import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/aksi/distribusi-news")({ component: () => <Outlet /> });
