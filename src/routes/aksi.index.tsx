import { createFileRoute, redirect } from "@tanstack/react-router";

// "Aksi" is a menu group, not a page: send visitors to its first service.
export const Route = createFileRoute("/aksi/")({ beforeLoad: () => { throw redirect({ to: "/aksi/kalender-tugas" }); } });
