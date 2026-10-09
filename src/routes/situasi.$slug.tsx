import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/situasi/$slug")({ component: SituationDetailLayout });

function SituationDetailLayout() {
  return <Outlet />;
}