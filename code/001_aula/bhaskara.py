def calcular_bhaskara(a, b, c):
    if a == 0:
        return ("erro", "O valor de 'a' não pode ser zero.")

    delta = (b ** 2) - (4 * a * c)

    if delta < 0:
        return ("sem_raiz", "Não existem raízes reais.")

    if delta == 0:
        x = round(-b / (2 * a), 2)
        return ("uma_raiz", x)

    x1 = round((-b + delta ** 0.5) / (2 * a), 2)
    x2 = round((-b - delta ** 0.5) / (2 * a), 2)
    return ("duas_raizes", (x1, x2))


def main():
    print("--- calculadora de bhaskara ---")

    a = float(input("Digite o valor de a: "))
    b = float(input("Digite o valor de b: "))
    c = float(input("Digite o valor de c: "))

    caso, resultado = calcular_bhaskara(a, b, c)

    if caso == "erro":
        print(resultado)
    elif caso == "sem_raiz":
        print(resultado)
    elif caso == "uma_raiz":
        print(f"A equação possui uma raiz real: x = {resultado}")
    else:
        x1, x2 = resultado
        print(f"A equação possui duas raízes reais: x1 = {x1}, x2 = {x2}")


if __name__ == "__main__":
    main()