import unittest
from bhaskara import calcular_bhaskara


class TestBhaskara(unittest.TestCase):

    def test_a_igual_zero_retorna_erro(self):
        caso, resultado = calcular_bhaskara(0, 2, 3)
        self.assertEqual(caso, "erro")

    def test_delta_negativo_sem_raiz_real(self):
        caso, resultado = calcular_bhaskara(1, 1, 1)
        self.assertEqual(caso, "sem_raiz")
        self.assertIsNone(resultado)

    def test_delta_zero_uma_raiz(self):
        caso, resultado = calcular_bhaskara(1, 2, 1)
        self.assertEqual(caso, "uma_raiz")
        self.assertEqual(resultado, -1.0)

    def test_delta_positivo_duas_raizes(self):
        caso, resultado = calcular_bhaskara(1, -5, 6)
        self.assertEqual(caso, "duas_raizes")
        x1, x2 = resultado
        self.assertEqual(x1, 3.0)
        self.assertEqual(x2, 2.0)


if __name__ == "__main__":
    unittest.main()
