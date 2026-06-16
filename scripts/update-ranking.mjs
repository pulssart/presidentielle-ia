import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";

const root = process.cwd();
const outputPath = path.join(root, "src/data/ranking.json");
const model = process.env.OPENAI_MODEL || "gpt-5";

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is missing. Add it to .env.local or the GitHub Actions secret.");
  process.exit(1);
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const existing = JSON.parse(await fs.readFile(outputPath, "utf8"));
const today = new Date().toISOString().slice(0, 10);

const prompt = `
Tu produis les donnees d'un site civique francais.

Objectif:
Classer les candidats declares, probables, possibles ou en primaire pour la prochaine election presidentielle francaise selon:
1. leur comprehension publique de l'intelligence artificielle
2. la presence du sujet IA dans leur programme ou leurs propositions
3. la precision des mesures
4. la prise en compte des risques sociaux, democratiques, culturels et economiques
5. la souverainete technologique francaise ou europeenne
6. le fait que le candidat, son equipe ou sa campagne ait reconnu ou non utiliser l'IA, avec source

Date d'analyse: ${today}

Contraintes:
Reste neutre politiquement.
Ne fais aucune recommandation de vote.
Ajoute les nouveaux candidats s'ils existent.
Retire les personnes qui ne sont plus plausiblement candidates.
Utilise uniquement des sources verifiables et recentes.
Chaque candidat doit avoir au moins une source.
Chaque candidat doit avoir un photoUrl public si disponible, idealement une miniature Wikimedia ou une source institutionnelle stable.
Ne donne pas un bon score parce qu'une personne est connue.
Penalise l'absence de programme IA explicite.
Cherche explicitement si le candidat, son equipe ou sa campagne utilise l'IA.
Ne considere pas un usage IA comme prouve sans source claire.
Si l'usage est seulement journalistiquement rapporte mais pas assume par le candidat, utilise "équipe probable".
Si aucune source fiable ne montre un usage, utilise "non trouvé".
L'usage reconnu de l'IA doit compter dans le score, mais ne doit pas compenser seul l'absence de programme, de mesures ou de comprehension du sujet.
Ecris en francais simple.

Donnees existantes a reviser:
${JSON.stringify(existing, null, 2)}

Retourne uniquement un JSON valide suivant exactement cette forme:
{
  "generatedAt": "ISO date string",
  "election": "Présidentielle française 2027",
  "summary": "string",
  "methodology": [
    {"name": "string", "weight": 30, "description": "string"}
  ],
  "candidates": [
    {
      "name": "string",
      "party": "string",
      "photoUrl": "https://...",
      "status": "déclaré | primaire gauche | probable | possible | incertain",
      "programStatus": "oui | partiel | faible | non établi",
      "aiUseStatus": "reconnu | équipe probable | non déclaré | non trouvé",
      "aiUseEvidence": "string",
      "score": 0,
      "trend": "up | stable | down",
      "evidence": "string",
      "risks": "string",
      "sources": [
        {"title": "string", "url": "https://..."}
      ]
    }
  ]
}
`;

const response = await client.responses.create({
  model,
  input: prompt,
  tools: [{ type: "web_search_preview" }],
});

const text = response.output_text?.trim();
if (!text) {
  throw new Error("OpenAI returned no text output.");
}

const jsonText = extractJson(text);
const data = JSON.parse(jsonText);
validate(data);

data.candidates.sort((a, b) => b.score - a.score);
await fs.writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Updated ${outputPath} with ${data.candidates.length} candidates.`);

function extractJson(value) {
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const first = value.indexOf("{");
  const last = value.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("Could not find a JSON object in OpenAI output.");
  }
  return value.slice(first, last + 1);
}

function validate(data) {
  if (!data || typeof data !== "object") throw new Error("Ranking payload must be an object.");
  if (!Array.isArray(data.methodology)) throw new Error("methodology must be an array.");
  if (!Array.isArray(data.candidates)) throw new Error("candidates must be an array.");
  if (data.candidates.length === 0) throw new Error("candidates cannot be empty.");

  for (const candidate of data.candidates) {
    const required = ["name", "party", "photoUrl", "status", "programStatus", "aiUseStatus", "aiUseEvidence", "score", "trend", "evidence", "risks", "sources"];
    for (const key of required) {
      if (!(key in candidate)) throw new Error(`Missing ${key} for candidate.`);
    }
    if (!Number.isFinite(candidate.score) || candidate.score < 0 || candidate.score > 100) {
      throw new Error(`Invalid score for ${candidate.name}.`);
    }
    if (!Array.isArray(candidate.sources) || candidate.sources.length === 0) {
      throw new Error(`Missing sources for ${candidate.name}.`);
    }
    if (candidate.photoUrl && !candidate.photoUrl.startsWith("http")) {
      throw new Error(`Invalid photoUrl for ${candidate.name}.`);
    }
    if (!["reconnu", "équipe probable", "non déclaré", "non trouvé"].includes(candidate.aiUseStatus)) {
      throw new Error(`Invalid aiUseStatus for ${candidate.name}.`);
    }
    for (const source of candidate.sources) {
      if (!source.title || !source.url || !source.url.startsWith("http")) {
        throw new Error(`Invalid source for ${candidate.name}.`);
      }
    }
  }
}
