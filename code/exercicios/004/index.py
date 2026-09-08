def quant_alunos():
  while True:
    try:
      n = int(input("Digite o número de alunos: "))
      if n <= 0:
        print("Por favor, digite um número positivo.")
        continue
      return n
    except ValueError:
      print("Entrada inválida.")

def ler_notas(n):
  turma = []
  for _ in range(n):
    nome = str(input("Digite o nome do aluno: "))
    notas = []
    for i in range(3):
      while True:
        entrada = input(f"Digite a {i + 1}º nota de {nome}: ")
        try:
          nota = float(entrada)
        except ValueError:
          print("Nota invalida.")
          continue
        if nota < 0 or nota > 10:
          print("Nota invalida.")
          continue
        break
      notas.append(nota)
    turma.append({'nome': nome, 'notas': notas})
  return turma


def calcular_media(n):
  return sum(n) / len(n)

def verificar_aprovados(aluno):
  media = calcular_media(aluno['notas'])
  if media >= 7:
    return "aprovado"
  elif media >= 5:
    return "recuperação"
  else:
    return "reprovado"

def nota_dez(aluno):
  if 10 in aluno['notas']:
    return f"Parabens {aluno['nome']} tirou nota 10."

def main():
  n = quant_alunos()
  turma = ler_notas(n)
  for aluno in turma:
    media = calcular_media(aluno['notas'])
    status = verificar_aprovados(aluno)
    print(f"{aluno['nome']}: {status} (média: {media:.2f})")
    mensagem = nota_dez(aluno)
    if mensagem is not None and status == "aprovado":
      print(mensagem)


if __name__ == "__main__":
  main()
