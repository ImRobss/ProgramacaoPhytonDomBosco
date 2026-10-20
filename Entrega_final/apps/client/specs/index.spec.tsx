import React from 'react';
import { render, screen } from '@testing-library/react';
import Page from '../src/app/page';

describe('Page', () => {
  it('mostra a API como online quando o /health responde', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as jest.Mock;

    render(<Page />);

    expect(await screen.findByText('online')).toBeTruthy();
  });

  it('mostra a API como offline quando a requisição falha', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('down')) as jest.Mock;

    render(<Page />);

    expect(await screen.findByText('offline')).toBeTruthy();
  });
});
