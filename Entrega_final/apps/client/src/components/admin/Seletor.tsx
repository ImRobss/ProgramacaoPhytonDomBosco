'use client';

import { useEffect, useId, useRef, useState } from 'react';

interface Opcao {
  valor: string | null;
  nome: string;
}

/**
 * Dropdown de filtro no lugar do <select> nativo, cuja lista aberta não aceita estilo.
 * Segue o padrão ARIA "listbox": setas, Home/End, Enter, Esc e digitar a inicial de uma opção.
 */
export function Seletor({
  rotulo,
  valor,
  opcoes,
  vazio,
  contagem,
  aoMudar,
}: {
  rotulo: string;
  valor: string | null;
  opcoes: Record<string, string>;
  /** Texto da opção "sem filtro"; sem ele o campo sempre tem um valor escolhido */
  vazio?: string;
  /** Quantas vagas cada opção mostraria, com os outros filtros mantidos */
  contagem?: (valor: string | null) => number;
  aoMudar: (valor: string | null) => void;
}) {
  const id = useId();
  const [aberto, setAberto] = useState(false);
  const [ativa, setAtiva] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLUListElement>(null);

  const itens: Opcao[] = [
    ...(vazio ? [{ valor: null, nome: vazio }] : []),
    ...Object.entries(opcoes).map(([chave, nome]) => ({ valor: chave, nome })),
  ];
  const selecionada = itens.find((item) => item.valor === valor);
  const filtrando = Boolean(vazio) && valor !== null;

  function abrir() {
    setAtiva(
      Math.max(
        0,
        itens.findIndex((item) => item.valor === valor),
      ),
    );
    setAberto(true);
  }

  function fechar(devolverFoco = true) {
    setAberto(false);
    if (devolverFoco) botao.current?.focus();
  }

  function escolher(item: Opcao) {
    aoMudar(item.valor);
    fechar();
  }

  // Abriu: foca a lista para as setas funcionarem. Fecha ao clicar fora.
  useEffect(() => {
    if (!aberto) return;
    lista.current?.focus();
    const aoClicarFora = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) fechar(false);
    };
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, [aberto]);

  // Mantém a opção ativa visível quando a lista tem rolagem
  useEffect(() => {
    if (aberto)
      document
        .getElementById(`${id}-${ativa}`)
        ?.scrollIntoView?.({ block: 'nearest' });
  }, [aberto, ativa, id]);

  function aoTeclarNaLista(e: React.KeyboardEvent) {
    const ultima = itens.length - 1;
    const mover: Record<string, number> = {
      ArrowDown: Math.min(ultima, ativa + 1),
      ArrowUp: Math.max(0, ativa - 1),
      Home: 0,
      End: ultima,
    };
    if (e.key in mover) {
      e.preventDefault();
      setAtiva(mover[e.key]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      escolher(itens[ativa]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      fechar();
    } else if (e.key === 'Tab') {
      fechar(false);
    } else if (e.key.length === 1) {
      // Pula para a próxima opção que começa com a letra digitada
      const letra = e.key.toLowerCase();
      const ordem = [...itens.slice(ativa + 1), ...itens.slice(0, ativa + 1)];
      const achada = ordem.find((item) =>
        item.nome.toLowerCase().startsWith(letra),
      );
      if (achada) setAtiva(itens.indexOf(achada));
    }
  }

  return (
    <div ref={raiz} className="relative">
      <div
        className={`flex items-center rounded-lg border text-sm transition-colors ${
          filtrando
            ? 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-200'
            : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600'
        } ${aberto ? 'ring-2 ring-blue-500/20' : ''}`}
      >
        <button
          ref={botao}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={aberto}
          aria-controls={`${id}-lista`}
          aria-label={`${rotulo}: ${selecionada?.nome ?? ''}`}
          onClick={() => (aberto ? fechar() : abrir())}
          onKeyDown={(e) => {
            if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
              e.preventDefault();
              abrir();
            }
          }}
          className="flex items-center gap-1.5 rounded-lg py-2 pr-2.5 pl-3 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span
            className={
              filtrando
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-zinc-500 dark:text-zinc-400'
            }
          >
            {rotulo}
            {(filtrando || !vazio) && ':'}
          </span>
          {(filtrando || !vazio) && (
            <span className="max-w-40 truncate font-medium">
              {selecionada?.nome}
            </span>
          )}
          <Chevron aberto={aberto} />
        </button>
        {filtrando && (
          <button
            type="button"
            aria-label={`Limpar filtro de ${rotulo.toLowerCase()}`}
            onClick={() => aoMudar(null)}
            className="mr-1 -ml-1 rounded-md p-1 text-blue-500 outline-none hover:bg-blue-100 hover:text-blue-800 focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 dark:hover:bg-blue-900 dark:hover:text-blue-100"
          >
            <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {aberto && (
        <ul
          ref={lista}
          id={`${id}-lista`}
          role="listbox"
          tabIndex={-1}
          aria-label={rotulo}
          aria-activedescendant={`${id}-${ativa}`}
          onKeyDown={aoTeclarNaLista}
          className="rolagem-flutuante absolute left-0 z-30 mt-1.5 max-h-80 min-w-56 overflow-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg shadow-zinc-900/10 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40"
        >
          {itens.map((item, indice) => {
            const escolhida = item.valor === valor;
            const total = contagem?.(item.valor);
            return (
              <li
                key={item.valor ?? ''}
                id={`${id}-${indice}`}
                role="option"
                aria-selected={escolhida}
                onMouseEnter={() => setAtiva(indice)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => escolher(item)}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm ${
                  indice === ativa ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                } ${
                  escolhida
                    ? 'font-medium text-blue-700 dark:text-blue-300'
                    : 'text-zinc-700 dark:text-zinc-300'
                } ${total === 0 && !escolhida ? 'opacity-50' : ''}`}
              >
                <span className="flex w-4 justify-center" aria-hidden="true">
                  {escolhida && (
                    <svg viewBox="0 0 16 16" className="size-4">
                      <path
                        d="M3.5 8.5l3 3 6-7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="flex-1 whitespace-nowrap">{item.nome}</span>
                {total !== undefined && (
                  <span className="ml-4 rounded-full bg-zinc-100 px-1.5 text-xs text-zinc-500 tabular-nums dark:bg-zinc-800 dark:text-zinc-400">
                    {total}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Chevron({ aberto }: { aberto: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={`size-4 opacity-60 transition-transform ${aberto ? 'rotate-180' : ''}`}
    >
      <path
        d="M4 6l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
