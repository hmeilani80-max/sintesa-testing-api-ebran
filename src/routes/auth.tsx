import { useState, type FormEvent } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      await router.invalidate();
      await router.navigate({ to: "/" });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login gagal. Periksa email dan password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-sm sm:p-9">
        <div className="mb-8">
          <div className="mb-5 grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground font-bold tracking-wider">S</div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">SINTESA</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Masuk ke workspace</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Gunakan akun yang telah didaftarkan oleh administrator untuk melanjutkan.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input id="email" name="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="nama@organisasi.id" />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Masukkan password" />
          </div>
          {errorMessage && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{errorMessage}</p>}
          <button type="submit" disabled={loading} className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Memeriksa akun..." : "Masuk"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">Akses hanya untuk pengguna yang memiliki akun. Jika belum memiliki akun, hubungi administrator.</p>
      </section>
    </main>
  );
}
