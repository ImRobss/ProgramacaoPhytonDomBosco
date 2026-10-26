'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITENS = [
  {
    href: '/',
    rotulo: 'Vagas',
    ativo: (rota: string) => rota === '/' || rota.startsWith('/vagas'),
  },
  {
    href: '/visao-geral',
    rotulo: 'Visão geral',
    ativo: (rota: string) => rota === '/visao-geral',
  },
];

export function MenuLateral() {
  const rota = usePathname() ?? '/';

  return (
    <nav aria-label="Menu principal" className="flex gap-1 md:flex-col">
      {ITENS.map((item) => {
        const ativo = item.ativo(rota);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? 'page' : undefined}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              ativo
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
            }`}
          >
            {item.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
