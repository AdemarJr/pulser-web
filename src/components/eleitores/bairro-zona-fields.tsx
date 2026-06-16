"use client";

import { useEffect, useState } from "react";
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { FormField, FormSelect } from "@/components/forms/form-field";
import type { EleitorFormInput } from "@/lib/validators/eleitor";

type BairroItem = { id: string; nome: string };
type ZonaItem = { id: string; numero: number };

type Props = {
  cidadeId: string;
  bairros: BairroItem[];
  zonas: ZonaItem[];
  loadingBairros: boolean;
  loadingZonas: boolean;
  register: UseFormRegister<EleitorFormInput>;
  watch: UseFormWatch<EleitorFormInput>;
  setValue: UseFormSetValue<EleitorFormInput>;
  errors: FieldErrors<EleitorFormInput>;
  variant?: "bairro" | "zona" | "ambos";
};

export function BairroZonaFields({
  cidadeId,
  bairros,
  zonas,
  loadingBairros,
  loadingZonas,
  register,
  watch,
  setValue,
  errors,
  variant = "ambos",
}: Props) {
  const [modoBairroNovo, setModoBairroNovo] = useState(false);
  const [modoZonaNova, setModoZonaNova] = useState(false);
  const novoBairroNome = watch("novo_bairro_nome") ?? "";
  const showBairro = variant === "bairro" || variant === "ambos";
  const showZona = variant === "zona" || variant === "ambos";

  useEffect(() => {
    if (showBairro) {
      setModoBairroNovo(bairros.length === 0 || Boolean(novoBairroNome.trim()));
      if (bairros.length === 0) {
        setValue("bairro_id", "");
      }
    }
    if (showZona && zonas.length === 0) {
      setValue("zona_eleitoral_id", "");
    }
  }, [bairros.length, zonas.length, cidadeId, novoBairroNome, setValue, showBairro, showZona]);

  return (
    <>
      {showBairro && (
      <div className="space-y-2 sm:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">
            Bairro <span className="text-red-500">*</span>
          </span>
          {cidadeId && bairros.length > 0 && (
            <button
              type="button"
              className="shrink-0 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
              onClick={() => {
                setModoBairroNovo((v) => !v);
                setValue("bairro_id", "");
                setValue("novo_bairro_nome", "");
              }}
            >
              {modoBairroNovo ? "Usar lista" : "Novo bairro"}
            </button>
          )}
        </div>

        {!cidadeId ? (
          <p className="text-sm text-muted">Selecione o município primeiro.</p>
        ) : loadingBairros ? (
          <p className="text-sm text-muted">Carregando bairros...</p>
        ) : modoBairroNovo || bairros.length === 0 ? (
          <>
            <FormField
              label="Nome do bairro"
              required
              error={errors.novo_bairro_nome ?? errors.bairro_id}
              placeholder="Ex.: Centro, Vila Nova..."
              {...register("novo_bairro_nome")}
            />
            {bairros.length === 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Será cadastrado automaticamente ao salvar o eleitor.
              </p>
            )}
          </>
        ) : (
          <FormSelect
            label=""
            required
            error={errors.bairro_id}
            value={watch("bairro_id")}
            onChange={(e) => {
              setValue("bairro_id", e.target.value, { shouldValidate: true });
              setValue("novo_bairro_nome", "");
            }}
          >
            <option value="">Selecione o bairro</option>
            {bairros.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </FormSelect>
        )}
      </div>
      )}

      {showZona && (
      <div className="space-y-2 sm:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">Zona eleitoral</span>
          {cidadeId && zonas.length > 0 && (
            <button
              type="button"
              className="shrink-0 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
              onClick={() => {
                setModoZonaNova((v) => !v);
                setValue("zona_eleitoral_id", "");
                setValue("nova_zona_numero", undefined);
              }}
            >
              {modoZonaNova ? "Usar lista" : "Nova zona"}
            </button>
          )}
        </div>

        {!cidadeId ? (
          <p className="text-sm text-muted">Selecione o município na etapa de endereço primeiro.</p>
        ) : loadingZonas ? (
          <p className="text-sm text-muted">Carregando zonas...</p>
        ) : modoZonaNova ? (
          <FormField
            label="Número da zona"
            type="number"
            min={1}
            error={errors.nova_zona_numero ?? errors.zona_eleitoral_id}
            placeholder="Ex.: 100"
            hint="Opcional — pode preencher depois"
            {...register("nova_zona_numero", { valueAsNumber: true })}
          />
        ) : zonas.length === 0 ? (
          <p className="text-xs text-muted">
            Nenhuma zona cadastrada. Informe um número em &quot;Nova zona&quot; ou deixe em branco.
          </p>
        ) : (
          <FormSelect
            label=""
            error={errors.zona_eleitoral_id}
            value={watch("zona_eleitoral_id")}
            onChange={(e) => {
              setValue("zona_eleitoral_id", e.target.value, { shouldValidate: true });
              setValue("nova_zona_numero", undefined);
            }}
          >
            <option value="">Não informado</option>
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>
                Zona {z.numero}
              </option>
            ))}
          </FormSelect>
        )}
        {cidadeId && zonas.length > 0 && !modoZonaNova && (
          <button
            type="button"
            className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
            onClick={() => setModoZonaNova(true)}
          >
            Informar número de nova zona
          </button>
        )}
      </div>
      )}
    </>
  );
}
