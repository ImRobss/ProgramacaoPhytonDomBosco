turma = [
    {'nome': 'João', 'notas': [7.5, 8.0, 6.5]},
    {'nome': 'Maria', 'notas': [9.0, 8.5, 7.0]},
    {'nome': 'Pedro', 'notas': [6.0, 7.5, 8.0]},
]

for aluno in turma:
    media = sum(aluno['notas']) / len(aluno['notas'])
    print(f"A média do aluno {aluno['nome']} é: {media:.2f}")

#melhorando o codigo com o imput do usuario

def calcular_media(notas_inputadas):
    return sum(notas_inputadas) / len(notas_inputadas)

def ler_notas():
    turma = []
    while True:
            nome = input("Digite o nome do aluno (ou 'sair' para encerrar): ")
            if nome.lower() == 'sair':
                return turma
            notas = []
            for i in range(3):
                while True:
                    entrada = input(f"Digite a nota {i + 1} de {nome}: ")
                    try:
                        nota = float(entrada)
                    except ValueError:
                        print("Valor inválido. Digite apenas números.")
                        continue
                    if nota < 0 or nota > 10:
                        print("Nota inválida. Digite uma nota entre 0 e 10.")
                        continue
                    break
                notas.append(nota)
            turma.append({'nome': nome, 'notas': notas})

def verificar_notas(aluno):
    media = calcular_media(aluno['notas'])
    if media < 7:
        return "reprovado"
    else:
        return "aprovado"

def main():
    turma = ler_notas()
    aprovados = 0
    for aluno in turma:
        media = calcular_media(aluno['notas'])
        status = verificar_notas(aluno)
        if status == "aprovado":
            aprovados += 1
        print(f"{aluno['nome']}: {status} (média: {media:.2f})")
    print(f"{aprovados} de {len(turma)} aprovados")

if __name__ == "__main__":
    main()
  