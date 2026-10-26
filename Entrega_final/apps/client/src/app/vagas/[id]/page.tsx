import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BotaoVoltar } from '../../../components/admin/BotaoVoltar';
import {
  CARTAO,
  Etiqueta,
  EtiquetaArea,
  nomeModalidade,
  nomeNivel,
} from '../../../components/admin/ui';
import { retrato } from '../../../lib/dados';
import { buscarVaga, formatarData, type Vaga } from '../../../lib/vagas';

// Uma página estática por vaga de TI; descartadas e ids desconhecidos dão 404.
// As descartadas aparecem só na visão geral.
export const dynamicParams = false;

const vagasDeTi = retrato.vagas.filter((vaga) => vaga.ti);

export function generateStaticParams() {
  return vagasDeTi.map((vaga) => ({ id: vaga.linkedin_id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const vaga = buscarVaga(vagasDeTi, (await params).id);
  return { title: vaga ? `${vaga.titulo} · Admin` : 'Vaga não encontrada' };
}

export default async function PaginaVaga({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const vaga = buscarVaga(vagasDeTi, (await params).id);
  if (!vaga) notFound();

  const parecidas = vagasDeTi
    .filter(
      (outra) =>
        outra.linkedin_id !== vaga.linkedin_id && outra.area === vaga.area,
    )
    .slice(0, 5);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <BotaoVoltar />

      <header className={`${CARTAO} flex flex-col gap-4 p-5 sm:p-6`}>
        <div className="flex flex-wrap gap-1.5">
          <EtiquetaArea area={vaga.area} />
          {nomeNivel(vaga) && <Etiqueta>{nomeNivel(vaga)}</Etiqueta>}
          {nomeModalidade(vaga) && <Etiqueta>{nomeModalidade(vaga)}</Etiqueta>}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            {vaga.titulo}
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            {[vaga.empresa, vaga.local].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={vaga.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Abrir no LinkedIn
          </a>
          {vaga.data && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Publicada em {formatarData(vaga.data)}
              {vaga.detalhe?.publicada_ha &&
                ` (${vaga.detalhe.publicada_ha.toLowerCase()})`}
            </span>
          )}
          {vaga.detalhe?.candidatos && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              · {vaga.detalhe.candidatos}
            </span>
          )}
        </div>
      </header>

      <SobreAVaga vaga={vaga} />

      <div className="grid gap-6 md:grid-cols-2">
        <section className={`${CARTAO} p-5 sm:p-6`}>
          <h2 className="text-base font-semibold">Classificação</h2>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Calculada pelo classificador a partir do título e do local.
          </p>
          <dl className="mt-4">
            <Campo rotulo="Área">
              {vaga.area ?? (
                <span className="text-zinc-500 dark:text-zinc-400">
                  Não especificada — é de TI, mas o título não diz a área
                </span>
              )}
            </Campo>
            <Campo rotulo="Nível">
              {nomeNivel(vaga) ?? <NaoIdentificado />}
            </Campo>
            <Campo rotulo="Modalidade">
              {nomeModalidade(vaga) ?? <NaoIdentificado />}
            </Campo>
          </dl>
        </section>

        <section className={`${CARTAO} p-5 sm:p-6`}>
          <h2 className="text-base font-semibold">Coleta</h2>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Como esta vaga chegou até aqui.
          </p>
          <dl className="mt-4">
            <Campo rotulo="Termo de busca">
              <Link
                href={`/?termo=${encodeURIComponent(vaga.termo)}`}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                “{vaga.termo}”
              </Link>
            </Campo>
            <Campo rotulo="Local da busca">{retrato.local}</Campo>
            <Campo rotulo="ID no LinkedIn">
              <code className="font-mono text-sm">{vaga.linkedin_id}</code>
            </Campo>
          </dl>
        </section>
      </div>

      <section className={`${CARTAO} p-5 sm:p-6`}>
        <h2 className="text-base font-semibold">Dados do scraper</h2>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          Os campos exatamente como o parser extraiu do HTML do LinkedIn.
        </p>
        <dl className="mt-4">
          <Campo rotulo="linkedin_id">{vaga.linkedin_id}</Campo>
          <Campo rotulo="titulo">{vaga.titulo}</Campo>
          <Campo rotulo="empresa">{vaga.empresa ?? <Vazio />}</Campo>
          <Campo rotulo="local">{vaga.local ?? <Vazio />}</Campo>
          <Campo rotulo="data">{vaga.data ?? <Vazio />}</Campo>
          <Campo rotulo="link">
            <a
              href={vaga.link}
              target="_blank"
              rel="noreferrer"
              className="break-all text-blue-600 hover:underline dark:text-blue-400"
            >
              {decodeURI(vaga.link)}
            </a>
          </Campo>
          {vaga.detalhe && (
            <>
              <Campo rotulo="detalhe.candidatos">
                {vaga.detalhe.candidatos ?? <Vazio />}
              </Campo>
              <Campo rotulo="detalhe.publicada_ha">
                {vaga.detalhe.publicada_ha ?? <Vazio />}
              </Campo>
              <Campo rotulo="detalhe.criterios">
                {vaga.detalhe.criterios.length} critério(s)
              </Campo>
              <Campo rotulo="detalhe.descricao">
                {vaga.detalhe.descricao_texto.length.toLocaleString('pt-BR')}{' '}
                caracteres
              </Campo>
            </>
          )}
        </dl>

        <details className="mt-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <summary className="cursor-pointer px-4 py-2 text-sm font-medium select-none">
            Ver JSON completo
          </summary>
          <pre className="overflow-x-auto border-t border-zinc-200 bg-zinc-50 p-4 font-mono text-xs leading-relaxed dark:border-zinc-800 dark:bg-zinc-950">
            {JSON.stringify(vaga, null, 2)}
          </pre>
        </details>
      </section>

      {parecidas.length > 0 && (
        <section className={`${CARTAO} p-5 sm:p-6`}>
          <h2 className="text-base font-semibold">
            {vaga.area
              ? `Outras vagas de ${vaga.area}`
              : 'Outras vagas de TI sem área definida'}
          </h2>
          <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
            {parecidas.map((outra) => (
              <ItemParecida key={outra.linkedin_id} vaga={outra} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SobreAVaga({ vaga }: { vaga: Vaga }) {
  if (!vaga.detalhe) {
    return (
      <section className={`${CARTAO} p-5 sm:p-6`}>
        <h2 className="text-base font-semibold">Sobre a vaga</h2>
        {vaga.detalhe === null ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            O LinkedIn não devolveu a descrição desta vaga. Ela pode ter sido
            encerrada ou removida.
          </p>
        ) : (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            A descrição ainda não foi coletada. Em <code>apps/api</code>, rode{' '}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
              uv run python -m app.scraper.exportar
              ../client/src/data/vagas.json --so-detalhes
            </code>
          </p>
        )}
      </section>
    );
  }

  const { detalhe } = vaga;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <section className={`${CARTAO} p-5 sm:p-6`}>
        <h2 className="text-base font-semibold">Sobre a vaga</h2>
        <div
          className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3 [&_strong]:font-semibold [&_strong]:text-zinc-900 dark:[&_strong]:text-zinc-100 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
          // O scraper já limpou este HTML: só tags de texto e listas, sem nenhum atributo
          // (veja limpar_descricao em apps/api/app/scraper/parser.py)
          dangerouslySetInnerHTML={{ __html: detalhe.descricao_html }}
        />
      </section>

      <aside className={`${CARTAO} h-fit p-5 lg:sticky lg:top-20`}>
        <h2 className="text-base font-semibold">Informações do LinkedIn</h2>
        {detalhe.criterios.length > 0 ? (
          <dl className="mt-3 flex flex-col gap-3">
            {detalhe.criterios.map((criterio) => (
              <div key={criterio.nome}>
                <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                  {criterio.nome}
                </dt>
                <dd className="text-sm font-medium">{criterio.valor}</dd>
              </div>
            ))}
            {detalhe.candidatos && (
              <div>
                <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                  Candidaturas
                </dt>
                <dd className="text-sm font-medium">{detalhe.candidatos}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            O LinkedIn não informou critérios para esta vaga.
          </p>
        )}
      </aside>
    </div>
  );
}

function Campo({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 border-t border-zinc-100 py-2.5 first:border-t-0 sm:grid-cols-[9rem_1fr] sm:gap-4 dark:border-zinc-800">
      <dt className="text-sm text-zinc-500 dark:text-zinc-400">{rotulo}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  );
}

function NaoIdentificado() {
  return (
    <span className="text-zinc-400 dark:text-zinc-500">
      Não identificado no título
    </span>
  );
}

function Vazio() {
  return <span className="text-zinc-400 dark:text-zinc-500">vazio (null)</span>;
}

function ItemParecida({ vaga }: { vaga: Vaga }) {
  return (
    <li>
      <Link
        href={`/vagas/${vaga.linkedin_id}`}
        className="-mx-2 flex items-center justify-between gap-4 rounded-md px-2 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">
            {vaga.titulo}
          </span>
          <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
            {[vaga.empresa, vaga.local].filter(Boolean).join(' · ')}
          </span>
        </span>
        <span className="shrink-0 text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
          {formatarData(vaga.data)}
        </span>
      </Link>
    </li>
  );
}
