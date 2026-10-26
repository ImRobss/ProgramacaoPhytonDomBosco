import './global.css';
import { MenuLateral } from '../components/admin/MenuLateral';
import { StatusApi } from '../components/StatusApi';
import { geradoEm, retrato } from '../lib/dados';

export const metadata = {
  title: 'Admin · Vagas de TI',
  description:
    'Painel de controle das vagas coletadas pelo scraper do LinkedIn',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-zinc-100 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <div className="md:grid md:min-h-screen md:grid-cols-[14rem_1fr]">
          <aside className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-zinc-200 bg-zinc-50 px-4 py-3 md:h-screen md:flex-col md:items-stretch md:justify-start md:border-r md:border-b-0 md:py-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="md:mb-6 md:px-3">
              <p className="text-sm font-semibold tracking-tight">
                Vagas de TI
              </p>
              <p className="hidden text-xs text-zinc-500 md:block dark:text-zinc-400">
                Painel do scraper
              </p>
            </div>
            <MenuLateral />
          </aside>

          <div className="min-w-0">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 md:px-8 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Coleta do LinkedIn ({retrato.local}) em{' '}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {geradoEm}
                </span>
                {' · '}
                {retrato.vagas.length} vagas
              </p>
              <StatusApi />
            </header>
            <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
