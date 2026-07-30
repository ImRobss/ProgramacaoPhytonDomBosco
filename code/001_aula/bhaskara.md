# EXERCÍCIO PRÁTICO: CALCULADORA DE BHASKARA

Desenvolver um programa em Python que calcule as raízes de uma equação do 2º grau utilizando a **fórmula de Bhaskara**. O programa deve receber os coeficientes **a**, **b** e **c** fornecidos pelo usuário, calcular o discriminante (**Δ**) e, com base no seu valor, determinar as raízes reais da equação (quando existirem).

---

## CONCEITOS MATEMÁTICOS — REVISÃO

Uma equação do 2º grau tem a forma geral:

$$ax² + bx + c = 0$$

Onde:

- **a**, **b** e **c** são números reais chamados de **coeficientes**
- **a ≠ 0** (se a = 0, a equação não é do 2º grau)

Para resolver essa equação, utilizamos a **fórmula de Bhaskara**:

**Passo 1 — Calcular o discriminante (Delta):**

$$Δ = b² - 4ac$$

**Passo 2 — Calcular as raízes:**

$$x = \frac{-b \pm \sqrt{Δ}}{2a}$$

---

## 3. REGRAS DE NEGÓCIO

O programa deve analisar o valor de Delta e agir de acordo com as seguintes regras:

| Condição  | Significado                                  | Ação do programa               |
| --------- | -------------------------------------------- | ------------------------------ |
| **Δ > 0** | Duas raízes reais **diferentes**             | Calcular e exibir x₁ e x₂      |
| **Δ = 0** | Duas raízes **iguais** (uma única raiz real) | Calcular e exibir o valor de x |
| **Δ < 0** | **Nenhuma** raiz real                        | Exibir mensagem informativa    |
| **a = 0** | Não é equação de 2º grau                     | Exibir mensagem de erro        |

---

## REQUISITOS TÉCNICOS

### a) Entrada de dados

- Solicitar ao usuário os valores de **a**, **b** e **c** usando `input()`
- Converter os valores para `float` (podem ser números decimais)

### b) Processamento

- Calcular Delta usando a fórmula: `delta = b**2 - 4*a*c`
- Utilizar `if`/`elif`/`else` para verificar o valor de Delta
- Calcular as raízes usando a fórmula de Bhaskara
- Para a raiz quadrada, usar `delta ** 0.5` ou `math.sqrt(delta)`

### c) Saída de dados

- Exibir a equação digitada de forma clara
- Exibir o valor de Delta calculado
- Exibir as raízes encontradas (quando existirem)
- Arredondar resultados para **2 casas decimais** com `round()`

### d) Tratamento de casos especiais

- Verificar se `a = 0` e exibir erro
- Verificar se Delta é negativo e exibir mensagem apropriada

---
