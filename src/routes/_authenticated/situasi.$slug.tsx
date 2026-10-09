import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/situasi/$slug")({ component: SituationDetailLayout });

function SituationDetailLayout() {
  return <Outlet />;
}