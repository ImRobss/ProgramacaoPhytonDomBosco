'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

type Status = 'carregando' | 'online' | 'offline';

const COR_DO_PONTO: Record<Status, string> = {
  carregando: 'bg-zinc-400',
  online: 'bg-emerald-500',
  offline: 'bg-red-500',
};

export function StatusApi() {
  const [status, setStatus] = useState<Status>('carregando');

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => setStatus(res.ok ? 'online' : 'offline'))
      .catch(() => setStatus('offline'));
  }, []);

  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
      <span
        className={`size-2 rounded-full ${COR_DO_PONTO[status]}`}
        aria-hidden="true"
      />
      API:{' '}
      <strong
        data-testid="api-status"
        className="font-semibold text-zinc-900 dark:text-zinc-100"
      >
        {status}
      </strong>
    </p>
  );
}
