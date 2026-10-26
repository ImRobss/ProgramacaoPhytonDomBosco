import {
  AREA_NAO_ESPECIFICADA,
  buscarVaga,
  contarPor,
  FILTROS_INICIAIS,
  filtrarVagas,
  filtrosDaUrl,
  filtrosParaUrl,
  formatarData,
  normalizar,
  temFiltroAtivo,
  type Vaga,
  vagasDescartadas,
} from '../src/lib/vagas';

let proximoId = 1;

function vaga(parcial: Partial<Vaga>): Vaga {
  return {
    linkedin_id: String(proximoId++),
    titulo: 'Desenvolvedor',
    empresa: 'Acme',
    local: 'São Paulo, SP',
    data: '2026-10-22',
    link: 'https://br.linkedin.com/jobs/view/x-1',
    termo: 'dev',
    ti: true,
    area: 'Backend',
    nivel: null,
    modalidade: null,
    ...parcial,
  };
}

const VAGAS = [
  vaga({
    titulo: 'Desenvolvedor Python Sênior',
    nivel: 'senior',
    modalidade: 'remoto',
    data: '2026-10-01',
  }),
  vaga({
    titulo: 'Desenvolvedor React Pleno',
    area: 'Frontend',
    nivel: 'pleno',
    termo: 'front',
  }),
  vaga({
    titulo: 'Engenheiro de Dados',
    area: 'Dados',
    empresa: 'Dados SA',
    data: null,
  }),
  vaga({
    titulo: 'Analista Financeiro',
    ti: false,
    area: null,
    termo: 'financeiro',
    data: '2026-10-25',
  }),
];

const titulos = (vagas: Vaga[]) => vagas.map((v) => v.titulo);

describe('filtrarVagas', () => {
  it('nunca devolve as vagas descartadas', () => {
    expect(filtrarVagas(VAGAS, FILTROS_INICIAIS)).toHaveLength(3);
    expect(
      filtrarVagas(VAGAS, { ...FILTROS_INICIAIS, termo: 'financeiro' }),
    ).toHaveLength(0);
    expect(
      filtrarVagas(VAGAS, { ...FILTROS_INICIAIS, busca: 'financeiro' }),
    ).toHaveLength(0);
  });

  it('vaga de TI sem área definida aparece na lista', () => {
    const comGeral = [...VAGAS, vaga({ titulo: 'Estágio em TI', area: null })];

    expect(titulos(filtrarVagas(comGeral, FILTROS_INICIAIS))).toContain(
      'Estágio em TI',
    );
    expect(
      titulos(
        filtrarVagas(comGeral, {
          ...FILTROS_INICIAIS,
          area: AREA_NAO_ESPECIFICADA,
        }),
      ),
    ).toEqual(['Estágio em TI']);
    expect(titulos(vagasDescartadas(comGeral))).toEqual([
      'Analista Financeiro',
    ]);
  });

  it('as descartadas ficam separadas para a visão geral', () => {
    expect(titulos(vagasDescartadas(VAGAS))).toEqual(['Analista Financeiro']);
  });

  it('filtra por área, nível, modalidade e termo de busca', () => {
    expect(
      filtrarVagas(VAGAS, { ...FILTROS_INICIAIS, area: 'Frontend' }),
    ).toHaveLength(1);
    expect(
      filtrarVagas(VAGAS, { ...FILTROS_INICIAIS, nivel: 'senior' }),
    ).toHaveLength(1);
    expect(
      filtrarVagas(VAGAS, { ...FILTROS_INICIAIS, modalidade: 'remoto' }),
    ).toHaveLength(1);
    expect(
      filtrarVagas(VAGAS, { ...FILTROS_INICIAIS, termo: 'front' }),
    ).toHaveLength(1);
    expect(
      filtrarVagas(VAGAS, {
        ...FILTROS_INICIAIS,
        area: 'Frontend',
        nivel: 'senior',
      }),
    ).toHaveLength(0);
  });

  it('busca no título, empresa e local sem diferenciar acentos e maiúsculas', () => {
    expect(
      filtrarVagas(VAGAS, { ...FILTROS_INICIAIS, busca: 'senior' }),
    ).toHaveLength(1);
    expect(
      filtrarVagas(VAGAS, { ...FILTROS_INICIAIS, busca: 'dados sa' }),
    ).toHaveLength(1);
    expect(
      filtrarVagas(VAGAS, { ...FILTROS_INICIAIS, busca: 'SAO PAULO' }),
    ).toHaveLength(3);
  });

  it('ordena por data, com as vagas sem data no fim', () => {
    expect(
      titulos(filtrarVagas(VAGAS, { ...FILTROS_INICIAIS, ordem: 'recentes' })),
    ).toEqual([
      'Desenvolvedor React Pleno',
      'Desenvolvedor Python Sênior',
      'Engenheiro de Dados',
    ]);
    expect(
      titulos(filtrarVagas(VAGAS, { ...FILTROS_INICIAIS, ordem: 'antigas' })),
    ).toEqual([
      'Desenvolvedor Python Sênior',
      'Desenvolvedor React Pleno',
      'Engenheiro de Dados',
    ]);
  });

  it('ordena por título', () => {
    expect(
      titulos(filtrarVagas(VAGAS, { ...FILTROS_INICIAIS, ordem: 'titulo' })),
    ).toEqual([
      'Desenvolvedor Python Sênior',
      'Desenvolvedor React Pleno',
      'Engenheiro de Dados',
    ]);
  });
});

