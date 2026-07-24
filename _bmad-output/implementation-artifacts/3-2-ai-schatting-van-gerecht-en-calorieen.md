# Story 3.2 — AI-schatting van gerecht en calorieën

Status: done

## Completion Notes

- `POST /api/foods/analyze` analyseert tekst, een tijdelijke foto of beide samen.
- Gestructureerde output bevat maximaal 20 items met gram, kcal, macro's, vezels en confidence.
- Tekst fungeert bij een foto als extra context; zonder foto blijft dezelfde standaardflow werken.
- Foto-bytes worden niet persistent opgeslagen.
