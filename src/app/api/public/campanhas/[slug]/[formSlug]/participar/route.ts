import { jsonError, jsonOk } from "@/lib/api/response";
import { getClientIp, hashIp } from "@/lib/portal/ip-hash";
import {
  concluirParticipacao,
  getFormularioPublico,
  iniciarParticipacao,
} from "@/lib/portal/public-service";
import { participacaoSubmitSchema } from "@/lib/validators/portal";

type Params = { params: Promise<{ slug: string; formSlug: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { slug, formSlug } = await params;
    const dados = await getFormularioPublico(slug, formSlug);
    if (!dados) return jsonError("Formulário não encontrado", 404);

    const body = await request.json();
    const parsed = participacaoSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos");
    }

    const ipHash = hashIp(getClientIp(request));
    const { token } = await iniciarParticipacao(dados.formulario.id, ipHash);

    const resultado = await concluirParticipacao(
      token,
      parsed.data.respostas,
      parsed.data.metadata
    );

    return jsonOk({
      token,
      pontuacao: resultado.pontuacao,
      tipo: resultado.tipo,
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Erro ao enviar", 500);
  }
}
