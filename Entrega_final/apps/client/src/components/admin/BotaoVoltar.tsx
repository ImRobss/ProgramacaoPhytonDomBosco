'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Gravadas pela ListaVagas: a última URL da lista e o id da vaga aberta a partir dela
export const CHAVE_VEIO_DA_LISTA = 'lista-vagas:veio-da-lista';
export const CHAVE_ULTIMA_LISTA = 'lista-vagas:ultima-url';

/**
 * Volta para a lista com os mesmos filtros. Se esta vaga foi aberta pela lista, usa o histórico
 * do navegador, que também devolve a posição da rolagem. Senão (link aberto direto, ou vindo de
 * outra vaga), vai para a última lista vista nesta aba, ou para "/".
 */
export function BotaoVoltar() {
  const router = useRouter();
  const idAtual = usePathname()?.split('/').pop();
  const [destino, setDestino] = useState('/');

  useEffect(() => {
    try {
      setDestino(sessionStorage.getItem(CHAVE_ULTIMA_LISTA) ?? '/');
    } catch {
      // Sem sessionStorage: volta para "/"
    }
  }, []);

  return (
    <Link
      href={destino}
      onClick={(e) => {
        let veioDaLista = false;
        try {
          veioDaLista = sessionStorage.getItem(CHAVE_VEIO_DA_LISTA) === idAtual;
          sessionStorage.removeItem(CHAVE_VEIO_DA_LISTA);
        } catch {
          // Sem sessionStorage: segue o link normalmente
        }
        if (veioDaLista) {
          e.preventDefault();
          router.back();
        }
      }}
      className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      <span aria-hidden="true">←</span> Voltar para a lista
    </Link>
  );
}
