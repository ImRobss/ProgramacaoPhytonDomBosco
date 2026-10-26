import { CARTAO, GraficoBarras, Indicador } from '../../components/admin/ui';
import { geradoEm, retrato } from '../../lib/dados';
import {
  AREA_NAO_ESPECIFICADA,
  contarPor,
  filtrosParaUrl,
  formatarData,
  FILTROS_INICIAIS,
  type Filtros,
  type Modalidade,
  type Nivel,
  NOME_AREA_NAO_ESPECIFICADA,
  NOMES_MODALIDADE,
  NOMES_NIVEL,
  type Vaga,
  vagasDescartadas,
} from '../../lib/vagas';

export const metadata = { title: 'Visão geral · Admin' };

function linkDaLista(parcial: Partial<Filtros>): string {
  const query = filtrosParaUrl({ ...FILTROS_INICIAIS, ...parcial });
  return query ? `/?${query}` : '/';
}

export default function VisaoGeral() {
  const vagas = retrato.vagas;
  const deTi = vagas.filter((v) => v.ti);
  const descartadas = vagas.length - deTi.length;
  const porcentagem = (parte: number, todo: number) =>
    todo === 0 ? '0%' : `${Math.round((parte / todo) * 100)}%`;

  const porArea = contarPor(deTi, [...retrato.areas, null], (v) => v.area);
  const niveis = [...(Object.keys(NOMES_NIVEL) as Nivel[]), null];
  const porNivel = contarPor(deTi, niveis, (v) => v.nivel);
  const modalidades = [
    ...(Object.keys(NOMES_MODALIDADE) as Modalidade[]),
    null,
  ];
  const porModalidade = contarPor(deTi, modalidades, (v) => v.modalidade);
  const porTermo = contarPor(vagas, retrato.termos, (v) => v.termo);
  const comNivel = deTi.filter((v) => v.nivel !== null).length;
  const comDescricao = vagas.filter((v) => v.detalhe).length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Números da coleta de {geradoEm}. Clique numa barra para ver as vagas
          na lista.
        </p>
      </div>

      <section
        aria-label="Indicadores"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <Indicador
          rotulo="Vagas coletadas"
          valor={vagas.length}
          detalhe={`${comDescricao} com descrição completa · ${retrato.termos.length} termos`}
        />
        <Indicador
          rotulo="De TI"
          valor={deTi.length}
          detalhe={`${porcentagem(deTi.length, vagas.length)} do total`}
        />
        <Indicador
          rotulo="Descartadas"
          valor={descartadas}
          detalhe={`${porcentagem(descartadas, vagas.length)} do total`}
        />
        <Indicador
          rotulo="Com nível identificado"
          valor={porcentagem(comNivel, deTi.length)}
          detalhe={`${comNivel} de ${deTi.length} vagas de TI`}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <GraficoBarras
          titulo="Vagas de TI por área"
          itens={porArea.map(({ valor, total }) => ({
            rotulo: valor ?? NOME_AREA_NAO_ESPECIFICADA,
            total,
            href: linkDaLista({ area: valor ?? AREA_NAO_ESPECIFICADA }),
          }))}
        />
        <GraficoBarras
          titulo="Vagas coletadas por termo de busca"
          descricao="Inclui as descartadas: vendedor e analista financeiro testam o classificador."
          itens={porTermo.map(({ valor, total }) => ({
            rotulo: valor,
            total,
            // Termo que só trouxe descartadas não tem nada na lista de vagas: vai para a seção abaixo
            href: deTi.some((v) => v.termo === valor)
              ? linkDaLista({ termo: valor })
              : '#descartadas',
          }))}
        />
        <GraficoBarras
          titulo="Vagas de TI por nível"
          itens={porNivel.map(({ valor, total }) => ({
            rotulo: valor ? NOMES_NIVEL[valor] : 'Não identificado',
            total,
            href: valor ? linkDaLista({ nivel: valor }) : linkDaLista({}),
          }))}
        />
        <GraficoBarras
          titulo="Vagas de TI por modalidade"
          itens={porModalidade.map(({ valor, total }) => ({
            rotulo: valor ? NOMES_MODALIDADE[valor] : 'Não identificada',
            total,
            href: valor ? linkDaLista({ modalidade: valor }) : linkDaLista({}),
          }))}
        />
      </div>

      <Descartadas vagas={vagasDescartadas(vagas)} />
    </div>
  );
}

/** As vagas que o classificador não reconheceu como TI. Só aparecem aqui, nunca em Vagas. */
function Descartadas({ vagas }: { vagas: Vaga[] }) {
  return (
    <section id="descartadas" className={`${CARTAO} scroll-mt-20`}>
      <div className="p-4 sm:p-6">
        <h2 className="text-base font-semibold">
          Vagas descartadas{' '}
          <span className="ml-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 tabular-nums dark:bg-amber-950 dark:text-amber-300">
            {vagas.length}
          </span>
        </h2>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          O classificador não achou nenhum sinal de TI no título (nem área, nem
          termos como TI, tecnologia, desenvolvedor ou software). Elas ficam de
          fora da página Vagas e aparecem só aqui, para conferir se o descarte
          foi certo.
        </p>
      </div>

      {vagas.length === 0 ? (
        <p className="border-t border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500 sm:px-6 dark:border-zinc-800 dark:text-zinc-400">
          Nenhuma vaga foi descartada nesta coleta.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 border-t border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {vagas.map((vaga) => (
            <li
              key={vaga.linkedin_id}
              className="grid gap-x-4 gap-y-1 px-4 py-3 sm:px-6 md:grid-cols-[1fr_12rem_5.5rem_auto] md:items-center"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {vaga.titulo}
                </span>
                <span className="block truncate text-sm text-zinc-500 dark:text-zinc-400">
                  {[vaga.empresa, vaga.local].filter(Boolean).join(' · ')}
                </span>
              </span>
              <span className="truncate text-sm text-zinc-600 dark:text-zinc-400">
                <span className="text-zinc-400 md:hidden dark:text-zinc-500">
                  Busca:{' '}
                </span>
                {vaga.termo}
              </span>
              <span className="text-sm text-zinc-500 tabular-nums dark:text-zinc-400">
                {formatarData(vaga.data)}
              </span>
              <a
                href={vaga.link}
                target="_blank"
                rel="noreferrer"
                className="w-fit text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                LinkedIn <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
