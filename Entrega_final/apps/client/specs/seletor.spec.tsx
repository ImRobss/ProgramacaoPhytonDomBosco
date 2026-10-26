import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Seletor } from '../src/components/admin/Seletor';

const NIVEIS = { junior: 'Júnior', pleno: 'Pleno', senior: 'Sênior' };

function SeletorControlado({ inicial = null }: { inicial?: string | null }) {
  const [valor, setValor] = useState<string | null>(inicial);
  return (
    <>
      <Seletor
        rotulo="Nível"
        valor={valor}
        opcoes={NIVEIS}
        vazio="Todos os níveis"
        contagem={(v) => (v === null ? 10 : v === 'senior' ? 0 : 5)}
        aoMudar={setValor}
      />
      <p data-testid="valor">{valor ?? 'nenhum'}</p>
    </>
  );
}

const botao = () => screen.getByRole('button', { name: /^Nível/ });
const valor = () => screen.getByTestId('valor').textContent;

describe('Seletor', () => {
  it('começa fechado e abre a lista ao clicar', () => {
    render(<SeletorControlado />);

    expect(screen.queryByRole('listbox')).toBeNull();
    fireEvent.click(botao());

    expect(screen.getByRole('listbox', { name: 'Nível' })).toBeTruthy();
    expect(screen.getAllByRole('option')).toHaveLength(4);
    expect(botao().getAttribute('aria-expanded')).toBe('true');
  });

  it('escolher uma opção muda o valor, fecha a lista e marca a escolhida', () => {
    render(<SeletorControlado />);

    fireEvent.click(botao());
    fireEvent.click(screen.getByRole('option', { name: /Pleno/ }));

    expect(valor()).toBe('pleno');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(botao().getAttribute('aria-label')).toBe('Nível: Pleno');

    fireEvent.click(botao());
    expect(
      screen
        .getByRole('option', { name: /Pleno/ })
        .getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('mostra a contagem de cada opção', () => {
    render(<SeletorControlado />);

    fireEvent.click(botao());

    expect(
      screen.getByRole('option', { name: 'Todos os níveis 10' }),
    ).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Sênior 0' })).toBeTruthy();
  });

  it('navega pelo teclado: setas, Enter e Esc', () => {
    render(<SeletorControlado />);

    fireEvent.keyDown(botao(), { key: 'ArrowDown' });
    const lista = screen.getByRole('listbox');
    const ativa = () =>
      document.getElementById(
        lista.getAttribute('aria-activedescendant') ?? '',
      );

    expect(ativa()?.textContent).toContain('Todos os níveis');
    fireEvent.keyDown(lista, { key: 'ArrowDown' });
    fireEvent.keyDown(lista, { key: 'ArrowDown' });
    expect(ativa()?.textContent).toContain('Pleno');
    fireEvent.keyDown(lista, { key: 'End' });
    expect(ativa()?.textContent).toContain('Sênior');

    fireEvent.keyDown(lista, { key: 'Enter' });
    expect(valor()).toBe('senior');
    expect(screen.queryByRole('listbox')).toBeNull();

    fireEvent.keyDown(botao(), { key: 'Enter' });
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(valor()).toBe('senior');
  });

  it('digitar uma letra pula para a opção que começa com ela', () => {
    render(<SeletorControlado />);

    fireEvent.click(botao());
    const lista = screen.getByRole('listbox');
    fireEvent.keyDown(lista, { key: 's' });
    fireEvent.keyDown(lista, { key: 'Enter' });

    expect(valor()).toBe('senior');
  });

  it('fecha ao clicar fora', () => {
    render(<SeletorControlado />);

    fireEvent.click(botao());
    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('o × aparece só com filtro escolhido e limpa o valor', () => {
    render(<SeletorControlado inicial="junior" />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Limpar filtro de nível' }),
    );

    expect(valor()).toBe('nenhum');
    expect(
      screen.queryByRole('button', { name: 'Limpar filtro de nível' }),
    ).toBeNull();
  });
});