describe('busca na descrição', () => {
  const comDescricao = [
    vaga({
      titulo: 'Desenvolvedor Backend',
      detalhe: {
        descricao_html: '<p>Usamos Docker e Kubernetes</p>',
        descricao_texto: 'Usamos Docker e Kubernetes',
        criterios: [],
        candidatos: null,
        publicada_ha: null,
      },
    }),
    vaga({ titulo: 'Desenvolvedor Java' }),
  ];

  it('só procura na descrição quando a opção está ligada', () => {
    const filtros = { ...FILTROS_INICIAIS, busca: 'docker' };

    expect(filtrarVagas(comDescricao, filtros)).toHaveLength(0);
    expect(
      titulos(filtrarVagas(comDescricao, { ...filtros, naDescricao: true })),
    ).toEqual(['Desenvolvedor Backend']);
  });

  it('vai e volta pela URL', () => {
    const filtros = { ...FILTROS_INICIAIS, busca: 'docker', naDescricao: true };

    expect(filtrosParaUrl(filtros)).toBe('busca=docker&naDescricao=1');
    expect(
      filtrosDaUrl(new URLSearchParams('busca=docker&naDescricao=1')),
    ).toEqual(filtros);
  });

  it('sozinha não conta como filtro ativo', () => {
    expect(temFiltroAtivo({ ...FILTROS_INICIAIS, naDescricao: true })).toBe(
      false,
    );
  });
});

describe('filtros na URL', () => {
  it('a URL fica vazia com os filtros padrão', () => {
    expect(filtrosParaUrl(FILTROS_INICIAIS)).toBe('');
  });

  it('ida e volta pela URL preserva os filtros', () => {
    const filtros = {
      ...FILTROS_INICIAIS,
      area: 'Segurança da Informação',
      nivel: 'senior' as const,
      busca: 'cyber',
      ordem: 'titulo' as const,
    };

    expect(filtrosDaUrl(new URLSearchParams(filtrosParaUrl(filtros)))).toEqual(
      filtros,
    );
  });

  it('ignora valores inválidos na URL', () => {
    const filtros = filtrosDaUrl(
      new URLSearchParams('nivel=chefe&situacao=x&ordem=y'),
    );

    expect(filtros).toEqual(FILTROS_INICIAIS);
  });

  it('ordem sozinha não conta como filtro ativo', () => {
    expect(temFiltroAtivo({ ...FILTROS_INICIAIS, ordem: 'titulo' })).toBe(
      false,
    );
    expect(temFiltroAtivo({ ...FILTROS_INICIAIS, area: 'Dados' })).toBe(true);
  });
});

describe('utilitários', () => {
  it('conta por um campo na ordem dada, incluindo valores sem vagas', () => {
    expect(
      contarPor(VAGAS, ['Backend', 'Mobile', null], (v) => v.area),
    ).toEqual([
      { valor: 'Backend', total: 1 },
      { valor: 'Mobile', total: 0 },
      { valor: null, total: 1 },
    ]);
  });

  it('busca uma vaga pelo id', () => {
    expect(buscarVaga(VAGAS, VAGAS[2].linkedin_id)?.titulo).toBe(
      'Engenheiro de Dados',
    );
    expect(buscarVaga(VAGAS, 'nao-existe')).toBeUndefined();
  });

  it('normaliza acentos e maiúsculas', () => {
    expect(normalizar('Sênior Híbrido')).toBe('senior hibrido');
  });

  it('formata a data no padrão brasileiro', () => {
    expect(formatarData('2026-10-22')).toBe('22/10/2026');
    expect(formatarData(null)).toBeNull();
  });
});
