"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { EleitorForm } from "@/components/eleitores/eleitor-form";

export default function NovoEleitorPage() {
  const router = useRouter();

  return (
    <>
      <Header title="Novo eleitor" />
      <div className="page-content safe-bottom">
        <EleitorForm
          mode="create"
          onCancel={() => router.push("/eleitores")}
          onSuccess={(id) => router.push(`/eleitores/${id}`)}
          onSuccessSecondary={() => router.push("/eleitores")}
        />
      </div>
    </>
  );
}
