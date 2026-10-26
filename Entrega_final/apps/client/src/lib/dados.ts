import dados from '../data/vagas.json';
import type { Retrato } from './vagas';

export const retrato = dados as Retrato;

export const geradoEm = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
}).format(new Date(retrato.gerado_em));
