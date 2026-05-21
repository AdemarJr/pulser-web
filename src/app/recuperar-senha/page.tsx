"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { Logo } from "@/components/brand/logo";
import { recuperarSenhaSchema } from "@/lib/validators/eleitor";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = recuperarSenhaSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "E-mail inválido");
      return;
    }
    setSuccess(true);
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center overflow-y-auto bg-gradient-to-br from-black via-slate-950 to-slate-900 p-4 py-8 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <Logo size="lg" className="mb-8" />
      <Card className="w-full max-w-md border border-slate-800/60 bg-card/95 shadow-2xl backdrop-blur">
        <CardHeader>
          <CardTitle>Recuperar senha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <p className="text-sm text-muted">
              Se o e-mail estiver cadastrado, você receberá as instruções. Configure o
              envio no painel Supabase Auth.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full">
                Enviar link de recuperação
              </Button>
            </form>
          )}
          <Link href="/login" className="text-sm text-blue-500 hover:underline">
            Voltar ao login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
