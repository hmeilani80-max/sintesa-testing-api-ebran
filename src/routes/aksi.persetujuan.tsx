import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/aksi/persetujuan")({ component: () => <Outlet /> });
