def calculo_mais (vlr1, vlr2):
   calc = vlr1 + vlr2
   return calc

def calculo_menos (vlr1, vlr2):
   calc = vlr1 - vlr2
   return calc

def calculo_vezes (vlr1, vlr2):
   calc = vlr1 * vlr2
   return calc

def calculo_divisao (vlr1, vlr2):
   if vlr2 == 0:
       return "Erro: Divisão por zero não é permitida."
   calc = vlr1 / vlr2
   return calc
    
def main ():
    vlr1 = float(input("Digite o primeiro valor: "))
    vlr2 = float(input("Digite o segundo valor: "))

    try: 
      while True:
        opcao = int(input("Escolha a operação:\n1 - Soma\n2 - Subtração\n3 - Multiplicação\n4 - Divisão\nDigite o número da operação: "))
        if opcao < 1 or opcao > 4:
            print("Opção inválida. Digite um número entre 1 e 4.")
            continue
        match opcao:
            case 1:
                resultado = calculo_mais(vlr1, vlr2)
                print(f"A soma de {vlr1} e {vlr2} é: {resultado}")
            case 2:
                resultado = calculo_menos(vlr1, vlr2)
                print(f"A subtração de {vlr1} e {vlr2} é: {resultado}")
            case 3:
                resultado = calculo_vezes(vlr1, vlr2)
                print(f"A multiplicação de {vlr1} e {vlr2} é: {resultado}")
            case 4:
                resultado = calculo_divisao(vlr1, vlr2)
                print(f"A divisão de {vlr1} e {vlr2} é: {resultado}")
        break 
    except ValueError:
        print("Entrada inválida. Digite um número.")
        return

if __name__ == "__main__":
    main()  