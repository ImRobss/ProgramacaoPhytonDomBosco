def ler_numero():
    lista = []
    while True:
        try:
            entrada = input("Digite um número ou 'fim' para sair: ")
            if entrada == "fim":
                break
            n = int(entrada)
            lista.append(n)
        except ValueError:
            print("Entrada inválida. Por favor, digite um número inteiro.")
    return lista

def soma_lista(lista):
    soma = 0
    for n in lista:
        if n < 0:
            continue
        soma += n
    return soma

def quantidade_par(lista):
    par = 0
    for n in lista:
        if n % 2 == 0:
            par += 1
    return par

def quantidade_impar(lista):  
    impar = 0
    for n in lista:
        if n % 2 != 0:
            impar += 1
    return impar

def media_lista(lista):
    if len(lista) == 0:
        return 0
    return soma_lista(lista) / len(lista)

def main():
    n = ler_numero()
    print(f"Números digitados: {sorted(n, reverse=True)}")
    print(f"Soma dos números: {soma_lista(n)}")
    print(f"Quantidade de números pares: {quantidade_par(n)}")
    print(f"Quantidade de números ímpares: {quantidade_impar(n)}")
    print(f"Média dos números: {media_lista(n)}")

if __name__ == "__main__":
    main()