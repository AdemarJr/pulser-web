"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BairroZonaFields } from "@/components/eleitores/bairro-zona-fields";
import { CidadeCadastroFields } from "@/components/eleitores/cidade-cadastro-fields";
import { FormField, FormSelect } from "@/components/forms/form-field";
import { unwrapTerritorioList } from "@/lib/api/territorio-cadastro";
import { eleitorSchema, type EleitorFormInput } from "@/lib/validators/eleitor";
import {
  maskCEP,
  maskCPF,
  maskPhone,
  maskRG,
  maskSecao,
  maskTituloEleitor,
} from "@/lib/formatters";

const emptyDefaults: EleitorFormInput = {
  nome_completo: "",
  nome_social: "",
  data_nascimento: "",
  sexo: "nao_informar",
  cpf: "",
  rg: "",
  telefone_principal: "",
  telefone_secundario: "",
  email: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro_id: "",
  novo_bairro_nome: "",
  cidade_cadastro_id: "",
  cidade_id: "",
  estado_id: "",
  titulo_eleitor: "",
  zona_eleitoral_id: "",
  nova_zona_numero: undefined,
  secao_eleitoral: "",
  municipio_eleitoral: "",
  situacao_eleitoral: "regular",
  situacao: "pendente",
  prioridade: 0,
  local_votacao: "",
  lideranca_responsavel: "",
  grupo_politico: "",
  observacoes: "",
  categoria: "",
};

type Props = {
  mode: "create" | "edit";
  eleitorId?: string;
  initialValues?: EleitorFormInput;
  onCancel: () => void;
  onSuccess: (id: string) => void;
};

