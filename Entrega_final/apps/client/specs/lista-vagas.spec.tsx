import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import {
  ListaVagas,
  TAMANHO_DA_PAGINA,
} from '../src/components/admin/ListaVagas';
import type { Retrato, Vaga } from '../src/lib/vagas';

// Simula a URL do Next: router.replace muda a query e useSearchParams re-renderiza
const mockNavegacao = { query: '', ouvintes: new Set<() => void>() };

jest.mock('next/navigation', () => {
  const { useMemo, useSyncExternalStore } = jest.requireActual('react');
  return {
    useRouter: () => ({
      replace: (url: string) => {
        mockNavegacao.query = url.split('?')[1] ?? '';
        mockNavegacao.ouvintes.forEach((avisar) => avisar());
      },
      back: jest.fn(),
    }),
    useSearchParams: () => {
      const query = useSyncExternalStore(
        (avisar: () => void) => {
          mockNavegacao.ouvintes.add(avisar);
          return () => mockNavegacao.ouvintes.delete(avisar);
        },
        () => mockNavegacao.query,
      );
      return useMemo(() => new URLSearchParams(query), [query]);
    },
    usePathname: () => '/',
  };
});

// O jsdom não tem IntersectionObserver; este guarda os observadores para o teste disparar
let observadores: {
  callback: IntersectionObserverCallback;
  elementos: Element[];
}[] = [];

class IntersectionObserverFalso {
  elementos: Element[] = [];
  constructor(public callback: IntersectionObserverCallback) {
    observadores.push(this);
  }
  observe(elemento: Element) {
    this.elementos.push(elemento);
  }
  disconnect() {
    observadores = observadores.filter((o) => o !== this);
  }
}

function rolarAteOFim() {
  act(() => {
    for (const o of [...observadores]) {
      o.callback(
        o.elementos.map((target) => ({
          isIntersecting: true,
          target,
        })) as IntersectionObserverEntry[],
        o as unknown as IntersectionObserver,
      );
    }
  });
}

function vaga(i: number, parcial: Partial<Vaga> = {}): Vaga {
  return {
    linkedin_id: String(1000 + i),
    titulo: `Desenvolvedor Python ${i}`,
    empresa: 'Acme',
    local: 'Recife, PE',
    // Datas decrescentes: a vaga 0 é a mais recente
    data: `2026-10-${String(28 - (i % 28)).padStart(2, '0')}`,
    link: `https://br.linkedin.com/jobs/view/x-${1000 + i}`,
    termo: 'dev',
    ti: true,
    area: 'Backend',
    nivel: null,
    modalidade: null,
    ...parcial,
  };
}

const RETRATO: Retrato = {
  gerado_em: '2026-10-26T16:00:00+00:00',
  local: 'Brazil',
  termos: ['dev', 'vendedor'],
  areas: ['Backend', 'Frontend'],
  vagas: [
    ...Array.from({ length: 22 }, (_, i) => vaga(i)),
    vaga(22, {
      titulo: 'Desenvolvedor React Sênior',
      area: 'Frontend',
      nivel: 'senior',
    }),
    vaga(23, {
      titulo: 'Vendedor de Veículos',
      ti: false,
      area: null,
      termo: 'vendedor',
    }),
  ],
};

const linhas = () =>
  within(screen.getByRole('list', { name: 'Vagas' })).getAllByRole('link');

beforeEach(() => {
  mockNavegacao.query = '';
  observadores = [];
  sessionStorage.clear();
  global.IntersectionObserver =
    IntersectionObserverFalso as unknown as typeof IntersectionObserver;
});

