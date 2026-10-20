# Programação em Python — Dom Bosco

Repositório com os exercícios da disciplina de Programação C com foco em Python.

## Organização

```
code/
├── 001_aula/      # exercícios feitos em aula
├── exercicios/    # exercícios de revisão dos módulos
└── estudos/       # estudos livres, fora dos enunciados
Entrega_final/     # trabalho final da disciplina
```

Cada aula tem sua própria pasta em `code/`, numerada na ordem em que foi ministrada (ex: `code/001_aula/`). Dentro de cada pasta:

- `*.md` com o enunciado do exercício
- código-fonte da solução
- testes automatizados, quando aplicável
- um `README.md` explicando as decisões tomadas na implementação

Os exercícios de revisão ficam em `code/exercicios/NNN/`, cada um com o enunciado do módulo (`modulo_NN.md`) e a solução em `index.py`.

## Aulas

- [001_aula](code/001_aula/README.md) — Calculadora de Bhaskara

## Exercícios de revisão

| Nº | Módulo | Exercício |
|----|--------|-----------|
| [001](code/exercicios/001/) | 1 | Saudação personalizada |
| [002](code/exercicios/002/) | 2 | Calculadora das quatro operações |
| [003](code/exercicios/003/) | 2 | Formatação de saída com `sep` e `end` |
| [004](code/exercicios/004/) | 3 | Classificador de notas com listas |
| [005](code/exercicios/005/) | 3 | Analisador de números com loops e operações lógicas |

## Estudos

- [analizador-de-notas](code/estudos/analizador-de-notas/lista_e_for.py) — média de alunos usando listas e `for`
- [controle-de-gastos](code/estudos/controle-de-gastos/controle_de_gastos.py) — cadastro de gastos por categoria (em andamento)

## Entrega final

- [Entrega_final](Entrega_final/) — trabalho final da disciplina (em andamento)

## Como executar

Requer Python 3.

```bash
# rodar um exercício
python3 code/exercicios/001/index.py

# rodar os testes da aula 001
cd code/001_aula && python3 -m unittest test_bhaskara.py -v
```
