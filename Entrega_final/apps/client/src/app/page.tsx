'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

type Status = 'carregando' | 'online' | 'offline';

export default function Index() {
  const [status, setStatus] = useState<Status>('carregando');

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => setStatus(res.ok ? 'online' : 'offline'))
      .catch(() => setStatus('offline'));
  }, []);

  return (
    <main className={styles.page}>
      <h1>Entrega Final</h1>
      <p>
        API: <strong data-testid="api-status">{status}</strong>
      </p>
    </main>
  );
}
