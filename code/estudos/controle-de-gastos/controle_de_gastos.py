from re import match
from unittest import case


CATEGORIAS = { 1: "Alimentação", 2: "Transporte", 3: "Moradia", 4: "Lazer", 5: "Saúde", 6: "Educação", 7: "Outros" }

def cadastrar_gasto(gastos):
    print("Categorias disponíveis:")
    for key, value in CATEGORIAS.items():
        print(f"{key}: {value}")
    while True:
        try:
            categoria = int(input("Digite o número da categoria do gasto: "))
            if categoria in CATEGORIAS:
                break
            else:
                print("Categoria inválida. Digite um número válido.")
        except ValueError:
            print("Entrada inválida. Digite um número.")
    while True:
        try:
            valor = float(input("Digite o valor do gasto: "))
            if valor > 0:
                break
            else:
                print("O valor do gasto deve ser positivo.")
        except ValueError:
            print("Valor inválido. Digite um número.")

    descricao = input("Digite uma descrição para o gasto (opcional): ")

    gasto = {
            "categoria": CATEGORIAS[categoria],
            "valor": valor,
            "descricao": descricao
        }
    gastos.append(gasto)
    print("Gasto cadastrado com sucesso!")


def calcular_total_gastos(gastos):
    if not gastos:
        return None
    total = sum(gasto["valor"] for gasto in gastos)
    return total

def somar_gastos_por_categoria(gastos):
    totais = {}
    for gasto in gastos:
        categoria = gasto["categoria"]
        totais[categoria] = totais.get(categoria, 0) + gasto["valor"]
    return totais

def maior_gasto_por_categoria(gastos):
    if not gastos:
        return None
    totais = somar_gastos_por_categoria(gastos)
    categoria_maior = max(totais, key=totais.get)
    return categoria_maior, totais[categoria_maior]

def porcentagem_por_categoria(gastos):
    if not gastos:
        return None

    total = calcular_total_gastos(gastos)
    porcentagens = {}
    for categoria in CATEGORIAS.values():
        categoria_gastos = sum(gasto["valor"] for gasto in gastos if gasto["categoria"] == categoria)
        porcentagem = (categoria_gastos / total) * 100 if total > 0 else 0
        porcentagens[categoria] = porcentagem

    return porcentagens

def maior_gasto_registrado(gastos):
    if not gastos:
        return None
    maior = max(gastos, key=lambda gasto: gasto["valor"])
    return maior
    
def main():
    gastos = []
    while True:
        print("\nControle de Gastos")
        print("1. Cadastrar gasto")
        print("2. Listar gastos")
        print("3. Relatório de gastos")
        print("4. Sair")
        try:
            opcao = int(input("Escolha uma opção: "))

        except ValueError:
            print("Entrada inválida. Digite um número.")

        match opcao:
            case 1:
                cadastrar_gasto(gastos)
            case 2:
                if not gastos:
                    print("Nenhum gasto cadastrado.")
                else:
                    print("Gastos cadastrados:")
                    for gasto in gastos:
                        print(f"Categoria: {gasto['categoria']}, Valor: {gasto['valor']}, Descrição: {gasto['descricao']}")
            case 3:
                porcentagens = porcentagem_por_categoria(gastos)
                if not gastos:
                    print("Nenhum gasto cadastrado.")
                else:
                    print(f"{'Categoria':<15}{'Valor':>15}{'Porcentagem':>15}")
                    for gasto in gastos:
                        valor_str = f"R${gasto['valor']:.2f}"
                        porcentagem_str = f"{porcentagens[gasto['categoria']]:.2f}%"
                        print(f"{gasto['categoria']:<15}{valor_str:>15}{porcentagem_str:>15}")

                print(f"Total de gastos: R${calcular_total_gastos(gastos):.2f}")

                categoria_maior, total_maior = maior_gasto_por_categoria(gastos)
                print(f"\nCategoria com maior gasto total: {categoria_maior} - R${total_maior:.2f}")

                maior_gasto_reg = maior_gasto_registrado(gastos)
                if maior_gasto_reg:
                    print(f"Maior gasto registrado: {maior_gasto_reg['categoria']} - R${maior_gasto_reg['valor']:.2f} - Descrição: {maior_gasto_reg['descricao']}")
                            
            case 4:
                print("Saindo do programa.")
                break
        
if __name__ == "__main__":
    main()