export function EleitorForm({ mode, eleitorId, initialValues, onCancel, onSuccess }: Props) {
  const [estados, setEstados] = useState<{ id: string; nome: string; sigla: string }[]>([]);
  const [municipios, setMunicipios] = useState<{ id: string; nome: string }[]>([]);
  const [bairros, setBairros] = useState<{ id: string; nome: string }[]>([]);
  const [zonas, setZonas] = useState<{ id: string; numero: number }[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [loadingBairros, setLoadingBairros] = useState(false);
  const [loadingZonas, setLoadingZonas] = useState(false);
  const [municipiosCadastro, setMunicipiosCadastro] = useState<{ id: string; nome: string }[]>(
    []
  );
  const [estadoCadastroId, setEstadoCadastroId] = useState("");
  const [eleitorNoMesmoMunicipio, setEleitorNoMesmoMunicipio] = useState(false);
  const [lembrarCidadePadrao, setLembrarCidadePadrao] = useState(false);
  const [showCidadeCadastro, setShowCidadeCadastro] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EleitorFormInput>({
    resolver: zodResolver(eleitorSchema),
    defaultValues: initialValues ?? emptyDefaults,
  });

  useEffect(() => {
    if (initialValues) reset(initialValues);
  }, [initialValues, reset]);

  const estadoId = watch("estado_id");
  const cidadeId = watch("cidade_id");
  const cidadeCadastroId = watch("cidade_cadastro_id");

  useEffect(() => {
    fetch("/api/territorio/estados")
      .then((r) => r.json())
      .then((j) => j.success && setEstados(unwrapTerritorioList(j.data)));

    if (mode === "create") {
      fetch("/api/auth/me", { credentials: "include" })
        .then((r) => r.json())
        .then((j) => {
          if (!j.success) return;
          const slug = j.data.perfil?.slug;
          setShowCidadeCadastro(
            slug === "cadastrador" ||
              slug === "coordenador" ||
              slug === "admin_geral" ||
              (j.data.permissions ?? []).includes("eleitores.criar")
          );
          const padrao = j.data.cidadeCadastroPadrao as
            | { id: string; nome: string; estado_id: string }
            | null;
          if (padrao?.id) {
            setEstadoCadastroId(padrao.estado_id);
            setValue("cidade_cadastro_id", padrao.id, { shouldValidate: true });
          }
        });
    }
  }, [mode, setValue]);

  useEffect(() => {
    if (mode === "edit" && initialValues?.cidade_cadastro_id && !estadoCadastroId) {
      fetch(`/api/territorio/cidades/${initialValues.cidade_cadastro_id}`, {
        credentials: "include",
      })
        .then((r) => r.json())
        .then((j) => {
          if (j.success && j.data.estado_id) {
            setEstadoCadastroId(j.data.estado_id);
          }
        });
    }
  }, [mode, initialValues?.cidade_cadastro_id, estadoCadastroId]);

  useEffect(() => {
    if (!estadoCadastroId) {
      setMunicipiosCadastro([]);
      return;
    }
    fetch(`/api/territorio/municipios?estado_id=${estadoCadastroId}`)
      .then((r) => r.json())
      .then((j) => j.success && setMunicipiosCadastro(unwrapTerritorioList(j.data)));
  }, [estadoCadastroId]);

  useEffect(() => {
    if (!estadoId) {
      setMunicipios([]);
      return;
    }
    fetch(`/api/territorio/municipios?estado_id=${estadoId}`)
      .then((r) => r.json())
      .then((j) => j.success && setMunicipios(unwrapTerritorioList(j.data)));
  }, [estadoId]);

  useEffect(() => {
    if (!cidadeId) {
      setBairros([]);
      setZonas([]);
      return;
    }

    setLoadingBairros(true);
    setLoadingZonas(true);

    fetch(`/api/territorio/bairros?cidade_id=${cidadeId}`)
      .then((r) => r.json())
      .then((j) => j.success && setBairros(unwrapTerritorioList(j.data)))
      .finally(() => setLoadingBairros(false));

    if (estadoId) {
      fetch(`/api/territorio/zonas?cidade_id=${cidadeId}&estado_id=${estadoId}`)
        .then((r) => r.json())
        .then((j) => j.success && setZonas(unwrapTerritorioList(j.data)))
        .finally(() => setLoadingZonas(false));
    } else {
      setLoadingZonas(false);
    }
  }, [cidadeId, estadoId]);

  async function onSubmit(data: EleitorFormInput) {
    setSubmitError("");
    const url = mode === "create" ? "/api/eleitores" : `/api/eleitores/${eleitorId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) {
      setSubmitError(json.error ?? "Erro ao salvar");
      return;
    }

    if (mode === "create" && lembrarCidadePadrao && data.cidade_cadastro_id) {
      await fetch("/api/auth/cidade-cadastro-padrao", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cidade_id: data.cidade_cadastro_id }),
      });
    }

    onSuccess(json.data?.id ?? eleitorId ?? "");
  }

  function handleEleitorNoMesmoMunicipio(checked: boolean) {
    setEleitorNoMesmoMunicipio(checked);
    if (checked && cidadeCadastroId && estadoCadastroId) {
      const m = municipiosCadastro.find((x) => x.id === cidadeCadastroId);
      setValue("estado_id", estadoCadastroId, { shouldValidate: true });
      setValue("cidade_id", cidadeCadastroId, { shouldValidate: true });
      setValue("municipio_eleitoral", m?.nome ?? "", { shouldValidate: true });
    }
  }

  function handleEstadoCadastroChange(estadoIdNovo: string) {
    setEstadoCadastroId(estadoIdNovo);
    setValue("cidade_cadastro_id", "", { shouldValidate: true });
    if (eleitorNoMesmoMunicipio) {
      setValue("estado_id", estadoIdNovo, { shouldValidate: true });
      setValue("cidade_id", "");
      setValue("municipio_eleitoral", "");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto w-full max-w-4xl space-y-6">
      {showCidadeCadastro && (
        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader>
            <CardTitle>Cidade do cadastro</CardTitle>
          </CardHeader>
          <CardContent>
            <CidadeCadastroFields
              estados={estados}
              municipiosCadastro={municipiosCadastro}
              estadoCadastroId={estadoCadastroId}
              cidadeCadastroId={cidadeCadastroId}
              errors={errors}
              watch={watch}
              setValue={setValue}
              onEstadoCadastroChange={handleEstadoCadastroChange}
              eleitorNoMesmoMunicipio={eleitorNoMesmoMunicipio}
              onEleitorNoMesmoMunicipioChange={handleEleitorNoMesmoMunicipio}
              lembrarCidadePadrao={lembrarCidadePadrao}
              onLembrarCidadePadraoChange={setLembrarCidadePadrao}
              showLembrarPadrao={mode === "create"}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Nome completo"
            required
            error={errors.nome_completo}
            {...register("nome_completo")}
          />
          <FormField label="Nome social" error={errors.nome_social} {...register("nome_social")} />
          <FormField
            label="CPF"
            required
            error={errors.cpf}
            value={watch("cpf")}
            onChange={(e) => setValue("cpf", maskCPF(e.target.value), { shouldValidate: true })}
            placeholder="000.000.000-00"
          />
          <FormField
            label="RG"
            required
            error={errors.rg}
            value={watch("rg")}
            onChange={(e) => setValue("rg", maskRG(e.target.value), { shouldValidate: true })}
          />
          <FormField
            label="Data de nascimento"
            type="date"
            required
            error={errors.data_nascimento}
            {...register("data_nascimento")}
          />
          <FormSelect label="Sexo" required error={errors.sexo} {...register("sexo")}>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="outro">Outro</option>
            <option value="nao_informar">Não informar</option>
          </FormSelect>
          <FormField
            label="Telefone principal"
            required
            error={errors.telefone_principal}
            value={watch("telefone_principal")}
            onChange={(e) =>
              setValue("telefone_principal", maskPhone(e.target.value), { shouldValidate: true })
            }
            placeholder="(00) 00000-0000"
          />
          <FormField
            label="Telefone secundário"
            error={errors.telefone_secundario}
            value={watch("telefone_secundario") ?? ""}
            onChange={(e) =>
              setValue("telefone_secundario", maskPhone(e.target.value), { shouldValidate: true })
            }
          />
          <FormField label="E-mail" type="email" error={errors.email} {...register("email")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="CEP"
            required
            error={errors.cep}
            value={watch("cep")}
            onChange={(e) => setValue("cep", maskCEP(e.target.value), { shouldValidate: true })}
            placeholder="00000-000"
          />
          <FormField label="Logradouro" required error={errors.logradouro} {...register("logradouro")} />
          <FormField label="Número" required error={errors.numero} {...register("numero")} />
          <FormField label="Complemento" error={errors.complemento} {...register("complemento")} />

          {estados.length === 0 && (
            <p className="sm:col-span-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              Importe estados e municípios em{" "}
              <a href="/territorio" className="font-medium underline">
                Território
              </a>
              .
            </p>
          )}

          <FormSelect
            label="Estado (UF)"
            required
            error={errors.estado_id}
            value={watch("estado_id")}
            onChange={(e) => {
              setValue("estado_id", e.target.value, { shouldValidate: true });
              setValue("cidade_id", "");
              setValue("bairro_id", "");
              setValue("zona_eleitoral_id", "");
              setValue("municipio_eleitoral", "");
            }}
          >
            <option value="">Selecione</option>
            {estados.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sigla} — {s.nome}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            label="Município do eleitor"
            required
            error={errors.cidade_id}
            disabled={!estadoId}
            value={watch("cidade_id")}
            onChange={(e) => {
              const id = e.target.value;
              setValue("cidade_id", id, { shouldValidate: true });
              setValue("bairro_id", "");
              setValue("novo_bairro_nome", "");
              setValue("zona_eleitoral_id", "");
              setValue("nova_zona_numero", undefined);
              const m = municipios.find((x) => x.id === id);
              setValue("municipio_eleitoral", m?.nome ?? "", { shouldValidate: true });
            }}
          >
            <option value="">Selecione</option>
            {municipios.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </FormSelect>

          <BairroZonaFields
            cidadeId={cidadeId}
            bairros={bairros}
            zonas={zonas}
            loadingBairros={loadingBairros}
            loadingZonas={loadingZonas}
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados eleitorais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Título de eleitor"
            required
            error={errors.titulo_eleitor}
            value={watch("titulo_eleitor")}
            onChange={(e) =>
              setValue("titulo_eleitor", maskTituloEleitor(e.target.value), { shouldValidate: true })
            }
          />
          <FormField
            label="Seção"
            required
            error={errors.secao_eleitoral}
            value={watch("secao_eleitoral")}
            onChange={(e) =>
              setValue("secao_eleitoral", maskSecao(e.target.value), { shouldValidate: true })
            }
          />
          <FormField
            label="Município eleitoral"
            required
            error={errors.municipio_eleitoral}
            {...register("municipio_eleitoral")}
          />
          <FormSelect
            label="Situação eleitoral"
            error={errors.situacao_eleitoral}
            {...register("situacao_eleitoral")}
          >
            <option value="regular">Regular</option>
            <option value="suspensa">Suspensa</option>
            <option value="cancelada">Cancelada</option>
            <option value="pendente">Pendente</option>
            <option value="outra">Outra</option>
          </FormSelect>
          <FormSelect label="Situação cadastro" error={errors.situacao} {...register("situacao")}>
            <option value="pendente">Pendente</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="falecido">Falecido</option>
            <option value="mudou_cidade">Mudou de cidade</option>
          </FormSelect>
          <FormField
            label="Local de votação"
            error={errors.local_votacao}
            {...register("local_votacao")}
          />
          <FormField
            label="Prioridade (0-10)"
            type="number"
            min={0}
            max={10}
            error={errors.prioridade}
            {...register("prioridade")}
          />
          <FormField label="Categoria" error={errors.categoria} {...register("categoria")} />
          <FormField
            label="Liderança responsável"
            error={errors.lideranca_responsavel}
            {...register("lideranca_responsavel")}
          />
          <FormField label="Grupo político" error={errors.grupo_politico} {...register("grupo_politico")} />
          <FormField
            label="Observações"
            className="sm:col-span-2"
            error={errors.observacoes}
            {...register("observacoes")}
          />
        </CardContent>
      </Card>

      {submitError && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {submitError}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row">
        <Button type="submit" disabled={isSubmitting} className="min-h-11 w-full sm:w-auto">
          {isSubmitting ? "Salvando..." : mode === "create" ? "Salvar cadastro" : "Salvar alterações"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full sm:w-auto"
          onClick={onCancel}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
