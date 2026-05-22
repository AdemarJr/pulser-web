"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { Logo } from "@/components/brand/logo";
import { loginSchema } from "@/lib/validators/eleitor";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const next: { email?: string; password?: string } = {};
      parsed.error.issues.forEach((i) => {
        const key = i.path[0] as "email" | "password";
        if (!next[key]) next[key] = i.message;
      });
      setErrors(next);
      return;
    }

    setLoading(true);
    let json: { success?: boolean; error?: string };
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(parsed.data),
      });
      json = await res.json();
    } catch {
      setLoading(false);
      setError("Falha de conexão. Verifique a rede e tente novamente.");
      return;
    }
    setLoading(false);

    if (!json.success) {
      setError(json.error ?? "Erro ao entrar");
      return;
    }

    window.location.assign("/dashboard");
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center overflow-y-auto bg-gradient-to-br from-black via-slate-950 to-slate-900 p-4 py-8 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <Logo size="xl" priority className="mb-8" />
      <Card className="w-full max-w-md border border-slate-800/60 bg-card/95 shadow-2xl backdrop-blur">
        <CardHeader className="pb-2 text-center">
          <p className="text-sm text-muted">
            Gestão de eleitores — acesse com suas credenciais
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="E-mail"
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin-super ou seu@email.com"
              error={errors.email ? { type: "manual", message: errors.email } : undefined}
              required
            />
            <FormField
              label="Senha"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              error={errors.password ? { type: "manual", message: errors.password } : undefined}
              required
            />
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-center text-sm text-muted">
              <a href="/recuperar-senha" className="text-blue-500 hover:underline">
                Esqueceu a senha?
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
