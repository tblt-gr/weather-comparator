# PRD — Application météo comparative historique (Next.js)

## 1. Objectif

Créer une application web permettant de comparer visuellement les températures historiques quotidiennes entre plusieurs années pour une ville donnée.

L’objectif principal est de visualiser rapidement l’évolution climatique d’un mois précis en comparant :
- l’année en cours,
- les années précédentes (N-1, N-2, etc.),
- avec affichage des températures minimales ou maximales.

L’application doit être rapide, simple, lisible et mobile-friendly.

---

# 2. Stack technique

## Frontend
- Next.js 15+
- TypeScript
- TailwindCSS
- shadcn/ui
- React Query / TanStack Query
- Zustand ou Context API pour l’état global

## Graphiques
- Recharts (préféré)
ou
- ECharts si besoin de meilleures performances

## API météo
API principale :
- Open-Meteo Historical API

Documentation :
https://open-meteo.com/en/docs/historical-weather-api

Pourquoi :
- gratuit,
- sans clé API,
- historique quotidien,
- fiable,
- simple.

---

# 3. Fonctionnalités principales

## 3.1 Sélection de ville

### UX
Champ autocomplete :
- nom ville,
- pays,
- région facultative.

### Source API
Open-Meteo Geocoding API :
https://geocoding-api.open-meteo.com/v1/search?name=Paris

### Données stockées

```ts
type City = {
  name: string
  latitude: number
  longitude: number
  country: string
}
```

---

# 4. Sélection temporelle

## Sélection du mois

L’utilisateur choisit :
- un mois,
- une année de référence.

Exemple :
- Juin 2025.

Le graphique affichera :
- tous les jours du mois,
- pour plusieurs années sélectionnées.

---

# 5. Comparaison multi-années

## Comportement par défaut

Afficher automatiquement :
- année actuelle,
- N-1,
- N-2,
- N-3.

Exemple :
- 2025
- 2024
- 2023
- 2022

---

## Sélection personnalisée

L’utilisateur peut :
- ajouter/enlever des années,
- via multi-select.

### UX attendue

```txt
✓ 2025
✓ 2024
✓ 2023
✓ 2022
☐ 2021
☐ 2020
```

Ne jamais afficher :
```txt
N-1
N-2
```

Toujours afficher :
```txt
2024
2023
```

---

# 6. Type de température

## Toggle

Choix :
- Température maximale
- Température minimale

## Valeur par défaut
- Température maximale

---

# 7. Visualisation graphique

## Type
Graphique en courbes multi-lignes.

## Axe X
- jours du mois :
```txt
1 → 31
```

## Axe Y
- température °C

---

## Courbes

Une courbe par année.

### Règles visuelles
- couleur unique par année,
- année actuelle :
  - trait plus épais,
  - mise en avant visuelle,
  - opacité 100%.

Anciennes années :
- opacité réduite,
- trait plus fin.

---

## Tooltip

Au hover :
```txt
12 juin

2025 → 31°C
2024 → 26°C
2023 → 28°C
```

---

## Légende

Affichage :
```txt
■ 2025
■ 2024
■ 2023
```

Cliquable :
- masquer/afficher une année.

---

# 8. Gestion des données

## Endpoint historique

https://archive-api.open-meteo.com/v1/archive

### Paramètres

```txt
latitude
longitude
start_date
end_date
daily=temperature_2m_max,temperature_2m_min
timezone=Europe/Paris
```

---

## Strategy fetch

Pour comparer plusieurs années :
- 1 requête par année,
ou
- batching parallèle via Promise.all.

---

## Normalisation

```ts
type DailyTemperature = {
  date: string
  day: number
  year: number
  tmax: number
  tmin: number
}
```

---

# 9. Gestion des jours manquants

Certaines années peuvent :
- avoir données absentes,
- ou jours incomplets.

Comportement :
- afficher `null`,
- la courbe doit être interrompue proprement.

