import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/strategi")({ component: StrategiLayout });

function StrategiLayout() {
  return <Outlet />;
}
