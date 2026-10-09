import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          {eyebrow && <p className="mb-2 text-[11px] font-semibold uppercase text-primary">{eyebrow}</p>}
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function EmptyWorkspace({ icon: Icon, title, description, steps }: { icon: LucideIcon; title: string; description: string; steps: string[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-accent text-primary"><Icon className="size-4" /></span>
          <div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-0.5 text-xs text-muted-foreground">{description}</p></div>
        </div>
      </div>
      <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
        {steps.map((step, index) => (
          <div key={step} className="min-h-40 p-5">
            <span className="text-[11px] font-semibold text-primary">0{index + 1}</span>
            <h3 className="mt-8 text-sm font-medium">{step}</h3>
            <div className="mt-3 h-1.5 w-4/5 rounded-full bg-muted" /><div className="mt-2 h-1.5 w-3/5 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}