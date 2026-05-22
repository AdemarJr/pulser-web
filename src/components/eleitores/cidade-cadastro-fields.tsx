"use client";

import { FormSelect } from "@/components/forms/form-field";
import type { FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import type { EleitorFormInput } from "@/lib/validators/eleitor";

type Props = {
  estados: { id: string; nome: string; sigla: string }[];
  municipiosCadastro: { id: string; nome: string }[];
  estadoCadastroId: string;
  cidadeCadastroId: string;
  errors: FieldErrors<EleitorFormInput>;
  watch: UseFormWatch<EleitorFormInput>;
  setValue: UseFormSetValue<EleitorFormInput>;
  onEstadoCadastroChange: (estadoId: string) => void;
  eleitorNoMesmoMunicipio: boolean;
  onEleitorNoMesmoMunicipioChange: (checked: boolean) => void;
  lembrarCidadePadrao: boolean;
  onLembrarCidadePadraoChange: (checked: boolean) => void;
  showLembrarPadrao: boolean;
};

export function CidadeCadastroFields({
  estados,
  municipiosCadastro,
  estadoCadastroId,
  cidadeCadastroId,
  errors,
  setValue,
  onEstadoCadastroChange,
  eleitorNoMesmoMunicipio,
  onEleitorNoMesmoMunicipioChange,
  lembrarCidadePadrao,
  onLembrarCidadePadraoChange,
  showLembrarPadrao,
}: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Informe em qual município você está realizando este cadastro (pode ser diferente do
        endereço do eleitor).
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelect
          label="UF do cadastro"
          required
          error={errors.cidade_cadastro_id}
          value={estadoCadastroId}
          onChange={(e) => onEstadoCadastroChange(e.target.value)}
        >
          <option value="">Selecione</option>
          {estados.map((s) => (
            <option key={s.id} value={s.id}>
              {s.sigla} — {s.nome}
            </option>
          ))}
        </FormSelect>

        <FormSelect
          label="Município do cadastro"
          required
          error={errors.cidade_cadastro_id}
          disabled={!estadoCadastroId}
          value={cidadeCadastroId}
          onChange={(e) => {
            const id = e.target.value;
            setValue("cidade_cadastro_id", id, { shouldValidate: true });
            const m = municipiosCadastro.find((x) => x.id === id);
            if (eleitorNoMesmoMunicipio && id) {
              setValue("estado_id", estadoCadastroId, { shouldValidate: true });
              setValue("cidade_id", id, { shouldValidate: true });
              setValue("municipio_eleitoral", m?.nome ?? "", { shouldValidate: true });
            }
          }}
        >
          <option value="">Selecione</option>
          {municipiosCadastro.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </FormSelect>
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={eleitorNoMesmoMunicipio}
          onChange={(e) => onEleitorNoMesmoMunicipioChange(e.target.checked)}
          className="mt-0.5"
        />
        <span className="text-muted">
          O eleitor reside neste município (copiar para endereço e dados eleitorais)
        </span>
      </label>

      {showLembrarPadrao && (
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={lembrarCidadePadrao}
            onChange={(e) => onLembrarCidadePadraoChange(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-muted">
            Usar este município como padrão nos próximos cadastros
          </span>
        </label>
      )}
    </div>
  );
}
