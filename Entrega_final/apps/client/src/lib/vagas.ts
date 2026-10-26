// Formato do JSON gerado por `python -m app.scraper.exportar` (apps/api/app/scraper/exportar.py)

export type Nivel = 'estagio' | 'junior' | 'pleno' | 'senior' | 'especialista';
export type Modalidade = 'presencial' | 'hibrido' | 'remoto';

export interface Vaga {
  linkedin_id: string;
  titulo: string;
  empresa: string | null;
  local: string | null;
  data: string | null;
  link: string;
  termo: string;
  /** false = o classificador não viu sinal de TI no título: descartada, só na visão geral */
  ti: boolean;
  /** null = é de TI, mas o título não diz a área ("Estágio em TI") */
  area: string | null;
  nivel: Nivel | null;
  modalidade: Modalidade | null;
  /**
   * Página de detalhe da vaga no LinkedIn. Ausente = ainda não foi buscada;
   * null = o LinkedIn não devolveu descrição (vaga encerrada, por exemplo).
   */
  detalhe?: DetalheVaga | null;
}

export interface DetalheVaga {
  /** HTML já limpo pelo scraper: só p, br, strong, b, em, i, u, ul, ol e li, sem atributos */
  descricao_html: string;
  descricao_texto: string;
  /** "Nível de experiência", "Tipo de emprego", "Função", "Setores"... */
  criterios: { nome: string; valor: string }[];
  candidatos: string | null;
  publicada_ha: string | null;
}

export interface Retrato {
  gerado_em: string;
  local: string;
  termos: string[];
  areas: string[];
  vagas: Vaga[];
}

export const NOMES_NIVEL: Record<Nivel, string> = {
  estagio: 'Estágio',
  junior: 'Júnior',
  pleno: 'Pleno',
  senior: 'Sênior',
  especialista: 'Especialista',
};

export const NOMES_MODALIDADE: Record<Modalidade, string> = {
  presencial: 'Presencial',
  hibrido: 'Híbrido',
  remoto: 'Remoto',
};

/** Valor do filtro de área para as vagas de TI sem área definida */
export const AREA_NAO_ESPECIFICADA = 'nao-especificada';
export const NOME_AREA_NAO_ESPECIFICADA = 'Não especificada';

export type Ordem = 'recentes' | 'antigas' | 'titulo';

export const NOMES_ORDEM: Record<Ordem, string> = {
  recentes: 'Mais recentes',
  antigas: 'Mais antigas',
  titulo: 'Título (A–Z)',
};

export interface Filtros {
  busca: string;
  area: string | null;
  nivel: Nivel | null;
  modalidade: Modalidade | null;
  termo: string | null;
  ordem: Ordem;
  /** A busca também procura no texto completo da descrição */
  naDescricao: boolean;
}

export const FILTROS_INICIAIS: Filtros = {
  busca: '',
  area: null,
  nivel: null,
  modalidade: null,
  termo: null,
  ordem: 'recentes',
  naDescricao: false,
};

/** Minúsculas e sem acentos, para a busca achar "senior" em "Sênior". */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** Vagas que o classificador não reconheceu como TI. Aparecem só na visão geral. */
export function vagasDescartadas(vagas: Vaga[]): Vaga[] {
  return vagas.filter((vaga) => !vaga.ti);
}

/** Filtra e ordena as vagas de TI; as descartadas nunca entram. */
export function filtrarVagas(vagas: Vaga[], filtros: Filtros): Vaga[] {
  const busca = normalizar(filtros.busca.trim());

  const filtradas = vagas.filter((vaga) => {
    // Regra do painel: vaga descartada pelo classificador não aparece na lista de vagas,
    // só na visão geral
    if (!vaga.ti) return false;
    if (filtros.area === AREA_NAO_ESPECIFICADA) {
      if (vaga.area !== null) return false;
    } else if (filtros.area && vaga.area !== filtros.area) {
      return false;
    }
    if (filtros.nivel && vaga.nivel !== filtros.nivel) return false;
    if (filtros.modalidade && vaga.modalidade !== filtros.modalidade)
      return false;
    if (filtros.termo && vaga.termo !== filtros.termo) return false;
    if (!busca) return true;
    const campos = [vaga.titulo, vaga.empresa, vaga.local];
    if (filtros.naDescricao) campos.push(vaga.detalhe?.descricao_texto ?? null);
    const texto = normalizar(campos.filter(Boolean).join(' '));
    return texto.includes(busca);
  });

  return ordenar(filtradas, filtros.ordem);
}

function ordenar(vagas: Vaga[], ordem: Ordem): Vaga[] {
  const copia = [...vagas];
  if (ordem === 'titulo') {
    return copia.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
  }
  // Vagas sem data vão para o fim nas duas ordens por data
  const sinal = ordem === 'recentes' ? -1 : 1;
  return copia.sort((a, b) => {
    if (a.data === b.data) return 0;
    if (a.data === null) return 1;
    if (b.data === null) return -1;
    return a.data < b.data ? -sinal : sinal;
  });
}

// Os filtros ficam na URL (?area=Backend&nivel=senior) para sobreviverem à ida e volta do detalhe
// e para um link já abrir filtrado. Só os valores diferentes do padrão aparecem na URL.

function valorValido<T extends string>(
  valor: string | null,
  permitidos: readonly T[],
): T | null {
  return valor !== null && (permitidos as readonly string[]).includes(valor)
    ? (valor as T)
    : null;
}

export function filtrosDaUrl(params: URLSearchParams): Filtros {
  return {
    busca: params.get('busca') ?? '',
    area: params.get('area') || null,
    nivel: valorValido(
      params.get('nivel'),
      Object.keys(NOMES_NIVEL) as Nivel[],
    ),
    modalidade: valorValido(
      params.get('modalidade'),
      Object.keys(NOMES_MODALIDADE) as Modalidade[],
    ),
    termo: params.get('termo') || null,
    ordem:
      valorValido(params.get('ordem'), Object.keys(NOMES_ORDEM) as Ordem[]) ??
      FILTROS_INICIAIS.ordem,
    naDescricao: params.get('naDescricao') === '1',
  };
}

export function filtrosParaUrl(filtros: Filtros): string {
  const params = new URLSearchParams();
  for (const chave of Object.keys(FILTROS_INICIAIS) as (keyof Filtros)[]) {
    const valor = filtros[chave];
    if (valor && valor !== FILTROS_INICIAIS[chave]) {
      params.set(chave, valor === true ? '1' : String(valor));
    }
  }
  return params.toString();
}

/** Ordem e "buscar na descrição" sozinhos não mudam quais vagas aparecem. */
export function temFiltroAtivo(filtros: Filtros): boolean {
  const { ordem, naDescricao } = FILTROS_INICIAIS;
  return filtrosParaUrl({ ...filtros, ordem, naDescricao }) !== '';
}

export function buscarVaga(vagas: Vaga[], id: string): Vaga | undefined {
  return vagas.find((vaga) => vaga.linkedin_id === id);
}

/** Conta as vagas por um valor (área, nível...), na ordem dada e incluindo os que têm zero. */
export function contarPor<T>(
  vagas: Vaga[],
  valores: readonly T[],
  valorDaVaga: (vaga: Vaga) => T,
): { valor: T; total: number }[] {
  return valores.map((valor) => ({
    valor,
    total: vagas.filter((vaga) => valorDaVaga(vaga) === valor).length,
  }));
}

export function formatarData(iso: string | null): string | null {
  if (!iso) return null;
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}
