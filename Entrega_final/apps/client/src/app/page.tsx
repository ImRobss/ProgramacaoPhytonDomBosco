import { Suspense } from 'react';
import { ListaVagas } from '../components/admin/ListaVagas';
import { retrato } from '../lib/dados';

export default function Index() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vagas</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Tudo o que o scraper coletou, já classificado por área, nível e
          modalidade. Clique numa vaga para ver os detalhes.
        </p>
      </div>
      {/* useSearchParams exige um Suspense em volta para a página continuar estática */}
      <Suspense>
        <ListaVagas retrato={retrato} />
      </Suspense>
    </div>
  );
}
