# Exercícios de Revisão do Módulo 3

## Fundamentos de Python

### Objetivo

Este exercício tem como objetivo sedimentar os conteúdos aprendidos no módulo 3 do curso de Python.

### Entrega

Cada aluno deve postar no GitHub ou em uma pasta no Drive devidamente compartilhada com o professor.

### Exercício 5 — Analisador de Números com Loops e Operações Lógicas

**Enunciado:**

Crie um programa que analise uma lista de números inteiros digitados pelo usuário. O programa deve:

- Pedir ao usuário para digitar números até que ele digite "fim" (use um loop `while`);
- Guardar os números em uma lista (converta com `int()`);
- Usando `break` e `continue`:
  - Pule (com `continue`) os números negativos ao somar;
  - Pare o programa (com `break`) se o usuário digitar o número 0;
- Calcule e imprima:
  - A soma dos números positivos (usando `continue` para pular negativos);
  - A quantidade de números pares e ímpares (use o operador `%`);
  - A média dos números (use `sum()` e `len()`);
- Use `range()` com 3 argumentos para imprimir os números da lista em ordem decrescente (do último para o primeiro).