describe('ListaVagas', () => {
  it('mostra a primeira página das vagas de TI', () => {
    render(<ListaVagas retrato={RETRATO} />);

    expect(linhas()).toHaveLength(TAMANHO_DA_PAGINA);
    expect(
      screen.getByText('23 vagas encontradas · mostrando 20'),
    ).toBeTruthy();
    expect(screen.queryByText('Vendedor de Veículos')).toBeNull();
  });

  it('carrega mais vagas ao rolar até o fim e para quando acabam', () => {
    render(<ListaVagas retrato={RETRATO} />);

    rolarAteOFim();

    expect(linhas()).toHaveLength(23);
    expect(
      screen.queryByRole('button', { name: 'Carregar mais vagas' }),
    ).toBeNull();
  });

  it('o botão carrega mais vagas quando a rolagem não dispara', () => {
    render(<ListaVagas retrato={RETRATO} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Carregar mais vagas' }),
    );

    expect(linhas()).toHaveLength(23);
  });

  it('cada vaga leva para a sua página de detalhe', () => {
    render(<ListaVagas retrato={RETRATO} />);

    expect(linhas()[0].getAttribute('href')).toBe('/vagas/1000');
  });

  it('filtrar põe o filtro na URL e volta para a primeira página', () => {
    render(<ListaVagas retrato={RETRATO} />);
    rolarAteOFim();

    fireEvent.click(screen.getByRole('button', { name: /^Área/ }));
    fireEvent.click(screen.getByRole('option', { name: /Frontend/ }));

    expect(mockNavegacao.query).toBe('area=Frontend');
    expect(linhas()).toHaveLength(1);
    expect(screen.getByText('Desenvolvedor React Sênior')).toBeTruthy();
  });

  it('o dropdown mostra quantas vagas cada opção traria', () => {
    render(<ListaVagas retrato={RETRATO} />);

    fireEvent.click(screen.getByRole('button', { name: /^Área/ }));

    expect(
      screen.getByRole('option', { name: 'Todas as áreas 23' }),
    ).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Backend 22' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Frontend 1' })).toBeTruthy();
  });

  it('o × do filtro limpa só aquele filtro', () => {
    mockNavegacao.query = 'area=Frontend&nivel=senior';
    render(<ListaVagas retrato={RETRATO} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Limpar filtro de nível' }),
    );

    expect(mockNavegacao.query).toBe('area=Frontend');
  });

  it('abre já filtrada pela URL', () => {
    mockNavegacao.query = 'area=Frontend';

    render(<ListaVagas retrato={RETRATO} />);

    expect(linhas()).toHaveLength(1);
    expect(screen.getByText('Desenvolvedor React Sênior')).toBeTruthy();
  });

  it('nunca mostra as vagas descartadas, nem pela URL antiga', () => {
    mockNavegacao.query = 'situacao=descartadas';

    render(<ListaVagas retrato={RETRATO} />);

    expect(
      screen.getByText('23 vagas encontradas · mostrando 20'),
    ).toBeTruthy();
    expect(screen.queryByText('Vendedor de Veículos')).toBeNull();
    expect(screen.queryByText('Descartada')).toBeNull();
  });

  it('termo que só trouxe descartadas não aparece no filtro', () => {
    render(<ListaVagas retrato={RETRATO} />);

    fireEvent.click(screen.getByRole('button', { name: /^Termo de busca/ }));

    expect(screen.getByRole('option', { name: /^dev/ })).toBeTruthy();
    expect(screen.queryByRole('option', { name: /vendedor/ })).toBeNull();
  });

  it('busca pelo texto e limpa os filtros', () => {
    render(<ListaVagas retrato={RETRATO} />);

    fireEvent.change(screen.getByLabelText('Buscar vagas'), {
      target: { value: 'react' },
    });
    expect(linhas()).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(mockNavegacao.query).toBe('');
    expect(
      (screen.getByLabelText('Buscar vagas') as HTMLInputElement).value,
    ).toBe('');
    expect(linhas()).toHaveLength(TAMANHO_DA_PAGINA);
  });

  it('avisa quando nenhuma vaga bate com os filtros', () => {
    render(<ListaVagas retrato={RETRATO} />);

    fireEvent.change(screen.getByLabelText('Buscar vagas'), {
      target: { value: 'cobol' },
    });

    expect(screen.getByText('Nenhuma vaga com esses filtros.')).toBeTruthy();
  });

  it('lembra quantas vagas estavam carregadas ao voltar do detalhe', () => {
    const { unmount } = render(<ListaVagas retrato={RETRATO} />);
    rolarAteOFim();
    unmount();

    render(<ListaVagas retrato={RETRATO} />);

    expect(linhas()).toHaveLength(23);
  });
});
