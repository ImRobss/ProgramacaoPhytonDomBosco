import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusApi } from '../src/components/StatusApi';

describe('StatusApi', () => {
  it('mostra a API como online quando o /health responde', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as jest.Mock;

    render(<StatusApi />);

    expect(await screen.findByText('online')).toBeTruthy();
  });

  it('mostra a API como offline quando a requisição falha', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('down')) as jest.Mock;

    render(<StatusApi />);

    expect(await screen.findByText('offline')).toBeTruthy();
  });
});
