def main():
    while True:
        lista = []
        sair = False
        for i in range(5):
            item = input(f"Digite o {i + 1}º item da lista ou 'sair' para encerrar: ")
            if item == "sair":
                sair = True
                break
            lista.append(item)
        print(*lista, sep=" - ", end="\n")
        if sair:
            break

if __name__ == "__main__":
    main()