Ne jamais interpoler automatiquement.

---

# 10. Responsive

## Desktop
- graphique pleine largeur,
- filtres horizontaux.

## Mobile
- filtres empilés,
- graphique scroll horizontal si nécessaire.

---

# 11. Performance

## Cache
Utiliser React Query :
- cache des requêtes météo,
- staleTime élevé.

---

## Optimisations
- debounced search ville,
- lazy loading graphique,
- memoization datasets.

---

# 12. Accessibilité

- contraste AA minimum,
- navigation clavier,
- tooltips accessibles,
- aria-label sur filtres.

---

# 13. États UI

## Loading
Skeleton graphique.

## Error
Message :
```txt
Impossible de charger les données météo.
```

## Empty
```txt
Aucune donnée disponible pour cette période.
```

---

# 14. Architecture frontend

## Pages

### `/`
Dashboard principal.

---

## Components

```txt
/components
  CitySearch.tsx
  MonthPicker.tsx
  YearSelector.tsx
  TemperatureToggle.tsx
  WeatherChart.tsx
  ChartLegend.tsx
```

---

# 15. Exemple de flow utilisateur

1. L’utilisateur ouvre l’app.
2. Ville par défaut :
   - dernière ville utilisée
   ou
   - géolocalisation.
3. Sélectionne :
   - Besançon,
   - Juin,
   - Tmax.
4. Le graphique affiche :
   - 2025,
   - 2024,
   - 2023,
   - 2022.
5. L’utilisateur ajoute :
   - 2021.
6. Le graphique se met à jour instantanément.

---

# 16. Future features (hors MVP)

## Comparaison climatologique
Afficher :
- moyenne 30 ans,
- normales saisonnières.

---

## Export
- PNG
- CSV

---

## Autres métriques
- précipitations,
- humidité,
- canicule,
- gel,
- anomalies thermiques.

---

# 17. Contraintes techniques

## Important
- Toutes les dates doivent être gérées en timezone locale.
- Ne jamais utiliser UTC brut pour l’affichage journalier.
- Gestion correcte des années bissextiles.

---

# 18. Critères d’acceptation

## Fonctionnels
- sélection ville fonctionnelle,
- sélection mois fonctionnelle,
- multi-années fonctionnel,
- switch Tmin/Tmax fonctionnel,
- graphique lisible,
- responsive mobile.

---

## Performance
- chargement < 2 secondes sur réseau normal,
- navigation fluide,
- aucun freeze graphique.

---

# 19. Exemple de dataset attendu

```json
[
  {
    "year": 2025,
    "values": [
      { "day": 1, "value": 25 },
      { "day": 2, "value": 27 }
    ]
  },
  {
    "year": 2024,
    "values": [
      { "day": 1, "value": 21 },
      { "day": 2, "value": 24 }
    ]
  }
]
```

---

# 20. Priorité MVP

## MVP obligatoire
- recherche ville,
- sélection mois,
- sélection années,
- Tmax/Tmin,
- graphique multi-courbes.

## Non prioritaire
- auth,
- comptes utilisateur,
- backend dédié,
- base de données,
- export.

---

# 21. Barre d’informations climatiques

Ajouter une barre d’informations au-dessus du graphique affichant des indicateurs climatologiques synthétiques.

---

# 21.1 Objectif

Permettre à l’utilisateur de contextualiser les températures observées par rapport :
- aux normales climatiques,
- aux moyennes historiques,
- aux épisodes extrêmes.

---

# 21.2 Contenu de la barre

## Indicateurs affichés

### Moyenne mensuelle observée

```txt
Moyenne juin 2025 : 24.3°C
```

Calcul :
- moyenne des Tmax ou Tmin affichées selon le mode sélectionné.

---

## Normale climatique 30 ans

```txt
Normale 1991–2020 : 22.1°C
```

---

## Écart à la normale

```txt
+2.2°C vs normale
```

Couleurs :
- positif → rouge/orange,
- négatif → bleu.

