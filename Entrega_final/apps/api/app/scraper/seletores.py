"""Seletores CSS do HTML devolvido pelo endpoint jobs-guest do LinkedIn.

Ficam todos aqui para que, quando o LinkedIn mudar o layout, só este arquivo precise mudar.
"""

# Cada vaga da lista é um card dentro de um <li>
CARD = "div.base-search-card"

# Atributo do card com o id da vaga, no formato "urn:li:jobPosting:4465379983"
ATRIBUTO_URN = "data-entity-urn"

TITULO = "h3.base-search-card__title"
EMPRESA = "h4.base-search-card__subtitle"
LOCAL = "span.job-search-card__location"
LINK = "a.base-card__full-link"

# A data vem no atributo datetime ("2026-10-22"). Vagas recentes usam a classe
# job-search-card__listdate--new, por isso o seletor pega qualquer <time> do card.
DATA = "time"

# --- Página de detalhe da vaga (endpoint jobs-guest/jobs/api/jobPosting/<id>) ---

# Texto completo do "sobre a vaga", em HTML (parágrafos, negrito, listas)
DETALHE_DESCRICAO = "div.show-more-less-html__markup"

# Cada critério é um <li> com o nome no <h3> e o valor no <span>
# ("Nível de experiência" = "Pleno-sênior", "Tipo de emprego" = "Tempo integral"...)
DETALHE_CRITERIO = "li.description__job-criteria-item"
DETALHE_CRITERIO_NOME = "h3"
DETALHE_CRITERIO_VALOR = "span"

# "Seja um dos 25 primeiros a se candidatar", "Mais de 200 candidaturas"...
DETALHE_CANDIDATOS = ".num-applicants__caption"

# "Há 2 semanas", "Há 1 ano"
DETALHE_PUBLICADA_HA = ".posted-time-ago__text"
