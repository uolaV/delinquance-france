# Délinquance France

Statistiques de délinquance par commune et parti politique en France.  
Données publiques — sources : SSMSI (data.gouv.fr), résultats élections municipales.

## Stack

- **Backend** : Node.js + Fastify + PostgreSQL
- **Frontend** : Next.js 15 + Tailwind CSS + Mapbox GL
- **Data** : Python scripts pour importer les CSV SSMSI

## Démarrage local

```bash
cp .env.example .env
# Remplir les variables dans .env

docker compose up -d
```

## Structure

```
backend/     API Fastify (communes, criminalite, mandats, partis)
frontend/    Next.js (carte interactive, fiches communes, classements)
data/        Scripts Python pour importer les données SSMSI
```

## Sources des données

- [SSMSI — Statistiques de délinquance](https://www.data.gouv.fr/fr/datasets/bases-statistiques-communales-departementales-et-regionales-de-la-delinquance/)
- [Résultats élections municipales 2020](https://www.data.gouv.fr/fr/datasets/elections-municipales-2020-resultats-definitifs-du-1er-tour/)
- [Résultats élections municipales 2014](https://www.data.gouv.fr/fr/datasets/elections-municipales-2014-resultats-par-bureaux-de-vote/)
- [INSEE — Fichier des communes](https://www.insee.fr/fr/information/2028028)
- [INSEE — Filosofi (indice de pauvreté)](https://www.insee.fr/fr/statistiques/6036907)

## Charte éditoriale

Ce site affiche exclusivement des données publiques sans jugement de causalité.
Chaque chiffre est accompagné de la moyenne nationale pour le contexte.
Tous les partis sont traités de manière identique.
