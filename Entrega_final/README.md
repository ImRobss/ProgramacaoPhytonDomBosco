# Entrega Final

Projeto final da disciplina de Programação em Python. Monorepo [Nx](https://nx.dev) com:

| Projeto | Pasta | Stack | Porta |
|---------|-------|-------|-------|
| `@entrega-final/client` | [apps/client](apps/client/) | Next.js (App Router) + React + TypeScript | 3000 |
| `@entrega-final/api` | [apps/api](apps/api/) | Python 3.12 + FastAPI, gerenciado com [uv](https://docs.astral.sh/uv/) | 8000 |

## Pré-requisitos

- Node.js 20+ e [pnpm](https://pnpm.io)
- [uv](https://docs.astral.sh/uv/getting-started/installation/), que instala o Python 3.12 e cria o `.venv` da API

## Primeiros passos

```bash
cp apps/api/.env.example apps/api/.env   # configuração da API
pnpm install          # dependências JS
pnpm nx install @entrega-final/api   # dependências Python (uv sync)
pnpm nx migrate @entrega-final/api   # cria as tabelas (precisa do Postgres do DATABASE_URL)
pnpm nx seed @entrega-final/api      # carrega as 9 áreas de apps/api/seeds/areas.json
pnpm dev              # sobe client e api juntos
```

O client consulta `GET /health` da API e mostra se ela está online. A URL da API vem de `NEXT_PUBLIC_API_URL` (veja [apps/client/.env.example](apps/client/.env.example)).

## Comandos

| Comando | O que faz |
|---------|-----------|
| `pnpm dev` | roda os dois projetos em modo desenvolvimento |
| `pnpm test` | testes (Jest no client, pytest na API) |
| `pnpm lint` | lint (ESLint no client, Ruff na API) |
| `pnpm build` | build de produção do client |
| `pnpm nx dev @entrega-final/api` | roda só a API |
| `pnpm nx migrate @entrega-final/api` | aplica as migrations do Alembic (`alembic upgrade head`) |
| `pnpm nx seed @entrega-final/api` | carrega as áreas no banco (pode rodar mais de uma vez) |
| `uv run python -m app.scraper.exportar ../client/src/data/vagas.json` (em `apps/api`) | busca as vagas no LinkedIn, classifica e baixa a descrição de cada uma para o painel do client |
| `uv run python -m app.scraper.exportar ../client/src/data/vagas.json --so-detalhes` (em `apps/api`) | só completa as descrições que faltam, sem refazer a busca (use depois de um 429) |
| `pnpm nx format @entrega-final/api` | formata o código Python com Ruff |
| `pnpm nx graph` | mostra o grafo de projetos |

## Estrutura

```
apps/
├── client/          # Next.js
│   ├── src/app/     # rotas (App Router)
│   └── specs/       # testes Jest
└── api/             # FastAPI
    ├── app/main.py  # aplicação e rotas
    ├── app/models.py # tabelas do SQLAlchemy
    ├── migrations/  # migrations do Alembic
    ├── seeds/       # dados iniciais (areas.json)
    ├── tests/       # testes pytest
    ├── pyproject.toml
    └── project.json # targets Nx (install, dev, start, migrate, seed, test, lint, format)
```

A API não tem plugin Nx próprio: os targets em `apps/api/project.json` usam `nx:run-commands` para chamar o `uv`. Assim, o Nx orquestra e faz cache dos testes e do lint do Python, como já faz com o client.
