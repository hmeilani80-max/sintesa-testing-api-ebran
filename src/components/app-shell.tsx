import { Link, useRouterState } from "@tanstack/react-router";
import {
  Archive,
  Bell,
  CalendarDays,
  BookOpenCheck,
  ChevronDown,
  CircleGauge,
  ClipboardCheck,
  Command,
  Newspaper,
  Smartphone,
  PenSquare,
  Share2,
  LayoutDashboard,
  Search,
  Settings2,
  ShieldCheck,
  Target,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { highEwsNotifications } from "@/features/situasi/data";
import { useTugas } from "@/features/aksi/tugas-context";
import { taskNotifications } from "@/features/aksi/tugas";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const aksiItems = [
  { label: "Kalender & Tugas", to: "/aksi/kalender-tugas", icon: CalendarDays },
  { label: "Produksi", to: "/aksi/produksi", icon: PenSquare },
  { label: "Persetujuan", to: "/aksi/persetujuan", icon: ClipboardCheck },
  { label: "Distribusi Sosial", to: "/aksi/distribusi-sosial", icon: Share2 },
  { label: "Distribusi News", to: "/aksi/distribusi-news", icon: Newspaper },
] as const;

const mainItems = [
  { label: "Beranda", to: "/", icon: LayoutDashboard },
  { label: "Situasi", to: "/situasi", icon: CircleGauge },
  { label: "Strategi", to: "/strategi", icon: Target },
  { label: "Dampak", to: "/dampak", icon: BookOpenCheck },
  { label: "Arsip & Pengetahuan", to: "/arsip", icon: Archive },
] as const;

function SpektraSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="h-[72px] justify-center border-b border-sidebar-border px-3">
        <Link to="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpenMobile(false)}>
          <span className="relative grid size-9 shrink-0 place-items-center rounded-md bg-sidebar-accent text-sidebar-foreground">
            <Command className="size-5" />
            <span aria-hidden className="absolute -left-1.5 top-2 h-5 w-[3px] rounded-full bg-brand" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block font-display text-base font-semibold">SINTESA</span>
              <span className="block truncate text-[10px] text-sidebar-foreground/55">Sistem Intelijen Terpadu dan Strategi Aksi</span>
            </span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-1 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase text-[10px] font-semibold">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.slice(0, 3).map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={item.to === "/" ? pathname === "/" : pathname.startsWith(item.to)} tooltip={item.label} className="h-10 data-[active=true]:shadow-[inset_3px_0_0_var(--color-brand)]">
                    <Link to={item.to} onClick={() => setOpenMobile(false)}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase text-[10px] font-semibold">Aksi</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aksiItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(item.to)} tooltip={item.label} className="h-10 data-[active=true]:shadow-[inset_3px_0_0_var(--color-brand)]">
                    <Link to={item.to} onClick={() => setOpenMobile(false)}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.slice(3).map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={item.to === "/" ? pathname === "/" : pathname.startsWith(item.to)} tooltip={item.label} className="h-10 data-[active=true]:shadow-[inset_3px_0_0_var(--color-brand)]">
                    <Link to={item.to} onClick={() => setOpenMobile(false)}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/administrasi"} tooltip="Administrasi" className="h-10 data-[active=true]:shadow-[inset_3px_0_0_var(--color-brand)]">
              <Link to="/administrasi" onClick={() => setOpenMobile(false)}>
                <Settings2 />
                <span>Administrasi</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <div className="mt-2 flex items-center gap-2 px-2 text-[10px] text-sidebar-foreground/45">
            <ShieldCheck className="size-3.5" />
            <span>Lingkungan POC · Aman</span>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="size-9" aria-label="Buka atau perkecil navigasi" />
      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Pencarian global" placeholder="Cari isu, kajian, respons, atau dokumen…" className="h-10 bg-card pl-10" />
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Cari">
          <Search />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifikasi">
              <Bell />
              {highEwsNotifications.length > 0 && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 space-y-3 p-0">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Notifikasi EWS (Tinggi / Kritis)</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Peringatan dini dengan level risiko tinggi atau kritis.</p>
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto px-2 pb-2">
              {highEwsNotifications.map((item) => (
                <div key={item.slug} className="flex items-start gap-2 rounded-md px-2 py-2 hover:bg-accent/50">
                  <span className={cn("mt-1 size-2 shrink-0 rounded-full", item.level === "Kritis" ? "bg-destructive" : "bg-chart-3")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{item.name} <span className="font-normal text-muted-foreground">· {item.level}</span></p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{item.time} — {item.reason}</p>
                    <Button asChild variant="link" size="sm" className="h-auto px-0 py-1 text-xs">
                      <Link to="/situasi/$slug" params={{ slug: item.slug }}>Lihat Situasi</Link>
                    </Button>
                  </div>
                </div>
              ))}
              {highEwsNotifications.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">Tidak ada notifikasi level tinggi atau kritis saat ini.</p>}
            </div>
            <TaskNotifications />
            <div className="flex items-center gap-2 border-t border-border bg-muted/20 px-4 py-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-card"><Smartphone className="size-4 text-muted-foreground" /></span>
              <span className="text-[11px] text-muted-foreground">Notifikasi Mobile (simulasi)</span>
            </div>
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2 px-2">
              <span className="grid size-7 place-items-center rounded-md bg-secondary"><UserRound className="size-4" /></span>
              <span className="hidden text-left md:block"><span className="block text-xs font-medium">Dimas Pratama</span><span className="block text-[10px] text-muted-foreground">Pimpinan</span></span>
              <ChevronDown className="hidden size-3.5 text-muted-foreground md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Akun saya</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem>Preferensi</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full bg-background">
        <SpektraSidebar />
        <SidebarInset className="min-w-0">
          <Topbar />
          <main className="flex-1">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
function TaskNotifications() {
  const { tasks } = useTugas();
  const items = taskNotifications(tasks);
  return <div className="border-t border-border px-2 pb-2 pt-3">
    <p className="px-2 pb-1 text-sm font-semibold">Notifikasi Pekerjaan</p>
    {items.map((n) => <Link key={n.id} to="/aksi/kalender-tugas" search={{ task: n.id }} className="block rounded-md px-2 py-1.5 hover:bg-accent/50">
      <p className="text-xs font-semibold">{n.text}</p><p className="text-[11px] text-muted-foreground">{n.title}</p></Link>)}
  </div>;
}
