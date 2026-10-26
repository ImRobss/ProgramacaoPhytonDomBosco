'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AREA_NAO_ESPECIFICADA,
  FILTROS_INICIAIS,
  filtrarVagas,
  filtrosDaUrl,
  filtrosParaUrl,
  formatarData,
  type Filtros,
  type Modalidade,
  type Nivel,
  NOME_AREA_NAO_ESPECIFICADA,
  NOMES_MODALIDADE,
  NOMES_NIVEL,
  NOMES_ORDEM,
  type Ordem,
  type Retrato,
  temFiltroAtivo,
  type Vaga,
} from '../../lib/vagas';
import { CHAVE_ULTIMA_LISTA, CHAVE_VEIO_DA_LISTA } from './BotaoVoltar';
import { Seletor } from './Seletor';
import {
  CAMPO,
  CARTAO,
  Etiqueta,
  EtiquetaArea,
  nomeModalidade,
  nomeNivel,
} from './ui';

export const TAMANHO_DA_PAGINA = 20;

const CHAVE_QUANTIDADE = 'lista-vagas:quantidade:';
const COLUNAS = 'md:grid-cols-[1fr_11rem_6.5rem_6.5rem_5.5rem]';

export function ListaVagas({ retrato }: { retrato: Retrato }) {
  const router = useRouter();
  const params = useSearchParams();
  const filtros = useMemo(
    () => filtrosDaUrl(new URLSearchParams(params.toString())),
    [params],
  );
  const consulta = filtrosParaUrl(filtros);

  // A busca tem estado próprio para o campo não "engasgar" enquanto a URL atualiza
  const [busca, setBusca] = useState(filtros.busca);

  const irPara = (proxima: Filtros) => {
    const query = filtrosParaUrl(proxima);
    router.replace(query ? `/?${query}` : '/', { scroll: false });
  };
  const atualizar = (parcial: Partial<Filtros>) =>
    irPara({ ...filtros, ...parcial });

  const visiveis = useMemo(
    () => filtrarVagas(retrato.vagas, filtros),
    [retrato.vagas, filtros],
  );
  // Termos que só trouxeram vagas descartadas (vendedor...) não servem de filtro aqui
  const termosComVagas = useMemo(
    () =>
      retrato.termos.filter((termo) =>
        retrato.vagas.some((v) => v.termo === termo && v.ti),
      ),
    [retrato],
  );
  const contar = (parcial: Partial<Filtros>) =>
    filtrarVagas(retrato.vagas, { ...filtros, ...parcial }).length;
  const quantidade = useQuantidadeCarregada(consulta);
  const exibidas = visiveis.slice(0, quantidade.valor);
  const temMais = exibidas.length < visiveis.length;
  const sentinela = useRolagemInfinita(
    temMais,
    exibidas.length,
    quantidade.carregarMais,
  );

  // O detalhe usa isso para voltar para esta mesma lista (veja BotaoVoltar)
  useEffect(() => {
    try {
      sessionStorage.setItem(
        CHAVE_ULTIMA_LISTA,
        consulta ? `/?${consulta}` : '/',
      );
    } catch {
      // Sem sessionStorage: o detalhe volta para "/"
    }
  }, [consulta]);

  return (
    <div className="flex flex-col gap-4">
      <div className={`${CARTAO} flex flex-col gap-3 p-4`}>
        <div className="flex flex-wrap items-start gap-2">
          <div className="flex min-w-0 flex-1 basis-72 flex-col gap-2">
            <div className="relative">
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400"
              >
                <circle
                  cx="7"
                  cy="7"
                  r="4.25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M10.5 10.5L14 14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <input
                type="search"
                placeholder="Buscar por título, empresa ou local"
                aria-label="Buscar vagas"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  atualizar({ busca: e.target.value });
                }}
                className={`${CAMPO} w-full pl-9`}
              />
            </div>
            <label className="flex w-fit items-center gap-2 px-1 text-xs text-zinc-500 select-none dark:text-zinc-400">
              <input
                type="checkbox"
                checked={filtros.naDescricao}
                onChange={(e) => atualizar({ naDescricao: e.target.checked })}
                className="size-3.5 accent-blue-600"
              />
              Buscar também na descrição completa
            </label>
          </div>
          <Seletor
            rotulo="Ordenar"
            valor={filtros.ordem}
            opcoes={NOMES_ORDEM}
            aoMudar={(v) =>
              atualizar({ ordem: (v ?? FILTROS_INICIAIS.ordem) as Ordem })
            }
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <Seletor
            rotulo="Área"
            valor={filtros.area}
            opcoes={{
              ...Object.fromEntries(retrato.areas.map((a) => [a, a])),
              [AREA_NAO_ESPECIFICADA]: NOME_AREA_NAO_ESPECIFICADA,
            }}
            vazio="Todas as áreas"
            contagem={(v) => contar({ area: v })}
            aoMudar={(v) => atualizar({ area: v })}
          />
          <Seletor
            rotulo="Nível"
            valor={filtros.nivel}
            opcoes={NOMES_NIVEL}
            vazio="Todos os níveis"
            contagem={(v) => contar({ nivel: v as Nivel | null })}
            aoMudar={(v) => atualizar({ nivel: v as Nivel | null })}
          />
          <Seletor
            rotulo="Modalidade"
            valor={filtros.modalidade}
            opcoes={NOMES_MODALIDADE}
            vazio="Todas as modalidades"
            contagem={(v) => contar({ modalidade: v as Modalidade | null })}
            aoMudar={(v) => atualizar({ modalidade: v as Modalidade | null })}
          />
          <Seletor
            rotulo="Termo de busca"
            valor={filtros.termo}
            opcoes={Object.fromEntries(termosComVagas.map((t) => [t, t]))}
            vazio="Todos os termos"
            contagem={(v) => contar({ termo: v })}
            aoMudar={(v) => atualizar({ termo: v })}
          />
          {temFiltroAtivo(filtros) && (
            <button
              onClick={() => {
                setBusca('');
                irPara({
                  ...FILTROS_INICIAIS,
                  ordem: filtros.ordem,
                  naDescricao: filtros.naDescricao,
                });
              }}
              className="ml-auto rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      <p
        aria-live="polite"
        className="text-sm text-zinc-500 dark:text-zinc-400"
      >
        {visiveis.length === 1
          ? '1 vaga encontrada'
          : `${visiveis.length} vagas encontradas`}
        {visiveis.length > 0 && ` · mostrando ${exibidas.length}`}
      </p>

      <div className={CARTAO}>
        <div
          aria-hidden="true"
          className={`hidden gap-4 border-b border-zinc-200 px-4 py-2 text-xs font-medium tracking-wide text-zinc-500 uppercase md:grid dark:border-zinc-800 dark:text-zinc-400 ${COLUNAS}`}
        >
          <span>Vaga</span>
          <span>Área</span>
          <span>Nível</span>
          <span>Modalidade</span>
          <span className="text-right">Publicada</span>
        </div>

        {visiveis.length === 0 ? (
          <p className="px-4 py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Nenhuma vaga com esses filtros.
          </p>
        ) : (
          <ul
            aria-label="Vagas"
            className="divide-y divide-zinc-200 dark:divide-zinc-800"
          >
            {exibidas.map((vaga) => (
              <LinhaVaga key={vaga.linkedin_id} vaga={vaga} />
            ))}
          </ul>
        )}

        {temMais && (
          <div
            ref={sentinela}
            className="border-t border-zinc-200 p-3 text-center dark:border-zinc-800"
          >
            <button
              onClick={quantidade.carregarMais}
              className="rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Carregar mais vagas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LinhaVaga({ vaga }: { vaga: Vaga }) {
  const nivel = nomeNivel(vaga);
  const modalidade = nomeModalidade(vaga);
  const traco = (
    <span className="hidden text-zinc-400 md:inline dark:text-zinc-600">—</span>
  );

  return (
    <li>
      <Link
        href={`/vagas/${vaga.linkedin_id}`}
        onClick={() => marcarQueVeioDaLista(vaga.linkedin_id)}
        className={`grid gap-x-4 gap-y-2 px-4 py-3 hover:bg-zinc-50 md:items-center dark:hover:bg-zinc-800/50 ${COLUNAS}`}
      >
        <span className="min-w-0">
          <span className="block truncate font-medium">{vaga.titulo}</span>
          <span className="block truncate text-sm text-zinc-500 dark:text-zinc-400">
            {[vaga.empresa, vaga.local].filter(Boolean).join(' · ')}
          </span>
        </span>
        {/* No celular as colunas viram uma linha de etiquetas; no desktop, "contents" as devolve à grade */}
        <span className="flex flex-wrap items-center gap-1.5 md:contents">
          <span>
            <EtiquetaArea area={vaga.area} />
          </span>
          <span>{nivel ? <Etiqueta>{nivel}</Etiqueta> : traco}</span>
          <span>{modalidade ? <Etiqueta>{modalidade}</Etiqueta> : traco}</span>
          <span className="text-sm text-zinc-500 tabular-nums md:text-right dark:text-zinc-400">
            {formatarData(vaga.data)}
          </span>
        </span>
      </Link>
    </li>
  );
}

function marcarQueVeioDaLista(id: string) {
  try {
    sessionStorage.setItem(CHAVE_VEIO_DA_LISTA, id);
  } catch {
    // Sem sessionStorage: o botão de voltar só segue o link
  }
}

/**
 * Quantas vagas já foram carregadas na lista. Fica guardado na sessão por combinação de
 * filtros, para que ao voltar do detalhe a lista tenha o mesmo tamanho e o navegador consiga
 * restaurar a posição da rolagem.
 */
function useQuantidadeCarregada(consulta: string) {
  const [estado, setEstado] = useState({ consulta, valor: TAMANHO_DA_PAGINA });

  // Filtros mudaram: volta para a primeira página (ou para o que estava salvo na sessão)
  if (estado.consulta !== consulta) {
    setEstado({ consulta, valor: lerSessao(consulta) ?? TAMANHO_DA_PAGINA });
  }

  // Na montagem lê a sessão aqui, e não no useState, para o HTML do servidor bater com o do client
  useEffect(() => {
    const salvo = lerSessao(estado.consulta);
    if (salvo) setEstado((atual) => ({ ...atual, valor: salvo }));
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        CHAVE_QUANTIDADE + estado.consulta,
        String(estado.valor),
      );
    } catch {
      // Sem sessionStorage (modo privado, testes): só não lembra o tamanho da lista
    }
  }, [estado]);

  return {
    valor: estado.valor,
    carregarMais: () =>
      setEstado((atual) => ({
        ...atual,
        valor: atual.valor + TAMANHO_DA_PAGINA,
      })),
  };
}

function lerSessao(consulta: string): number | null {
  try {
    const salvo = Number(sessionStorage.getItem(CHAVE_QUANTIDADE + consulta));
    return salvo > 0 ? salvo : null;
  } catch {
    return null;
  }
}

/**
 * Chama carregarMais quando o fim da lista chega perto da tela (400px de folga).
 * O observador é recriado a cada lote: se o fim continuar visível depois de carregar,
 * ele dispara de novo e carrega o próximo.
 */
function useRolagemInfinita(
  ativo: boolean,
  carregadas: number,
  carregarMais: () => void,
) {
  const ref = useRef<HTMLDivElement>(null);
  const carregarMaisRef = useRef(carregarMais);

  useEffect(() => {
    carregarMaisRef.current = carregarMais;
  });

  useEffect(() => {
    const elemento = ref.current;
    if (!ativo || !elemento || typeof IntersectionObserver === 'undefined')
      return;

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) carregarMaisRef.current();
      },
      { rootMargin: '400px' },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [ativo, carregadas]);

  return ref;
}
