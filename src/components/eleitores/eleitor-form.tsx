"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, SuccessDialog } from "@/components/ui/action-dialog";
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
  onlyDigits,
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

type EnderecoCepResponse = {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
  source: "brasilapi" | "viacep";
};

const cadastroSteps = [
  { title: "Dados", description: "Identificação e contato" },
  { title: "Endereço", description: "CEP, cidade e bairro" },
  { title: "Eleitoral", description: "Opcional — título, zona e seção" },
  { title: "Extras", description: "Organização e observações" },
  { title: "Revisão", description: "Confira antes de salvar" },
] as const;

type CadastroStepIndex = 0 | 1 | 2 | 3 | 4;

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function ReviewItem({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="rounded-lg border border-border bg-slate-50 px-3 py-2 dark:bg-slate-900/40">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{displayValue(value)}</p>
    </div>
  );
}

function CadastroStepper({
  activeStep,
  onStepClick,
}: {
  activeStep: number;
  onStepClick: (step: CadastroStepIndex) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="grid gap-2 sm:grid-cols-5">
        {cadastroSteps.map((step, index) => {
          const isActive = activeStep === index;
          const isDone = activeStep > index;
          return (
            <button
              key={step.title}
              type="button"
              onClick={() => onStepClick(index as CadastroStepIndex)}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                isActive
                  ? "border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
                  : isDone
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
                    : "border-border bg-background text-muted"
              }`}
            >
              <span className="text-xs font-semibold">
                {index + 1}. {step.title}
              </span>
              <span className="mt-1 block text-xs">{step.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type Props = {
  mode: "create" | "edit";
  eleitorId?: string;
  initialValues?: EleitorFormInput;
  onCancel: () => void;
  onSuccess: (id: string) => void;
  onSuccessSecondary?: () => void;
  successSecondaryLabel?: string;
};

export function EleitorForm({
  mode,
  eleitorId,
  initialValues,
  onCancel,
  onSuccess,
  onSuccessSecondary,
  successSecondaryLabel = "Voltar à lista",
}: Props) {
  const [estados, setEstados] = useState<{ id: string; nome: string; sigla: string }[]>([]);
  const [municipios, setMunicipios] = useState<{ id: string; nome: string }[]>([]);
  const [bairros, setBairros] = useState<{ id: string; nome: string }[]>([]);
  const [zonas, setZonas] = useState<{ id: string; numero: number }[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [savedId, setSavedId] = useState("");
  const [savedName, setSavedName] = useState("");
  const [pendingEditName, setPendingEditName] = useState("");
  const pendingDataRef = useRef<EleitorFormInput | null>(null);
  const [loadingBairros, setLoadingBairros] = useState(false);
  const [loadingZonas, setLoadingZonas] = useState(false);
  const [municipiosCadastro, setMunicipiosCadastro] = useState<{ id: string; nome: string }[]>(
    []
  );
  const [estadoCadastroId, setEstadoCadastroId] = useState("");
  const [eleitorNoMesmoMunicipio, setEleitorNoMesmoMunicipio] = useState(false);
  const [lembrarCidadePadrao, setLembrarCidadePadrao] = useState(false);
  const [showCidadeCadastro, setShowCidadeCadastro] = useState(true);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFeedback, setCepFeedback] = useState("");
  const [activeStep, setActiveStep] = useState<CadastroStepIndex>(0);
  const ultimoCepBuscadoRef = useRef("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
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
  const cepValue = watch("cep");

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
    const cep = onlyDigits(cepValue ?? "");

    if (mode !== "create") return;

    if (cep.length !== 8) {
      ultimoCepBuscadoRef.current = "";
      setCepLoading(false);
      setCepFeedback("");
      return;
    }

    if (estados.length === 0 || ultimoCepBuscadoRef.current === cep) return;

    let cancelled = false;
    ultimoCepBuscadoRef.current = cep;

    async function preencherEnderecoPorCep() {
      setCepLoading(true);
      setCepFeedback("Buscando endereço pelo CEP...");

      try {
        const res = await fetch(`/api/enderecos/cep/${cep}`, {
          credentials: "include",
        });
        const json = await res.json();

        if (!json.success) {
          if (!cancelled) {
            setCepFeedback(json.error ?? "CEP não encontrado.");
          }
          return;
        }

        const endereco = json.data as EnderecoCepResponse;
        if (cancelled) return;

        setValue("cep", maskCEP(endereco.cep), { shouldValidate: true });
        if (endereco.logradouro) {
          setValue("logradouro", endereco.logradouro, { shouldValidate: true });
        }

        const estado = estados.find(
          (item) => item.sigla.toUpperCase() === endereco.estado.toUpperCase()
        );

        if (!estado) {
          setCepFeedback(
            `Endereço encontrado, mas o estado ${endereco.estado} não está importado.`
          );
          return;
        }

        setValue("estado_id", estado.id, { shouldValidate: true });
        setValue("cidade_id", "");
        setValue("bairro_id", "");
        setValue("novo_bairro_nome", "");
        setValue("zona_eleitoral_id", "");
        setValue("nova_zona_numero", undefined);
        setValue("municipio_eleitoral", "");

        const municipiosRes = await fetch(
          `/api/territorio/municipios?estado_id=${estado.id}`,
          { credentials: "include" }
        );
        const municipiosJson = await municipiosRes.json();
        if (cancelled) return;

        const municipiosEncontrados = municipiosJson.success
          ? unwrapTerritorioList<{ id: string; nome: string }>(municipiosJson.data)
          : [];
        setMunicipios(municipiosEncontrados);

        const municipio = municipiosEncontrados.find(
          (item) => normalizeSearch(item.nome) === normalizeSearch(endereco.cidade)
        );

        if (!municipio) {
          setCepFeedback(
            `Endereço encontrado, mas o município ${endereco.cidade}/${endereco.estado} não está importado.`
          );
          return;
        }

        setValue("cidade_id", municipio.id, { shouldValidate: true });
        setValue("municipio_eleitoral", municipio.nome, { shouldValidate: true });

        if (!endereco.bairro) {
          setCepFeedback("Endereço preenchido. Informe o bairro manualmente.");
          return;
        }

        const bairrosRes = await fetch(
          `/api/territorio/bairros?cidade_id=${municipio.id}`,
          { credentials: "include" }
        );
        const bairrosJson = await bairrosRes.json();
        if (cancelled) return;

        const bairrosEncontrados = bairrosJson.success
          ? unwrapTerritorioList<{ id: string; nome: string }>(bairrosJson.data)
          : [];
        setBairros(bairrosEncontrados);

        const bairro = bairrosEncontrados.find(
          (item) => normalizeSearch(item.nome) === normalizeSearch(endereco.bairro)
        );

        if (bairro) {
          setValue("bairro_id", bairro.id, { shouldValidate: true });
          setValue("novo_bairro_nome", "");
          setCepFeedback(`Endereço preenchido via ${endereco.source}.`);
        } else {
          setValue("bairro_id", "");
          setValue("novo_bairro_nome", endereco.bairro, { shouldValidate: true });
          setCepFeedback(
            `Endereço preenchido via ${endereco.source}. Bairro será cadastrado ao salvar.`
          );
        }
      } catch {
        if (!cancelled) {
          setCepFeedback("Não foi possível buscar o CEP agora.");
        }
      } finally {
        if (!cancelled) {
          setCepLoading(false);
        }
      }
    }

    void preencherEnderecoPorCep();

    return () => {
      cancelled = true;
    };
  }, [cepValue, estados, mode, setValue]);

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

  async function executeSave(data: EleitorFormInput): Promise<boolean> {
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
      return false;
    }

    if (mode === "create" && lembrarCidadePadrao && data.cidade_cadastro_id) {
      await fetch("/api/auth/cidade-cadastro-padrao", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cidade_id: data.cidade_cadastro_id }),
      });
    }

    setSavedId(json.data?.id ?? eleitorId ?? "");
    setSavedName(data.nome_completo);
    setSuccessOpen(true);
    return true;
  }

  function handleValidSubmit(data: EleitorFormInput) {
    if (mode === "edit") {
      pendingDataRef.current = data;
      setPendingEditName(data.nome_completo);
      setConfirmEditOpen(true);
      return;
    }
    void executeSave(data);
  }

  async function handleConfirmEdit() {
    const data = pendingDataRef.current;
    if (!data) return;
    setConfirmEditOpen(false);
    await executeSave(data);
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

  const isReviewStep = activeStep === cadastroSteps.length - 1;
  const values = watch();
  const estadoSelecionado = estados.find((item) => item.id === values.estado_id);
  const municipioSelecionado = municipios.find((item) => item.id === values.cidade_id);
  const cidadeCadastroSelecionada = municipiosCadastro.find(
    (item) => item.id === values.cidade_cadastro_id
  );
  const bairroSelecionado =
    values.novo_bairro_nome ||
    bairros.find((item) => item.id === values.bairro_id)?.nome ||
    "";
  const zonaSelecionada =
    zonas.find((item) => item.id === values.zona_eleitoral_id)?.numero ??
    values.nova_zona_numero;

  function fieldsForStep(step: CadastroStepIndex): FieldPath<EleitorFormInput>[] {
    if (step === 0) {
      return [
        ...(showCidadeCadastro ? (["cidade_cadastro_id"] as const) : []),
        "nome_completo",
        "cpf",
        "rg",
        "data_nascimento",
        "sexo",
        "telefone_principal",
        "telefone_secundario",
        "email",
      ];
    }

    if (step === 1) {
      return [
        "cep",
        "logradouro",
        "numero",
        "complemento",
        "estado_id",
        "cidade_id",
        "bairro_id",
        "novo_bairro_nome",
      ];
    }

    if (step === 2) {
      return [
        "titulo_eleitor",
        "secao_eleitoral",
        "municipio_eleitoral",
        "zona_eleitoral_id",
        "nova_zona_numero",
      ];
    }

    if (step === 3) {
      return [
        "prioridade",
        "categoria",
        "lideranca_responsavel",
        "grupo_politico",
        "observacoes",
      ];
    }

    return [];
  }

  async function handleNextStep() {
    const fields = fieldsForStep(activeStep);
    const isValid = fields.length
      ? await trigger(fields, { shouldFocus: true })
      : true;
    if (!isValid) return;
    setActiveStep((step) => Math.min(step + 1, cadastroSteps.length - 1) as CadastroStepIndex);
  }

  function handlePreviousStep() {
    setActiveStep((step) => Math.max(step - 1, 0) as CadastroStepIndex);
  }

  function handleStepClick(step: CadastroStepIndex) {
    if (step <= activeStep) setActiveStep(step);
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    if (!isReviewStep) {
      event.preventDefault();
      void handleNextStep();
      return;
    }
    void handleSubmit(handleValidSubmit)(event);
  }

  return (
    <>
    <form onSubmit={handleFormSubmit} className="mx-auto w-full max-w-4xl space-y-6">
      <CadastroStepper activeStep={activeStep} onStepClick={handleStepClick} />

      <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-100">
        <p className="font-semibold">{cadastroSteps[activeStep].title}</p>
        <p className="mt-1 text-indigo-800 dark:text-indigo-200">
          {cadastroSteps[activeStep].description}
        </p>
      </div>

      {activeStep === 0 && (
        <>
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
        </>
      )}

      {activeStep === 1 && (
      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="CEP"
            required
            error={errors.cep}
            hint={cepFeedback || "Ao informar o CEP, o endereço será preenchido automaticamente."}
            value={watch("cep")}
            onChange={(e) => setValue("cep", maskCEP(e.target.value), { shouldValidate: true })}
            placeholder="00000-000"
            disabled={cepLoading}
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
            variant="bairro"
          />
        </CardContent>
      </Card>
      )}

      {activeStep === 2 && (
      <Card>
        <CardHeader>
          <CardTitle>Dados eleitorais</CardTitle>
          <p className="text-sm text-muted">
            Opcional. Você pode salvar o cadastro e completar o título de eleitor depois.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Título de eleitor"
            error={errors.titulo_eleitor}
            hint="Opcional"
            value={watch("titulo_eleitor")}
            onChange={(e) =>
              setValue("titulo_eleitor", maskTituloEleitor(e.target.value), { shouldValidate: true })
            }
          />
          <FormField
            label="Seção"
            error={errors.secao_eleitoral}
            hint="Opcional"
            value={watch("secao_eleitoral")}
            onChange={(e) =>
              setValue("secao_eleitoral", maskSecao(e.target.value), { shouldValidate: true })
            }
          />
          <FormField
            label="Município eleitoral"
            error={errors.municipio_eleitoral}
            hint="Opcional — preenchido automaticamente pelo endereço quando possível"
            {...register("municipio_eleitoral")}
          />
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
            variant="zona"
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
        </CardContent>
      </Card>
      )}

      {activeStep === 3 && (
      <Card>
        <CardHeader>
          <CardTitle>Informações extras</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
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
      )}

      {activeStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Revisão do cadastro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Identificação</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {showCidadeCadastro && (
                  <ReviewItem
                    label="Cidade do cadastro"
                    value={cidadeCadastroSelecionada?.nome}
                  />
                )}
                <ReviewItem label="Nome completo" value={values.nome_completo} />
                <ReviewItem label="CPF" value={values.cpf} />
                <ReviewItem label="RG" value={values.rg} />
                <ReviewItem label="Nascimento" value={values.data_nascimento} />
                <ReviewItem label="Telefone" value={values.telefone_principal} />
                <ReviewItem label="E-mail" value={values.email} />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Endereço</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <ReviewItem label="CEP" value={values.cep} />
                <ReviewItem
                  label="Logradouro"
                  value={`${values.logradouro ?? ""}, ${values.numero ?? ""}`.trim()}
                />
                <ReviewItem label="Complemento" value={values.complemento} />
                <ReviewItem label="Estado" value={estadoSelecionado?.sigla} />
                <ReviewItem label="Município" value={municipioSelecionado?.nome} />
                <ReviewItem label="Bairro" value={bairroSelecionado} />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Dados eleitorais</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <ReviewItem label="Título" value={values.titulo_eleitor} />
                <ReviewItem label="Zona" value={zonaSelecionada ? `Zona ${zonaSelecionada}` : ""} />
                <ReviewItem label="Seção" value={values.secao_eleitoral} />
                <ReviewItem label="Município eleitoral" value={values.municipio_eleitoral} />
                <ReviewItem label="Local de votação" value={values.local_votacao} />
                <ReviewItem label="Situação" value={values.situacao} />
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Extras</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <ReviewItem label="Prioridade" value={values.prioridade} />
                <ReviewItem label="Categoria" value={values.categoria} />
                <ReviewItem label="Liderança" value={values.lideranca_responsavel} />
                <ReviewItem label="Grupo político" value={values.grupo_politico} />
                <ReviewItem label="Observações" value={values.observacoes} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {submitError && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {submitError}
        </p>
      )}

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-3 border-t border-border bg-background/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:justify-between sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
        <div className="flex flex-col gap-3 sm:flex-row">
          {activeStep > 0 && (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
              onClick={handlePreviousStep}
            >
              Voltar
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
            onClick={onCancel}
          >
            Cancelar
          </Button>
        </div>

        <Button
          type={isReviewStep ? "submit" : "button"}
          disabled={isSubmitting}
          className="min-h-11 w-full sm:w-auto"
          onClick={isReviewStep ? undefined : handleNextStep}
        >
          {isReviewStep
            ? isSubmitting
              ? "Salvando..."
              : mode === "create"
                ? "Salvar cadastro"
                : "Salvar alterações"
            : "Continuar"}
        </Button>
      </div>
    </form>

    <ConfirmDialog
      open={confirmEditOpen}
      onOpenChange={setConfirmEditOpen}
      title="Confirmar alterações"
      description={`Deseja salvar as alterações no cadastro de "${pendingEditName}"?`}
      confirmLabel="Salvar alterações"
      onConfirm={handleConfirmEdit}
      loading={isSubmitting}
    />

    <SuccessDialog
      open={successOpen}
      onOpenChange={setSuccessOpen}
      title={mode === "create" ? "Cadastro realizado com sucesso!" : "Alterações salvas!"}
      description={
        mode === "create"
          ? `O eleitor ${savedName} foi cadastrado no sistema.`
          : `Os dados de ${savedName} foram atualizados.`
      }
      primaryLabel="Ver cadastro"
      onPrimary={() => {
        setSuccessOpen(false);
        onSuccess(savedId);
      }}
      secondaryLabel={onSuccessSecondary ? successSecondaryLabel : undefined}
      onSecondary={
        onSuccessSecondary
          ? () => {
              setSuccessOpen(false);
              onSuccessSecondary();
            }
          : undefined
      }
    />
    </>
  );
}
