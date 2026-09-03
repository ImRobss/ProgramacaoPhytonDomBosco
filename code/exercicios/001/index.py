def nome():
    name = input("digite seu nome: ")
    return name

def main():
    name = nome()
    print(f"Ola {name}, prazer em te conhecer!")

if __name__ == "__main__":
    main()
