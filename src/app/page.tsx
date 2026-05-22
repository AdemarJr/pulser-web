import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-foreground">PULSE</h1>
        <p className="mt-3 text-muted">
          Gestão de eleitores para equipes de campo e portal aberto de participação
          cidadã.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/portal">
            <Button className="w-full sm:w-auto">Portal público</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="w-full sm:w-auto">
              Área da equipe
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
