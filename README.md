# Présidentielle IA 2027

Site civique qui classe les candidats déclarés, probables ou possibles à la présidentielle française 2027 selon leur compréhension de l'intelligence artificielle et la présence du sujet dans leur programme.

## Lancer le site

```bash
npm install
npm run dev
```

## Mettre à jour les données

```bash
cp .env.example .env.local
npm run update:ranking
```

Le script lit `OPENAI_API_KEY`, lance une recherche web via l'API Responses, puis écrit `src/data/ranking.json`.

## Cron quotidien

Le fichier `.github/workflows/update-ranking.yml` lance l'analyse chaque jour à 06:10 UTC et commite les nouvelles données si elles changent.

Ajoute `OPENAI_API_KEY` dans les secrets GitHub du dépôt avant d'activer le workflow.
