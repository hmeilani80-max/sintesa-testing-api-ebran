import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/situasi")({ component: SituasiLayout });

function SituasiLayout() {
  return <Outlet />;
}