---

## Nombre de jours chauds

```txt
Jours > 30°C : 8
```

---

## Nombre de nuits tropicales

Condition :
```txt
Tmin >= 20°C
```

Exemple :
```txt
Nuits tropicales : 3
```

---

# 21.3 Design

Desktop :
```txt
┌────────────────────────────────────┐
| Moyenne | Normale | Écart | >30°C |
└────────────────────────────────────┘
```

Mobile :
- cartes empilées,
- horizontal scroll autorisé.

---

# 22. Normales saisonnières

## Définition

Les normales climatiques correspondent à la moyenne des températures sur 30 ans.

Référence standard :
```txt
1991–2020
```

---

## Affichage graphique

Ajouter une courbe supplémentaire optionnelle :
```txt
Normale saisonnière
```

### Style
- gris,
- pointillé,
- épaisseur moyenne.

---

## UX

Checkbox :
```txt
☑ Afficher normale climatique
```

---

# 23. Détection des canicules

## Objectif

Afficher visuellement les périodes de canicule.

---

# 23.1 Définition configurable

Par défaut (France simplifiée) :
- Tmax ≥ 30°C pendant ≥ 3 jours consécutifs.

Configuration future possible :
- seuils régionaux Météo-France,
- Tmin nocturne,
- humidex.

---

# 23.2 Affichage graphique

## Méthode recommandée

Ajouter :
- zone rouge translucide,
ou
- bande verticale colorée.

Exemple :
```txt
[ 12 juin → 16 juin ]
```

---

## Tooltip

Au hover :
```txt
Canicule
5 jours consécutifs
Tmax moyenne : 34°C
```

---

# 23.3 Liste complémentaire

Sous le graphique :
```txt
Canicules détectées :
- 12 → 16 juin 2025
- 03 → 05 août 2023
```

---

# 24. Export PNG

## Objectif

Permettre d’exporter le graphique en image.

---

# 24.1 Bouton UI

```txt
[ Export PNG ]
```

---

# 24.2 Contraintes techniques

Librairies possibles :
- html-to-image
- dom-to-image
- recharts-to-png

Le PNG doit inclure :
- axes,
- légende,
- courbes,
- normales,
- annotations canicule.

---

# 25. Export CSV

## Objectif

Exporter les données brutes affichées.

---

# 25.1 Contenu CSV

```csv
date,year,tmax,tmin
2025-06-01,2025,26.1,15.2
```

---

# 25.2 UX

Bouton :
```txt
[ Export CSV ]
```

---

# 26. Architecture supplémentaire

## Nouveaux composants

```txt
/components
  ClimateSummaryBar.tsx
  ExportButtons.tsx
  HeatwaveOverlay.tsx
  SeasonalNormalsToggle.tsx
```

---

# 27. Types TypeScript supplémentaires

## Normales climatiques

```ts
type ClimateNormal = {
  day: number
  value: number
}
```

---

## Canicule

```ts
type HeatwavePeriod = {
  start: string
  end: string
  duration: number
  averageMax: number
}
```

---

# 28. Algorithme canicule

## Pseudo-code

```ts
const heatwaves = []

for each consecutive day:
  if tmax >= 30:
     accumulate
  else:
     reset

if consecutiveDays >= 3:
   createHeatwave()
```

---

# 29. Données climatologiques recommandées

## Source principale
Open-Meteo Climate API

https://open-meteo.com/en/docs/climate-api

---

## Alternatives
- https://www.data.gouv.fr/fr/organizations/meteo-france/
- https://dev.meteostat.net/

---

# 30. Critères d’acceptation supplémentaires

## Export
- PNG fidèle au graphique affiché,
- CSV exploitable directement dans Excel.

---

## Canicule
- détection correcte des séquences,
- affichage lisible,
- aucune fausse continuité.

---

## Normales
- calcul cohérent,
- courbe distincte visuellement,
- désactivable.
