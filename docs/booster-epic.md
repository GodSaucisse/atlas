# Booster Épique : quatre cartes standard et une carte dédiée

Chaque ouverture d’un booster `evenement` conserve cinq cartes. Les emplacements
0–3 utilisent les taux standard existants. L’emplacement 4 utilise
`specialSlotRates`, calculé dans la même politique et avec le même instant que
les quatre autres tirages. Cela concerne aussi les boosters Épiques gagnés sur
les roues. Le prix et les règles d’attribution, de persistance et d’XP restent
ceux du booster existant.

| Cinquième carte | Hors événement | Halloween | 31 octobre 2026 (Paris) |
| --- | ---: | ---: | ---: |
| Précieuse | 78 % | 77,5 % | 76,625 % |
| Légendaire | 19 % | 19 % | 19 % |
| Suprême (James Bond inclus) | 2,5 % | 2,5 % | 2,5 % |
| Éditions spéciales | 0,5 % | 1 % | 1,875 % |

Le multiplicateur événementiel est le rapport entre le taux standard actuel
et le taux standard hors événement (0,40 %). La hausse des Éditions spéciales
est compensée exclusivement sur les Précieuses de cet emplacement.
James Bond occupe exactement 70 des 100 000 résultats possibles, inclus dans
les 2 500 résultats Suprêmes de cette cinquième carte. Il reste exclu du pool
uniforme des autres Suprêmes et conserve son exception de thème.

La section des probabilités distingue les quatre cartes standard et la cinquième
carte dédiée. `tests/epic-slot.cjs` parcourt tous les seuils des 100 000 résultats
pour chaque booster à cinq dates, y compris les deux limites de la journée
spéciale du 31 octobre, puis vérifie les taux affichés.
