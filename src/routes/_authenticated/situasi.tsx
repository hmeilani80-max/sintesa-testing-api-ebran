import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/situasi")({ component: SituasiLayout });

function SituasiLayout() {
  return <Outlet />;
}
