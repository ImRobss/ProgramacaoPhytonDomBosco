# Calculadora de Bhaskara — Decisões de Implementação

Este exercício está descrito em [bhaskara.md](bhaskara.md). Aqui documento as decisões tomadas durante o desenvolvimento e por quê.

## 1ª versão: tudo em um único `main()`

A primeira versão concentrava tudo em uma única função `main()`: pedir os valores de `a`, `b` e `c` com `input()`, calcular o delta e as raízes, e já imprimir o resultado na tela. Funcionava, mas tinha um problema na hora de validar: para conferir se os 4 casos (delta > 0, delta = 0, delta < 0 e a = 0) estavam corretos, era preciso rodar o programa manualmente e digitar valores toda vez, um teste de cada vez.

## Por que separar cálculo de interação

Para validar os 4 casos de forma automática (sem digitar valores toda hora), o código precisava ser testável. O obstáculo era que `main()` misturava três responsabilidades:

1. Ler valores do usuário (`input()`)
2. Calcular o delta e as raízes
3. Exibir o resultado (`print()`)

Uma função que depende de `input()` não pode ser chamada por um teste automatizado (o teste não tem como "digitar" nada), e uma função que só faz `print()` não devolve nada para o teste comparar.

A solução foi extrair a lógica de cálculo para uma função pura, `calcular_bhaskara(a, b, c)`, que:

- recebe `a`, `b`, `c` como parâmetros (em vez de ler via `input()`)
- não imprime nada
- devolve uma tupla `(caso, resultado)`, identificando qual das 4 situações ocorreu

O `main()` ficou responsável só pela interação: pedir os valores ao usuário, chamar `calcular_bhaskara()` e decidir o que mostrar na tela com base no `caso` retornado.

## Testes automatizados

Com o cálculo isolado em uma função pura, ficou possível escrever testes com `unittest` (biblioteca padrão do Python, sem dependências externas) cobrindo as 4 regras de negócio definidas em [bhaskara.md](bhaskara.md):

| Caso                | Exemplo usado no teste | Resultado esperado          |
| ------------------- | ---------------------- | ---------------------------- |
| `a = 0`              | `calcular_bhaskara(0, 2, 3)`  | `("erro", ...)`         |
| `delta < 0`          | `calcular_bhaskara(1, 1, 1)`  | `("sem_raiz", None)`    |
| `delta = 0`          | `calcular_bhaskara(1, 2, 1)`  | `("uma_raiz", -1.0)`    |
| `delta > 0`          | `calcular_bhaskara(1, -5, 6)` | `("duas_raizes", (3.0, 2.0))` |

Os testes estão em [test_bhaskara.py](test_bhaskara.py) e podem ser executados com:

```
python -m unittest test_bhaskara.py -v
```

Essa divisão (cálculo puro + interação separada) é o padrão comum em Python para tornar um script testável sem precisar simular entrada de teclado.