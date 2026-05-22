"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormSelect } from "@/components/forms/form-field";
import { PerfilPermissoesPanel } from "@/components/usuarios/perfil-permissoes-panel";
import {
  usuarioCreateSchema,
  usuarioUpdateSchema,
  type UsuarioCreateInput,
  type UsuarioUpdateInput,
} from "@/lib/validators/usuario";
import { maskCPF, maskPhone } from "@/lib/formatters";

type PerfilOption = {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  pode_atribuir: boolean;
  permissoes: { slug: string; nome: string; modulo: string }[];
};

const emptyDefaults: UsuarioUpdateInput = {
  nome_completo: "",
  email: "",
  telefone: "",
  cpf: "",
  perfil_id: "",
  status: "ativo",
  password: "",
};

type Props = {
  mode: "create" | "edit";
  userId?: string;
  initialValues?: UsuarioUpdateInput;
  onCancel: () => void;
  onSuccess: (id: string) => void;
};

export function UsuarioForm(props: Props) {
  if (props.mode === "create") {
    return <UsuarioFormCreate {...props} />;
  }
  return <UsuarioFormEdit {...props} />;
}

function UsuarioFormCreate({ onCancel, onSuccess }: Props) {
  const form = useForm<UsuarioUpdateInput>({
    resolver: zodResolver(usuarioCreateSchema) as Resolver<UsuarioUpdateInput>,
    defaultValues: emptyDefaults,
  });
  return (
    <UsuarioFormBody
      mode="create"
      form={form}
      onCancel={onCancel}
      onSuccess={onSuccess}
      submitUrl="/api/usuarios"
      method="POST"
    />
  );
}

function UsuarioFormEdit({ userId, initialValues, onCancel, onSuccess }: Props) {
  const form = useForm<UsuarioUpdateInput>({
    resolver: zodResolver(usuarioUpdateSchema),
    defaultValues: initialValues ?? emptyDefaults,
  });
  return (
    <UsuarioFormBody
      mode="edit"
      form={form}
      userId={userId}
      onCancel={onCancel}
      onSuccess={onSuccess}
      submitUrl={`/api/usuarios/${userId}`}
      method="PUT"
    />
  );
}

function UsuarioFormBody({
  mode,
  form,
  userId,
  onCancel,
  onSuccess,
  submitUrl,
  method,
}: {
  mode: "create" | "edit";
  form: UseFormReturn<UsuarioUpdateInput>;
  userId?: string;
  onCancel: () => void;
  onSuccess: (id: string) => void;
  submitUrl: string;
  method: "POST" | "PUT";
}) {
  const [perfis, setPerfis] = useState<PerfilOption[]>([]);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const perfilId = watch("perfil_id");
  const perfilSelecionado = perfis.find((p) => p.id === perfilId);

  useEffect(() => {
    fetch("/api/perfis", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => j.success && setPerfis(j.data.perfis ?? []));
  }, []);

  async function onSubmit(data: UsuarioCreateInput | UsuarioUpdateInput) {
    setSubmitError("");
    const body = { ...data };
    if (mode === "edit" && !body.password) {
      delete (body as UsuarioUpdateInput).password;
    }

    const res = await fetch(submitUrl, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.success) {
      setSubmitError(json.error ?? "Erro ao salvar");
      return;
    }
    onSuccess(json.data?.id ?? userId ?? "");
  }

  const perfisAtribuiveis = perfis.filter((p) => p.pode_atribuir);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados do usuário</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Nome completo"
            required
            error={errors.nome_completo}
            {...register("nome_completo")}
          />
          <FormField
            label="E-mail"
            type="email"
            required
            error={errors.email}
            {...register("email")}
          />
          <FormField
            label="Telefone"
            value={watch("telefone") ?? ""}
            onChange={(e) => setValue("telefone", maskPhone(e.target.value))}
            error={errors.telefone}
          />
          <FormField
            label="CPF"
            value={watch("cpf") ?? ""}
            onChange={(e) => setValue("cpf", maskCPF(e.target.value))}
            error={errors.cpf}
          />
          <FormSelect
            label="Perfil"
            required
            error={errors.perfil_id}
            {...register("perfil_id")}
          >
            <option value="">Selecione o perfil</option>
            {perfisAtribuiveis.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </FormSelect>
          <FormSelect label="Status" error={errors.status} {...register("status")}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="bloqueado">Bloqueado</option>
          </FormSelect>
          <FormField
            label={mode === "create" ? "Senha inicial" : "Nova senha (opcional)"}
            type="password"
            required={mode === "create"}
            error={errors.password}
            {...register("password")}
            className="sm:col-span-2"
          />
        </CardContent>
      </Card>

      <PerfilPermissoesPanel
        permissoes={perfilSelecionado?.permissoes ?? []}
        perfilNome={perfilSelecionado?.nome}
      />

      {submitError && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {submitError}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : mode === "create" ? "Criar usuário" : "Salvar alterações"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
