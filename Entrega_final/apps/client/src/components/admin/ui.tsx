import Link from 'next/link';
import { NOMES_MODALIDADE, NOMES_NIVEL, type Vaga } from '../../lib/vagas';

export const CARTAO =
  'rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900';

export const CAMPO =
  'rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100';

const BASE_ETIQUETA =
  'inline-flex rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap';

/** Área da vaga de TI; sem área definida mostra "TI geral". */
export function EtiquetaArea({ area }: { area: string | null }) {
  return area ? (
    <span
      className={`${BASE_ETIQUETA} bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300`}
    >
      {area}
    </span>
  ) : (
    <span
      title="É de TI, mas o título não diz a área"
      className={`${BASE_ETIQUETA} border border-dashed border-blue-200 text-blue-700 dark:border-blue-900 dark:text-blue-300`}
    >
      TI geral
    </span>
  );
}

export function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={`${BASE_ETIQUETA} bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300`}
    >
      {children}
    </span>
  );
}

export function nomeNivel(vaga: Vaga): string | null {
  return vaga.nivel ? NOMES_NIVEL[vaga.nivel] : null;
}

export function nomeModalidade(vaga: Vaga): string | null {
  return vaga.modalidade ? NOMES_MODALIDADE[vaga.modalidade] : null;
}

export function Indicador({
  rotulo,
  valor,
  detalhe,
}: {
  rotulo: string;
  valor: number | string;
  detalhe?: string;
}) {
  return (
    <div className={`${CARTAO} p-4`}>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{rotulo}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{valor}</p>
      {detalhe && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {detalhe}
        </p>
      )}
    </div>
  );
}

/** Barras horizontais de uma série só; cada barra é um link para a lista já filtrada. */
export function GraficoBarras({
  titulo,
  descricao,
  itens,
}: {
  titulo: string;
  descricao?: string;
  itens: { rotulo: string; total: number; href: string }[];
}) {
  const maximo = Math.max(1, ...itens.map((i) => i.total));

  return (
    <section className={`${CARTAO} p-4 sm:p-6`}>
      <h2 className="text-base font-semibold">{titulo}</h2>
      {descricao && (
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          {descricao}
        </p>
      )}
      <ul className="mt-4 flex flex-col gap-0.5">
        {itens.map(({ rotulo, total, href }) => (
          <li key={rotulo}>
            <Link
              href={href}
              title={`${rotulo}: ${total} vaga${total === 1 ? '' : 's'}. Ver na lista.`}
              className="grid grid-cols-[minmax(6rem,11rem)_1fr] items-center gap-3 rounded-md px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <span className="truncate text-sm text-zinc-700 dark:text-zinc-300">
                {rotulo}
              </span>
              <span className="flex items-center gap-2">
                {total > 0 && (
                  <span
                    className="h-3.5 rounded-r bg-[#2a78d6] dark:bg-[#3987e5]"
                    style={{
                      width: `calc((100% - 2.5rem) * ${total / maximo})`,
                    }}
                  />
                )}
                <span className="text-sm tabular-nums text-zinc-900 dark:text-zinc-100">
                  {total}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
